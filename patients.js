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
    <div id="patientsList"></div>
    `;

    document.getElementById('addPatientButton').addEventListener('click', showAddPatientForm);
    document.getElementById('entriesSelect').addEventListener('change', fetchPatients);

    fetchPatients();
}

function fetchPatients() {
    const entries = parseInt(document.getElementById('entriesSelect').value);
    db.collection('patients').orderBy('createdAt', 'desc').limit(entries).get().then((querySnapshot) => {
        const patientsList = document.getElementById('patientsList');
        patientsList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const patient = doc.data();
            patientsList.innerHTML += `
            <div class="card mb-2 bg-base-100 shadow-md">
                <div class="card-body p-4">
                    <h3 class="card-title text-lg font-semibold">${patient.name}</h3>
                    <p class="text-sm"><strong>Age:</strong> ${patient.age}, <strong>Gender:</strong> ${patient.gender}, <strong>Email:</strong> ${patient.email}, <strong>Blood Group:</strong> ${patient.bloodGroup}, <strong>Contact:</strong> ${patient.contact}</p>
                    <div class="card-actions justify-end mt-2">
                        <button class="btn btn-sm btn-primary" onclick="window.editPatient('${doc.id}')">Edit</button>
                        <button class="btn btn-sm btn-error" onclick="window.deletePatient('${doc.id}')">Delete</button>
                    </div>
                </div>
            </div>
            `;
        });
    }).catch((error) => {
        console.error('Error fetching patients:', error);
    });
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
        <button type="submit" class="btn btn-primary mt-4">Add Patient</button>
    </form>
    `;

    document.getElementById('addPatientForm').addEventListener('submit', addPatient);
}

function addPatient(e) {
    e.preventDefault();
    const name = document.getElementById('patientName').value;
    const age = document.getElementById('patientAge').value;
    const gender = document.getElementById('patientGender').value;
    const email = document.getElementById('patientEmail').value;
    const bloodGroup = document.getElementById('patientBloodGroup').value;
    const contact = document.getElementById('patientContact').value;

    db.collection('patients').add({
        name: name,
        age: parseInt(age),
        gender: gender,
        email: email,
        bloodGroup: bloodGroup,
        contact: contact,
        createdAt: firebase.firestore.FieldValue.serverTimestamp() // Add the createdAt field
    }).then(() => {
        console.log('Patient added');
        loadPatients();
    }).catch((error) => {
        console.error('Error adding patient:', error);
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
                <button type="submit" class="btn btn-primary mt-4">Update Patient</button>
            </form>
            `;

            document.getElementById('editPatientForm').addEventListener('submit', (e) => updatePatient(e, patientId));
        } else {
            console.log('No such patient!');
        }
    }).catch((error) => {
        console.error('Error getting patient:', error);
    });
}

window.updatePatient = function(e, patientId) {
    e.preventDefault();
    const name = document.getElementById('patientName').value;
    const age = document.getElementById('patientAge').value;
    const gender = document.getElementById('patientGender').value;
    const email = document.getElementById('patientEmail').value;
    const bloodGroup = document.getElementById('patientBloodGroup').value;
    const contact = document.getElementById('patientContact').value;

    db.collection('patients').doc(patientId).update({
        name: name,
        age: parseInt(age),
        gender: gender,
        email: email,
        bloodGroup: bloodGroup,
        contact: contact
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