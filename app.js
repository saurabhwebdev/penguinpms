import { loadDashboard } from './dashboard.js';
import { loadPatients } from './patients.js';
import { loadAppointments } from './appointments.js';

window.loadApp = function() {
    const appDiv = document.getElementById('app');
    appDiv.innerHTML = `
    <div class="drawer lg:drawer-open">
        <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
        <div class="drawer-content flex flex-col items-center justify-center">
            <label for="my-drawer-2" class="btn btn-primary drawer-button lg:hidden">Open menu</label>
            <div id="content" class="p-4 w-full">
                <!-- Content will be dynamically inserted here -->
            </div>
        </div>
        <div class="drawer-side">
            <label for="my-drawer-2" class="drawer-overlay"></label>
            <ul class="menu p-4 w-80 h-full bg-base-200 text-base-content">
                <li><a onclick="loadDashboard()">Dashboard</a></li>
                <li><a onclick="loadPatients()">Patients</a></li>
                <li><a onclick="loadAppointments()">Appointments</a></li>
                <li><a onclick="handleLogout()">Logout</a></li>
                <li><a onclick="toggleTheme()">Toggle Theme</a></li>
            </ul>
        </div>
    </div>
    `;

    loadDashboard();
}

window.loadDashboard = loadDashboard;
window.loadPatients = loadPatients;
window.loadAppointments = loadAppointments;

// Theme toggle
window.toggleTheme = function() {
    const html = document.querySelector('html');
    html.dataset.theme = html.dataset.theme === 'light' ? 'dark' : 'light';
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            window.loadApp();
        } else {
            showLoginForm();
        }
    });
});