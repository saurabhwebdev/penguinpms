export function loadAppointments() {
    if (!currentUser) return;

    const content = document.getElementById('content');
    content.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">Appointments</h2>
    <button class="btn btn-primary mb-4" id="addAppointmentButton">Add Appointment</button>
    <div id="appointmentsList" class="grid grid-cols-1 gap-4"></div>
    `;

    document.getElementById('addAppointmentButton').addEventListener('click', showAddAppointmentForm);

    fetchAppointments();
}

function fetchAppointments() {
    db.collection('appointments').get().then((querySnapshot) => {
        const appointmentsList = document.getElementById('appointmentsList');
        appointmentsList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const appointment = doc.data();
            appointmentsList.innerHTML += `
            <div class="card mb-4 bg-base-100 shadow-md">
                <div class="card-body flex flex-row items-center justify-between">
                    <div>
                        <h3 class="card-title">${appointment.patientName}</h3>
                        <p>Date: ${appointment.date}</p>
                        <p>Time: ${appointment.time}</p>
                        <p>Contact: <a href="https://wa.me/${appointment.contact}" target="_blank">${appointment.contact}</a></p>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-primary" onclick="window.editAppointment('${doc.id}')">Edit</button>
                        <button class="btn btn-error" onclick="window.deleteAppointment('${doc.id}')">Delete</button>
                    </div>
                </div>
            </div>
            `;
        });
    }).catch((error) => {
        console.error('Error fetching appointments:', error);
    });
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
        <button type="submit" class="btn btn-primary mt-4">Add Appointment</button>
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

function addAppointment(e) {
    e.preventDefault();
    const patientSelect = document.getElementById('patientSelect');
    const selectedOption = patientSelect.options[patientSelect.selectedIndex];
    const patientName = selectedOption.text;
    const contact = selectedOption.getAttribute('data-contact');
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;

    db.collection('appointments').add({
        patientName: patientName,
        contact: contact,
        date: date,
        time: time
    }).then(() => {
        console.log('Appointment added');
        loadAppointments();
    }).catch((error) => {
        console.error('Error adding appointment:', error);
    });
}

// Attach functions to the window object to make them globally accessible
window.editAppointment = function(appointmentId) {
    db.collection('appointments').doc(appointmentId).get().then((doc) => {
        if (doc.exists) {
            const appointment = doc.data();
            const content = document.getElementById('content');
            content.innerHTML = `
            <h2 class="text-2xl font-bold mb-4">Edit Appointment</h2>
            <form id="editAppointmentForm">
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">Patient Name</span>
                    </label>
                    <input type="text" id="patientName" class="input input-bordered" value="${appointment.patientName}" required>
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
                <button type="submit" class="btn btn-primary mt-4">Update Appointment</button>
            </form>
            `;

            document.getElementById('editAppointmentForm').addEventListener('submit', (e) => updateAppointment(e, appointmentId));
        } else {
            console.log('No such appointment!');
        }
    }).catch((error) => {
        console.error('Error getting appointment:', error);
    });
}

window.updateAppointment = function(e, appointmentId) {
    e.preventDefault();
    const patientName = document.getElementById('patientName').value;
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;

    db.collection('appointments').doc(appointmentId).update({
        patientName: patientName,
        date: date,
        time: time
    }).then(() => {
        console.log('Appointment updated');
        loadAppointments();
    }).catch((error) => {
        console.error('Error updating appointment:', error);
    });
}

window.deleteAppointment = function(appointmentId) {
    if (confirm('Are you sure you want to delete this appointment?')) {
        db.collection('appointments').doc(appointmentId).delete().then(() => {
            console.log('Appointment deleted');
            loadAppointments();
        }).catch((error) => {
            console.error('Error deleting appointment:', error);
        });
    }
}