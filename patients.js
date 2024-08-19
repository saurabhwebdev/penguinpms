// Include Quill CSS and JS in your HTML file
// <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
// <script src="https://cdn.quilljs.com/1.3.6/quill.min.js"></script>
// Include SheetJS for Excel file processing
// <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.16.9/xlsx.full.min.js"></script>

export function loadPatients() {
    if (!currentUser) return;

    const content = document.getElementById('content');
    content.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">Patients</h2>
    <div class="flex justify-between items-center mb-4">
        <button class="btn btn-primary" id="addPatientButton">Add Patient</button>
        <div>
            <label for="entriesSelect" class="mr-2">Show entries:</label>
            <select id="entriesSelect" class="select select-bordered">
                <option value="5">5</option>
                <option value="10" selected>10</option>
                <option value="20">20</option>
            </select>
        </div>
    </div>
    <div class="flex justify-between items-center mb-4">
        <input type="text" id="searchInput" class="input input-bordered w-full" placeholder="Search patients...">
        <select id="sortOrder" class="select select-bordered ml-4">
            <option value="nameAsc">Name Ascending</option>
            <option value="nameDesc">Name Descending</option>
            <option value="ageAsc">Age Ascending</option>
            <option value="ageDesc">Age Descending</option>
        </select>
    </div>
    <table class="table-auto w-full mb-4">
        <thead>
            <tr>
                <th class="px-4 py-2">Name</th>
                <th class="px-4 py-2">Age</th>
                <th class="px-4 py-2">Gender</th>
                <th class="px-4 py-2">Email</th>
                <th class="px-4 py-2">Blood Group</th>
                <th class="px-4 py-2">Contact</th>
                <th class="px-4 py-2">Actions</th>
            </tr>
        </thead>
        <tbody id="patientsList"></tbody>
    </table>
    <div id="emptyState" class="hidden text-center">
        <img src="es.gif" alt="No patients available" class="mx-auto mb-4" style="max-width: 300px;">
        <p>No patients available. Add a patient to get started.</p>
    </div>
    <div id="pagination" class="flex justify-center mt-4"></div>
    `;

    document.getElementById('addPatientButton').addEventListener('click', showAddPatientForm);
    document.getElementById('entriesSelect').addEventListener('change', fetchPatients);
    document.getElementById('searchInput').addEventListener('input', fetchPatients);
    document.getElementById('sortOrder').addEventListener('change', fetchPatients);

    fetchPatients();
}

let allPatients = [];
let currentPage = 1;

function fetchPatients() {
    const entries = parseInt(document.getElementById('entriesSelect').value);
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const sortOrder = document.getElementById('sortOrder').value;

    db.collection('patients').get().then((querySnapshot) => {
        allPatients = [];
        querySnapshot.forEach((doc) => {
            const patient = doc.data();
            patient.id = doc.id;
            allPatients.push(patient);
        });

        let filteredPatients = allPatients.filter(patient =>
            patient.name.toLowerCase().includes(searchQuery) || patient.email.toLowerCase().includes(searchQuery)
        );

        if (sortOrder === 'nameAsc') {
            filteredPatients.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortOrder === 'nameDesc') {
            filteredPatients.sort((a, b) => b.name.localeCompare(a.name));
        } else if (sortOrder === 'ageAsc') {
            filteredPatients.sort((a, b) => a.age - b.age);
        } else if (sortOrder === 'ageDesc') {
            filteredPatients.sort((a, b) => b.age - a.age);
        }

        renderPatients(filteredPatients, entries);
    }).catch((error) => {
        console.error('Error fetching patients:', error);
    });
}

function renderPatients(patients, entriesPerPage) {
    const patientsList = document.getElementById('patientsList');
    const emptyState = document.getElementById('emptyState');
    patientsList.innerHTML = '';

    if (patients.length === 0) {
        emptyState.classList.remove('hidden');
        patientsList.classList.add('hidden');
    } else {
        emptyState.classList.add('hidden');
        patientsList.classList.remove('hidden');

        const startIndex = (currentPage - 1) * entriesPerPage;
        const endIndex = startIndex + entriesPerPage;
        const paginatedPatients = patients.slice(startIndex, endIndex);

        paginatedPatients.forEach((patient) => {
            patientsList.innerHTML += `
            <tr class="hover:bg-gray-100 cursor-pointer" onclick="window.showPatientDetails('${patient.id}')">
                <td class="border px-4 py-2">${patient.name}</td>
                <td class="border px-4 py-2">${patient.age}</td>
                <td class="border px-4 py-2">${patient.gender}</td>
                <td class="border px-4 py-2">${patient.email}</td>
                <td class="border px-4 py-2">${patient.bloodGroup}</td>
                <td class="border px-4 py-2">${patient.contact}</td>
                <td class="border px-4 py-2">
                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); window.editPatient('${patient.id}')">Edit</button>
                    <button class="btn btn-sm btn-error" onclick="event.stopPropagation(); window.deletePatient('${patient.id}')">Delete</button>
                </td>
            </tr>
            `;
        });

        renderPagination(patients.length, entriesPerPage);
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
            fetchPatients();
        });
        pagination.appendChild(pageButton);
    }
}

function showAddPatientForm() {
    const content = document.getElementById('content');
    content.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">Add Patient</h2>
    <form id="addPatientForm" class="space-y-4">
        <div class="form-control">
            <label class="label">
                <span class="label-text">Name</span>
            </label>
            <input type="text" id="patientName" class="input input-bordered" required>
        </div>
        <div class="form-control">
            <label class="label">
                <span class="label-text">Age</span>
            </label>
            <input type="number" id="patientAge" class="input input-bordered" required>
        </div>
        <div class="form-control">
            <label class="label">
                <span class="label-text">Gender</span>
            </label>
            <select id="patientGender" class="select select-bordered" required>
                <option value="" disabled selected>Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
            </select>
        </div>
        <div class="form-control">
            <label class="label">
                <span class="label-text">Email</span>
            </label>
            <input type="email" id="patientEmail" class="input input-bordered" required>
        </div>
        <div class="form-control">
            <label class="label">
                <span class="label-text">Blood Group</span>
            </label>
            <select id="patientBloodGroup" class="select select-bordered" required>
                <option value="" disabled selected>Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
            </select>
        </div>
        <div class="form-control">
            <label class="label">
                <span class="label-text">Contact</span>
            </label>
            <input type="text" id="patientContact" class="input input-bordered" required>
        </div>
        <div class="form-control">
            <label class="label">
                <span class="label-text">Patient Note</span>
            </label>
            <div id="patientNoteEditor" class="textarea textarea-bordered"></div>
        </div>
        <div class="form-control">
            <label class="label">
                <span class="label-text">Upload Reports</span>
            </label>
            <input type="file" id="patientReports" class="input input-bordered" multiple>
        </div>
        <div class="flex justify-between">
            <button type="submit" class="btn btn-primary mt-4">Add Patient</button>
            <button type="button" class="btn btn-secondary mt-4" onclick="loadPatients()">Cancel</button>
        </div>
    </form>
    `;

    const quill = new Quill('#patientNoteEditor', {
        theme: 'snow'
    });

    document.getElementById('addPatientForm').addEventListener('submit', (e) => addPatient(e, quill));
}

function addPatient(e, quill) {
    e.preventDefault();
    const name = document.getElementById('patientName').value;
    const age = document.getElementById('patientAge').value;
    const gender = document.getElementById('patientGender').value;
    const email = document.getElementById('patientEmail').value;
    const bloodGroup = document.getElementById('patientBloodGroup').value;
    const contact = document.getElementById('patientContact').value;
    const note = quill.root.innerHTML;
    const reports = document.getElementById('patientReports').files;

    // Handle file uploads and other data here

    db.collection('patients').add({
        name: name,
        age: parseInt(age),
        gender: gender,
        email: email,
        bloodGroup: bloodGroup,
        contact: contact,
        note: note,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        console.log('Patient added');
        loadPatients();
    }).catch((error) => {
        console.error('Error adding patient:', error);
    });
}

window.showPatientDetails = function(patientId) {
    db.collection('patients').doc(patientId).get().then((doc) => {
        if (doc.exists) {
            const patient = doc.data();
            const content = document.getElementById('content');
            content.innerHTML = `
            <h2 class="text-2xl font-bold mb-4">Patient Details</h2>
            <div class="card bg-base-100 shadow-md p-4">
                <h3 class="card-title text-lg font-semibold">${patient.name}</h3>
                <p class="text-sm"><strong>Age:</strong> ${patient.age}, <strong>Gender:</strong> ${patient.gender}, <strong>Email:</strong> ${patient.email}, <strong>Blood Group:</strong> ${patient.bloodGroup}, <strong>Contact:</strong> ${patient.contact}</p>
                <p class="text-sm"><strong>Note:</strong> ${patient.note}</p>
                <!-- Add logic to display uploaded reports -->
                <div class="card-actions justify-end mt-2">
                    <button class="btn btn-sm btn-primary" onclick="window.editPatient('${doc.id}')">Edit</button>
                    <button class="btn btn-sm btn-secondary" onclick="loadPatients()">Back</button>
                </div>
            </div>
            <h3 class="text-xl font-bold mt-6">Appointment History</h3>
            <div id="appointmentTimeline" class="timeline mt-4"></div>
            `;

            loadAppointmentHistory(patientId);
        } else {
            console.log('No such patient!');
        }
    }).catch((error) => {
        console.error('Error getting patient:', error);
    });
}

function loadAppointmentHistory(patientId) {
    db.collection('appointments').where('patientId', '==', patientId).orderBy('date', 'desc').get().then((querySnapshot) => {
        const timeline = document.getElementById('appointmentTimeline');
        timeline.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const appointment = doc.data();
            timeline.innerHTML += `
            <div class="timeline-item mb-4">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <p class="text-sm"><strong>Date:</strong> ${new Date(appointment.date.toDate()).toLocaleDateString()}</p>
                    <p class="text-sm"><strong>Doctor:</strong> ${appointment.doctor}</p>
                    <p class="text-sm"><strong>Notes:</strong> ${appointment.notes}</p>
                </div>
            </div>
            `;
        });
    }).catch((error) => {
        console.error('Error fetching appointment history:', error);
    });
}

window.editPatient = function(patientId) {
    db.collection('patients').doc(patientId).get().then((doc) => {
        if (doc.exists) {
            const patient = doc.data();
            const content = document.getElementById('content');
            content.innerHTML = `
            <h2 class="text-2xl font-bold mb-4">Edit Patient</h2>
            <form id="editPatientForm" class="space-y-4">
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">Name</span>
                    </label>
                    <input type="text" id="patientName" class="input input-bordered" value="${patient.name}" required>
                </div>
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">Age</span>
                    </label>
                    <input type="number" id="patientAge" class="input input-bordered" value="${patient.age}" required>
                </div>
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">Gender</span>
                    </label>
                    <select id="patientGender" class="select select-bordered" required>
                        <option value="Male" ${patient.gender === 'Male' ? 'selected' : ''}>Male</option>
                        <option value="Female" ${patient.gender === 'Female' ? 'selected' : ''}>Female</option>
                        <option value="Other" ${patient.gender === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">Email</span>
                    </label>
                    <input type="email" id="patientEmail" class="input input-bordered" value="${patient.email}" required>
                </div>
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">Blood Group</span>
                    </label>
                    <select id="patientBloodGroup" class="select select-bordered" required>
                        <option value="A+" ${patient.bloodGroup === 'A+' ? 'selected' : ''}>A+</option>
                        <option value="A-" ${patient.bloodGroup === 'A-' ? 'selected' : ''}>A-</option>
                        <option value="B+" ${patient.bloodGroup === 'B+' ? 'selected' : ''}>B+</option>
                        <option value="B-" ${patient.bloodGroup === 'B-' ? 'selected' : ''}>B-</option>
                        <option value="AB+" ${patient.bloodGroup === 'AB+' ? 'selected' : ''}>AB+</option>
                        <option value="AB-" ${patient.bloodGroup === 'AB-' ? 'selected' : ''}>AB-</option>
                        <option value="O+" ${patient.bloodGroup === 'O+' ? 'selected' : ''}>O+</option>
                        <option value="O-" ${patient.bloodGroup === 'O-' ? 'selected' : ''}>O-</option>
                    </select>
                </div>
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">Contact</span>
                    </label>
                    <input type="text" id="patientContact" class="input input-bordered" value="${patient.contact}" required>
                </div>
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">Patient Note</span>
                    </label>
                    <div id="patientNoteEditor" class="textarea textarea-bordered">${patient.note}</div>
                </div>
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">Upload Reports</span>
                    </label>
                    <input type="file" id="patientReports" class="input input-bordered" multiple>
                </div>
                <div class="flex justify-between">
                    <button type="submit" class="btn btn-primary mt-4">Update Patient</button>
                    <button type="button" class="btn btn-secondary mt-4" onclick="loadPatients()">Cancel</button>
                </div>
            </form>
            `;

            const quill = new Quill('#patientNoteEditor', {
                theme: 'snow'
            });

            document.getElementById('editPatientForm').addEventListener('submit', (e) => updatePatient(e, patientId, quill));
        } else {
            console.log('No such patient!');
        }
    }).catch((error) => {
        console.error('Error getting patient:', error);
    });
}

window.updatePatient = function(e, patientId, quill) {
    e.preventDefault();
    const name = document.getElementById('patientName').value;
    const age = document.getElementById('patientAge').value;
    const gender = document.getElementById('patientGender').value;
    const email = document.getElementById('patientEmail').value;
    const bloodGroup = document.getElementById('patientBloodGroup').value;
    const contact = document.getElementById('patientContact').value;
    const note = quill.root.innerHTML;
    const reports = document.getElementById('patientReports').files;

    // Handle file uploads and other data here

    db.collection('patients').doc(patientId).update({
        name: name,
        age: parseInt(age),
        gender: gender,
        email: email,
        bloodGroup: bloodGroup,
        contact: contact,
        note: note
    }).then(() => {
        console.log('Patient updated');
        loadPatients();
    }).catch((error) => {
        console.error('Error updating patient:', error);
    });
}

window.deletePatient = function(patientId) {
    if (confirm('Are you sure you want to delete this patient?')) {
        db.collection('patients').doc(patientId).delete().then(() => {
            console.log('Patient deleted');
            loadPatients();
        }).catch((error) => {
            console.error('Error deleting patient:', error);
        });
    }
}