export function loadAppointments() {
    if (!currentUser) return;

    const content = document.getElementById('content');
    content.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">Appointments</h2>
    <div class="flex flex-col md:flex-row justify-between mb-4 space-y-2 md:space-y-0">
        <button class="btn btn-primary" id="addAppointmentButton">Add Appointment</button>
        <input type="text" id="searchInput" class="input input-bordered" placeholder="Search by patient name">
        <select id="entriesSelect" class="select select-bordered">
            <option value="5">5 entries</option>
            <option value="10" selected>10 entries</option>
            <option value="15">15 entries</option>
            <option value="20">20 entries</option>
        </select>
    </div>
    <div class="flex flex-col md:flex-row justify-between mb-4 space-y-2 md:space-y-0">
        <select id="filterStatus" class="select select-bordered">
            <option value="">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
        </select>
        <select id="sortOrder" class="select select-bordered">
            <option value="dateAsc">Date Ascending</option>
            <option value="dateDesc">Date Descending</option>
        </select>
    </div>
    <div class="overflow-x-auto">
        <table class="table-auto w-full mb-4">
            <thead>
                <tr>
                    <th class="px-4 py-2">Patient Name</th>
                    <th class="px-4 py-2">Date</th>
                    <th class="px-4 py-2">Time</th>
                    <th class="px-4 py-2">Status</th>
                    <th class="px-4 py-2">Contact</th>
                    <th class="px-4 py-2">Actions</th>
                </tr>
            </thead>
            <tbody id="appointmentsList"></tbody>
        </table>
    </div>
    <div id="emptyState" class="hidden text-center">
        <img src="es.gif" alt="No appointments available" class="mx-auto mb-4" style="max-width: 300px;">
        <p>No appointments available. Add an appointment to get started.</p>
    </div>
    <div id="pagination" class="flex justify-center mt-4"></div>
    `;

    document.getElementById('addAppointmentButton').addEventListener('click', showAddAppointmentForm);
    document.getElementById('searchInput').addEventListener('input', fetchAppointments);
    document.getElementById('entriesSelect').addEventListener('change', fetchAppointments);
    document.getElementById('filterStatus').addEventListener('change', fetchAppointments);
    document.getElementById('sortOrder').addEventListener('change', fetchAppointments);

    fetchAppointments();
}

let allAppointments = [];
let currentPage = 1;

function fetchAppointments() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const entriesPerPage = parseInt(document.getElementById('entriesSelect').value);
    const filterStatus = document.getElementById('filterStatus').value;
    const sortOrder = document.getElementById('sortOrder').value;

    db.collection('appointments').get().then((querySnapshot) => {
        allAppointments = [];
        querySnapshot.forEach((doc) => {
            const appointment = doc.data();
            appointment.id = doc.id;
            allAppointments.push(appointment);
        });

        let filteredAppointments = allAppointments.filter(appointment =>
            appointment.patientName.toLowerCase().includes(searchQuery) &&
            (filterStatus === '' || appointment.status === filterStatus)
        );

        if (sortOrder === 'dateAsc') {
            filteredAppointments.sort((a, b) => new Date(a.date) - new Date(b.date));
        } else if (sortOrder === 'dateDesc') {
            filteredAppointments.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        renderAppointments(filteredAppointments, entriesPerPage);
    }).catch((error) => {
        console.error('Error fetching appointments:', error);
    });
}

function renderAppointments(appointments, entriesPerPage) {
    const appointmentsList = document.getElementById('appointmentsList');
    const emptyState = document.getElementById('emptyState');
    appointmentsList.innerHTML = '';

    if (appointments.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        const startIndex = (currentPage - 1) * entriesPerPage;
        const endIndex = startIndex + entriesPerPage;
        const paginatedAppointments = appointments.slice(startIndex, endIndex);

        paginatedAppointments.forEach((appointment) => {
            appointmentsList.innerHTML += `
            <tr>
                <td class="border px-4 py-2">${appointment.patientName}</td>
                <td class="border px-4 py-2">${appointment.date}</td>
                <td class="border px-4 py-2">${appointment.time}</td>
                <td class="border px-4 py-2">${appointment.status || 'Scheduled'}</td>
                <td class="border px-4 py-2"><a href="https://wa.me/${appointment.contact}" target="_blank">${appointment.contact}</a></td>
                <td class="border px-4 py-2">
                    <button class="btn btn-primary" onclick="window.editAppointment('${appointment.id}')">Edit</button>
                    <button class="btn btn-error" onclick="window.deleteAppointment('${appointment.id}')">Delete</button>
                </td>
            </tr>
            `;
        });

        renderPagination(appointments.length, entriesPerPage);
    }
}

function renderPagination(totalEntries, entriesPerPage) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    const totalPages = Math.ceil(totalEntries / entriesPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = `btn ${i === currentPage ? 'btn-primary' : 'btn-secondary'} mx-1`;
        pageButton.addEventListener('click', () => {
            currentPage = i;
            fetchAppointments();
        });
        pagination.appendChild(pageButton);
    }
}

function showAddAppointmentForm() {
    const content = document.getElementById('content');
    content.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">Add Appointment</h2>
    <form id="addAppointmentForm">
        <div class="form-control">
            <label class="label">
                <span class="label-text">Patient</span>
            </label>
            <select id="patientSelect" class="select select-bordered" required></select>
        </div>
        <div class="form-control">
            <label class="label">
                <span class="label-text">Date</span>
            </label>
            <input type="date" id="appointmentDate" class="input input-bordered" required>
        </div>
        <div class="form-control">
            <label class="label">
                <span class="label-text">Time</span>
            </label>
            <input type="time" id="appointmentTime" class="input input-bordered" required>
        </div>
        <div class="form-control">
            <label class="label">
                <span class="label-text">Status</span>
            </label>
            <select id="appointmentStatus" class="select select-bordered" required>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
            </select>
        </div>
        <div class="flex justify-between mt-4">
            <button type="submit" class="btn btn-primary">Add Appointment</button>
            <button type="button" class="btn btn-secondary" onclick="loadAppointments()">Cancel</button>
        </div>
    </form>
    `;

    loadPatients();
    document.getElementById('addAppointmentForm').addEventListener('submit', addAppointment);
}

function loadPatients() {
    db.collection('patients').orderBy('createdAt', 'desc').limit(5).get().then((querySnapshot) => {
        const patientSelect = document.getElementById('patientSelect');
        patientSelect.innerHTML = ''; // Clear previous options
        querySnapshot.forEach((doc) => {
            const patient = doc.data();
            patientSelect.innerHTML += `<option value="${doc.id}" data-contact="${patient.contact}">${patient.name}</option>`;
        });

        // Initialize Select2 for searchable dropdown
        $('#patientSelect').select2({
            placeholder: 'Select a patient',
            allowClear: true,
            width: '100%' // Ensure the dropdown fits the container
        });
    }).catch((error) => {
        console.error('Error loading patients:', error);
    });
}

function addAppointment(event) {
    event.preventDefault();

    const patientSelect = document.getElementById('patientSelect');
    const selectedOption = patientSelect.options[patientSelect.selectedIndex];
    const patientId = selectedOption.value;
    const patientName = selectedOption.textContent;
    const contact = selectedOption.getAttribute('data-contact');

    const appointmentDate = document.getElementById('appointmentDate').value;
    const appointmentTime = document.getElementById('appointmentTime').value;
    const appointmentStatus = document.getElementById('appointmentStatus').value;

    db.collection('appointments').add({
        patientId: patientId,
        patientName: patientName,
        date: appointmentDate,
        time: appointmentTime,
        status: appointmentStatus,
        contact: contact,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        loadAppointments();
    }).catch((error) => {
        console.error('Error adding appointment:', error);
    });
}

window.deleteAppointment = function (id) {
    if (confirm('Are you sure you want to delete this appointment?')) {
        db.collection('appointments').doc(id).delete().then(() => {
            fetchAppointments();
        }).catch((error) => {
            console.error('Error deleting appointment:', error);
        });
    }
};

window.editAppointment = function (id) {
    db.collection('appointments').doc(id).get().then((doc) => {
        if (doc.exists) {
            const appointment = doc.data();
            const content = document.getElementById('content');
            content.innerHTML = `
            <h2 class="text-2xl font-bold mb-4">Edit Appointment</h2>
            <form id="editAppointmentForm">
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">Patient</span>
                    </label>
                    <select id="patientSelect" class="select select-bordered" required></select>
                </div>
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">Date</span>
                    </label>
                    <input type="date" id="appointmentDate" class="input input-bordered" value="${appointment.date}" required>
                </div>
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">Time</span>
                    </label>
                    <input type="time" id="appointmentTime" class="input input-bordered" value="${appointment.time}" required>
                </div>
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">Status</span>
                    </label>
                    <select id="appointmentStatus" class="select select-bordered" required>
                        <option value="Scheduled" ${appointment.status === 'Scheduled' ? 'selected' : ''}>Scheduled</option>
                        <option value="Completed" ${appointment.status === 'Completed' ? 'selected' : ''}>Completed</option>
                        <option value="Cancelled" ${appointment.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
                <div class="flex justify-between mt-4">
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                    <button type="button" class="btn btn-secondary" onclick="loadAppointments()">Cancel</button>
                </div>
            </form>
            `;

            loadPatients(() => {
                document.getElementById('patientSelect').value = appointment.patientId;
            });
            document.getElementById('editAppointmentForm').addEventListener('submit', (event) => {
                event.preventDefault();
                updateAppointment(id);
            });
        } else {
            console.error('No such document!');
        }
    }).catch((error) => {
        console.error('Error getting document:', error);
    });
};

function updateAppointment(id) {
    const patientSelect = document.getElementById('patientSelect');
    const selectedOption = patientSelect.options[patientSelect.selectedIndex];
    const patientId = selectedOption.value;
    const patientName = selectedOption.textContent;
    const contact = selectedOption.getAttribute('data-contact');

    const appointmentDate = document.getElementById('appointmentDate').value;
    const appointmentTime = document.getElementById('appointmentTime').value;
    const appointmentStatus = document.getElementById('appointmentStatus').value;

    db.collection('appointments').doc(id).update({
        patientId: patientId,
        patientName: patientName,
        date: appointmentDate,
        time: appointmentTime,
        status: appointmentStatus,
        contact: contact,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        loadAppointments();
    }).catch((error) => {
        console.error('Error updating appointment:', error);
    });
}
