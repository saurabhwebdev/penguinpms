export function loadDashboard() {
    if (!currentUser) return;

    const content = document.getElementById('content');
    content.innerHTML = `
    <h2 class="text-2xl font-bold mb-4 text-center">Dashboard</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <h3 class="card-title">Upcoming Appointments</h3>
                <div class="mb-4">
                    <label for="daysSelect" class="mr-2">Show appointments for next:</label>
                    <select id="daysSelect" class="select select-bordered">
                        <option value="1">1 day</option>
                        <option value="2" selected>2 days</option>
                        <option value="3">3 days</option>
                        <option value="7">7 days</option>
                    </select>
                </div>
                <div id="upcomingAppointments" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
            </div>
        </div>
        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <h3 class="card-title">Patient Statistics</h3>
                <canvas id="patientChart"></canvas>
            </div>
        </div>
    </div>

    <!-- Modal for Appointment Details -->
    <div id="appointmentModal" class="modal hidden fixed z-10 inset-0 overflow-y-auto">
        <div class="modal-dialog bg-white rounded-lg shadow-lg mx-auto mt-20 p-4 max-w-lg">
            <div class="modal-header flex justify-between items-center">
                <h3 class="text-xl font-semibold">Appointment Details</h3>
                <button class="close-modal text-gray-500 hover:text-gray-700">&times;</button>
            </div>
            <div class="modal-body mt-4">
                <!-- Appointment details will be loaded here -->
                <div id="appointmentDetails"></div>
            </div>
        </div>
    </div>
    `;

    document.getElementById('daysSelect').addEventListener('change', loadUpcomingAppointments);
    document.querySelector('.close-modal').addEventListener('click', closeModal);

    loadUpcomingAppointments();
    loadPatientStatistics();
}

function loadUpcomingAppointments() {
    const days = parseInt(document.getElementById('daysSelect').value);
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + days);

    const todayString = today.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];

    db.collection('appointments')
        .where('date', '>=', todayString)
        .where('date', '<=', endDateString)
        .orderBy('date')
        .orderBy('time')
        .get()
        .then((querySnapshot) => {
            const upcomingAppointments = document.getElementById('upcomingAppointments');
            upcomingAppointments.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const appointment = doc.data();
                const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);

                upcomingAppointments.innerHTML += `
                <div class="card bg-base-100 shadow-md mb-4 cursor-pointer hover:shadow-lg transition-shadow duration-300" onclick="showAppointmentDetails('${doc.id}')">
                    <div class="card-body">
                        <h4 class="card-title">${appointment.patientName}</h4>
                        <p>${appointmentDate.toLocaleDateString()} at ${appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
                `;
            });
        })
        .catch((error) => {
            console.error('Error loading upcoming appointments:', error);
        });
}

// Make the function globally accessible
window.showAppointmentDetails = function(appointmentId) {
    db.collection('appointments').doc(appointmentId).get().then((doc) => {
        if (doc.exists) {
            const appointment = doc.data();
            const appointmentDetails = document.getElementById('appointmentDetails');
            appointmentDetails.innerHTML = `
                <p><strong>Patient Name:</strong> ${appointment.patientName}</p>
                <p><strong>Date:</strong> ${appointment.date}</p>
                <p><strong>Time:</strong> ${appointment.time}</p>
                <p><strong>Contact:</strong> <a href="https://wa.me/${appointment.contact}" target="_blank">${appointment.contact}</a></p>
            `;
            openModal();
        } else {
            console.log('No such appointment!');
        }
    }).catch((error) => {
        console.error('Error getting appointment details:', error);
    });
}

function openModal() {
    const modal = document.getElementById('appointmentModal');
    if (modal) {
        modal.classList.remove('hidden');
    } else {
        console.error('Modal element not found');
    }
}

function closeModal() {
    const modal = document.getElementById('appointmentModal');
    if (modal) {
        modal.classList.add('hidden');
    } else {
        console.error('Modal element not found');
    }
}

let patientChart;

function loadPatientStatistics() {
    db.collection('patients').get().then((querySnapshot) => {
        const ageGroups = {
            '0-18': 0,
            '19-35': 0,
            '36-50': 0,
            '51+': 0
        };

        querySnapshot.forEach((doc) => {
            const patient = doc.data();
            if (patient.age <= 18) ageGroups['0-18']++;
            else if (patient.age <= 35) ageGroups['19-35']++;
            else if (patient.age <= 50) ageGroups['36-50']++;
            else ageGroups['51+']++;
        });

        const ctx = document.getElementById('patientChart').getContext('2d');

        if (patientChart) {
            patientChart.destroy();
        }

        patientChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(ageGroups),
                datasets: [{
                    data: Object.values(ageGroups),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: 'Patient Age Distribution'
                }
            }
        });
    }).catch((error) => {
        console.error('Error loading patient statistics:', error);
    });
}