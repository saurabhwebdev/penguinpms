import { loadDashboard } from './dashboard.js';
import { loadPatients } from './patients.js';
import { loadAppointments } from './appointments.js';

window.loadApp = function() {
    const appDiv = document.getElementById('app');
    appDiv.innerHTML = `
    <div class="drawer lg:drawer-open">
        <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
        <div class="drawer-content flex flex-col items-center justify-center">
            <label for="my-drawer-2" class="btn btn-primary drawer-button lg:hidden fixed top-4 right-4 z-50">
                <div class="hamburger">
                    <div class="line"></div>
                    <div class="line"></div>
                    <div class="line"></div>
                </div>
            </label>
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
                <li><hr class="menu-divider"></li>
                <li><a onclick="toggleTheme()">Toggle Theme</a></li>
                <li><hr class="menu-divider"></li>
                <li>
                    <span class="menu-section-title" onclick="toggleUpcomingFeatures()">Upcoming Features</span>
                    <ul id="upcomingFeatures" class="hidden space-y-2">
                        <li><a class="disabled-link" onclick="openBulkUploadModal()">Bulk Upload</a></li>
                        <li><a class="disabled-link" href="sample.csv" download>Download Sample CSV</a></li>
                        <li><a class="disabled-link" href="sample.json" download>Download Sample JSON</a></li>
                    </ul>
                </li>
                <li><hr class="menu-divider"></li>
                <li class="logout-button"><button onclick="handleLogout()" class="btn btn-danger">Logout</button></li>
            </ul>
        </div>
    </div>
    `;

    loadDashboard();
    injectStyles();
}

window.loadDashboard = loadDashboard;
window.loadPatients = loadPatients;
window.loadAppointments = loadAppointments;

// Theme toggle
window.toggleTheme = function() {
    const html = document.querySelector('html');
    html.dataset.theme = html.dataset.theme === 'light' ? 'dark' : 'light';
}

// Function to open the bulk upload modal
window.openBulkUploadModal = function() {
    const content = document.getElementById('content');
    content.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">Bulk Upload</h2>
    <form id="bulkUploadForm" class="space-y-4">
        <div class="form-control">
            <label class="label">
                <span class="label-text">Upload CSV or JSON File</span>
            </label>
            <input type="file" id="bulkUploadFile" class="input input-bordered" accept=".csv, .json" required>
        </div>
        <button type="submit" class="btn btn-primary mt-4">Upload</button>
    </form>
    <div id="uploadStatus" class="mt-4"></div>
    `;

    document.getElementById('bulkUploadForm').addEventListener('submit', handleBulkUpload);
}

// Function to handle the bulk upload
function handleBulkUpload(event) {
    event.preventDefault();
    const fileInput = document.getElementById('bulkUploadFile');
    const file = fileInput.files[0];
    const uploadStatus = document.getElementById('uploadStatus');

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                console.log('File content:', content);

                // Simulate upload process
                uploadStatus.innerHTML = '<div class="loader"></div> Uploading...';
                setTimeout(() => {
                    // Process the file content here
                    try {
                        const data = JSON.parse(content);
                        console.log('Parsed data:', data);
                        // Insert data into the database here
                        uploadStatus.innerHTML = 'Upload successful!';
                    } catch (parseError) {
                        console.error('Error parsing JSON:', parseError);
                        uploadStatus.innerHTML = 'Error parsing file. Please check the file format.';
                    }
                }, 2000); // Simulate a 2-second upload time
            } catch (error) {
                console.error('Error during file upload:', error);
                uploadStatus.innerHTML = 'An error occurred during upload. Please try again.';
            }
        };
        reader.readAsText(file);
    } else {
        alert('Please select a file to upload.');
    }
}

// Function to toggle the visibility of upcoming features
window.toggleUpcomingFeatures = function() {
    const featuresList = document.getElementById('upcomingFeatures');
    featuresList.classList.toggle('hidden');
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

// Function to inject styles
function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .hamburger {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            width: 24px;
            height: 18px;
            cursor: pointer;
        }

        .hamburger .line {
            width: 100%;
            height: 3px;
            background-color: #fff;
            transition: all 0.3s ease;
        }

        .drawer-toggle:checked + .drawer-content .hamburger .line:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
        }

        .drawer-toggle:checked + .drawer-content .hamburger .line:nth-child(2) {
            opacity: 0;
        }

        .drawer-toggle:checked + .drawer-content .hamburger .line:nth-child(3) {
            transform: rotate(-45deg) translate(5px, -5px);
        }

        .loader {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            animation: spin 2s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .menu-divider {
            border-top: 1px solid #e2e8f0;
            margin: 0.5rem 0;
        }

        .disabled-link {
            pointer-events: none;
            color: #a0aec0;
        }

        .menu-section-title {
            font-weight: bold;
            margin-top: 1rem;
            margin-bottom: 0.5rem;
            cursor: pointer;
        }

        .logout-button {
            position: absolute;
            bottom: 1rem;
            right: 1rem;
        }

        .btn-danger {
            background-color: #e3342f;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 0.25rem;
            text-align: center;
            cursor: pointer;
            transition: background-color 0.3s ease;
            font-size: 1rem;
            font-weight: bold;
            border: none;
            display: inline-block;
        }

        .btn-danger:hover {
            background-color: #cc1f1a;
            color: white;
        }
    `;
    document.head.appendChild(style);
}
