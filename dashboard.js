export function loadDashboard() {
    if (!currentUser) return;

    const content = document.getElementById('content');
    content.innerHTML = `
    <h2 class="text-2xl font-bold mb-4 text-center">Dashboard</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <h3 class="card-title">Upcoming Appointments</h3>
                <div class="mb-4 flex justify-between">
                    <div>
                        <label for="daysSelect" class="mr-2">Show appointments for next:</label>
                        <select id="daysSelect" class="select select-bordered">
                            <option value="1">1 day</option>
                            <option value="2">2 days</option>
                            <option value="3">3 days</option>
                            <option value="7" selected>7 days</option>
                        </select>
                    </div>
                    <div>
                        <label for="entriesSelect" class="mr-2">Entries per page:</label>
                        <select id="entriesSelect" class="select select-bordered">
                            <option value="5">5</option>
                            <option value="10" selected>10</option>
                            <option value="15">15</option>
                        </select>
                    </div>
                </div>
                <div id="upcomingAppointments" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
                <div id="pagination" class="flex justify-center mt-4"></div>
            </div>
        </div>
        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <h3 class="card-title">Patient Statistics</h3>
                <canvas id="patientChart"></canvas>
                <div id="patientChartEmptyState" class="hidden text-center text-gray-500 mt-4">No patient data available</div>
            </div>
        </div>
        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <h3 class="card-title">Total Patients</h3>
                <p id="totalPatients" class="text-3xl font-bold"></p>
            </div>
        </div>
        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <h3 class="card-title">Total Appointments</h3>
                <p id="totalAppointments" class="text-3xl font-bold"></p>
            </div>
        </div>
        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <h3 class="card-title">Appointments by Status</h3>
                <canvas id="appointmentStatusChart"></canvas>
                <div id="appointmentStatusChartEmptyState" class="hidden text-center text-gray-500 mt-4">No appointment status data available</div>
            </div>
        </div>
        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <h3 class="card-title">Appointments per Day</h3>
                <canvas id="appointmentsPerDayChart"></canvas>
                <div id="appointmentsPerDayChartEmptyState" class="hidden text-center text-gray-500 mt-4">No appointment data available for the next 7 days</div>
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
    document.getElementById('entriesSelect').addEventListener('change', loadUpcomingAppointments);
    document.querySelector('.close-modal').addEventListener('click', closeModal);

    loadUpcomingAppointments();
    loadPatientStatistics();
    loadTotalPatients();
    loadTotalAppointments();
    loadAppointmentStatusChart();
    loadAppointmentsPerDayChart();
}

let allUpcomingAppointments = [];
let currentPage = 1;

function loadUpcomingAppointments() {
    const days = parseInt(document.getElementById('daysSelect').value);
    const entriesPerPage = parseInt(document.getElementById('entriesSelect').value);
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
            allUpcomingAppointments = [];
            querySnapshot.forEach((doc) => {
                const appointment = doc.data();
                appointment.id = doc.id;
                allUpcomingAppointments.push(appointment);
            });

            renderUpcomingAppointments(entriesPerPage);
        })
        .catch((error) => {
            console.error('Error loading upcoming appointments:', error);
        });
}

function renderUpcomingAppointments(entriesPerPage) {
    const upcomingAppointments = document.getElementById('upcomingAppointments');
    upcomingAppointments.innerHTML = '';

    if (allUpcomingAppointments.length === 0) {
        upcomingAppointments.innerHTML = '<p class="text-center text-gray-500">No upcoming appointments</p>';
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    const paginatedAppointments = allUpcomingAppointments.slice(startIndex, endIndex);

    paginatedAppointments.forEach((appointment) => {
        const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
        upcomingAppointments.innerHTML += `
        <div class="card bg-base-100 shadow-md mb-4 cursor-pointer hover:shadow-lg transition-shadow duration-300" onclick="showAppointmentDetails('${appointment.id}')">
            <div class="card-body flex justify-between items-center">
                <span class="font-bold">${appointment.patientName}</span>
                <span>${appointmentDate.toLocaleDateString()} ${appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
        `;
    });

    renderPagination(allUpcomingAppointments.length, entriesPerPage);
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
            renderUpcomingAppointments(entriesPerPage);
        });
        pagination.appendChild(pageButton);
    }
}

// Make the function globally accessible
window.showAppointmentDetails = function(appointmentId) {
    db.collection('appointments').doc(appointmentId).get().then((doc) => {
        if (doc.exists) {
            const appointment = doc.data();
            const appointmentDetails = document.getElementById('appointmentDetails');
            if (!appointmentDetails) {
                console.error('Element with ID "appointmentDetails" not found');
                return;
            }
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
let appointmentStatusChart;
let appointmentsPerDayChart;

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

        const ctx = document.getElementById('patientChart');
        const emptyState = document.getElementById('patientChartEmptyState');
        if (!ctx || !emptyState) {
            console.error('Required elements for patient chart not found');
            return;
        }

        if (patientChart) {
            patientChart.destroy();
        }

        if (Object.values(ageGroups).every(value => value === 0)) {
            ctx.style.display = 'none';
            emptyState.classList.remove('hidden');
            return;
        }

        ctx.style.display = 'block';
        emptyState.classList.add('hidden');

        patientChart = new Chart(ctx.getContext('2d'), {
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

function loadTotalPatients() {
    db.collection('patients').get().then((querySnapshot) => {
        const totalPatients = querySnapshot.size;
        const totalPatientsElement = document.getElementById('totalPatients');
        if (totalPatientsElement) {
            totalPatientsElement.textContent = totalPatients || 'No patients';
        }
    }).catch((error) => {
        console.error('Error loading total patients:', error);
    });
}

function loadTotalAppointments() {
    db.collection('appointments').get().then((querySnapshot) => {
        const totalAppointments = querySnapshot.size;
        const totalAppointmentsElement = document.getElementById('totalAppointments');
        if (totalAppointmentsElement) {
            totalAppointmentsElement.textContent = totalAppointments || 'No appointments';
        }
    }).catch((error) => {
        console.error('Error loading total appointments:', error);
    });
}

function loadAppointmentStatusChart() {
    db.collection('appointments').get().then((querySnapshot) => {
        const statusCounts = {
            'Scheduled': 0,
            'Completed': 0,
            'Cancelled': 0
        };

        querySnapshot.forEach((doc) => {
            const appointment = doc.data();
            if (appointment.status) {
                statusCounts[appointment.status] = (statusCounts[appointment.status] || 0) + 1;
            }
        });

        const ctx = document.getElementById('appointmentStatusChart');
        const emptyState = document.getElementById('appointmentStatusChartEmptyState');
        if (!ctx || !emptyState) {
            console.error('Required elements for appointment status chart not found');
            return;
        }

        if (appointmentStatusChart) {
            appointmentStatusChart.destroy();
        }

        if (Object.values(statusCounts).every(value => value === 0)) {
            ctx.style.display = 'none';
            emptyState.classList.remove('hidden');
            return;
        }

        ctx.style.display = 'block';
        emptyState.classList.add('hidden');

        appointmentStatusChart = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)',
                        'rgba(255, 159, 64, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: 'Appointments by Status'
                }
            }
        });
    }).catch((error) => {
        console.error('Error loading appointment status chart:', error);
    });
}

function loadAppointmentsPerDayChart() {
    const today = new Date();
    const dates = [];
    const counts = [];

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
        counts.push(0);
    }

    db.collection('appointments')
        .where('date', '>=', dates[0])
        .where('date', '<=', dates[6])
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const appointment = doc.data();
                const index = dates.indexOf(appointment.date);
                if (index !== -1) {
                    counts[index]++;
                }
            });

            const ctx = document.getElementById('appointmentsPerDayChart');
            const emptyState = document.getElementById('appointmentsPerDayChartEmptyState');
            if (!ctx || !emptyState) {
                console.error('Required elements for appointments per day chart not found');
                return;
            }

            if (appointmentsPerDayChart) {
                appointmentsPerDayChart.destroy();
            }

            if (counts.every(count => count === 0)) {
                ctx.style.display = 'none';
                emptyState.classList.remove('hidden');
                return;
            }

            ctx.style.display = 'block';
            emptyState.classList.add('hidden');

            appointmentsPerDayChart = new Chart(ctx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Appointments',
                        data: counts,
                        backgroundColor: 'rgba(54, 162, 235, 0.8)'
                    }]
                },
                options: {
                    responsive: true,
                    title: {
                        display: true,
                        text: 'Appointments per Day'
                    },
                    scales: {
                        xAxes: [{
                            type: 'time',
                            time: {
                                unit: 'day'
                            }
                        }],
                        yAxes: [{
                            ticks: {
                                beginAtZero: true,
                                stepSize: 1
                            }
                        }]
                    }
                }
            });
        })
        .catch((error) => {
            console.error('Error loading appointments per day chart:', error);
        });
}