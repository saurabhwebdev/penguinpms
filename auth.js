let currentUser = null;

function showLoginForm() {
    const appDiv = document.getElementById('app');
    appDiv.innerHTML = `
    <div class="flex items-center justify-center min-h-screen bg-gray-100">
        <div class="px-8 py-6 mt-4 text-left bg-white shadow-lg">
            <div class="text-center mb-4">
                <img src="logo.png" alt="Penguin Icon" class="w-16 h-16 mx-auto">
                <h3 class="text-xl font-bold">June-PMS</h3>
            </div>
            <h3 class="text-2xl font-bold text-center">Login to your account</h3>
            <form id="loginForm">
                <div class="mt-4">
                    <div>
                        <label class="block" for="email">Email</label>
                        <input type="text" placeholder="Email" id="email"
                        class="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600">
                    </div>
                    <div class="mt-4">
                        <label class="block">Password</label>
                        <input type="password" placeholder="Password" id="password"
                        class="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600">
                    </div>
                    <div class="flex items-baseline justify-between">
                        <button type="submit" class="px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900">Login</button>
                        <a href="#" onclick="showSignupForm()" class="text-sm text-blue-600 hover:underline">Sign up</a>
                    </div>
                </div>
            </form>
        </div>
    </div>
    `;

    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

function showSignupForm() {
    const appDiv = document.getElementById('app');
    appDiv.innerHTML = `
    <div class="flex items-center justify-center min-h-screen bg-gray-100">
        <div class="px-8 py-6 mt-4 text-left bg-white shadow-lg">
            <div class="text-center mb-4">
                <img src="./logo.png" alt="logo" class="w-16 h-16 mx-auto">
                <h3 class="text-xl font-bold">Penguin-PMS</h3>
            </div>
            <h3 class="text-2xl font-bold text-center">Create an account</h3>
            <form id="signupForm">
                <div class="mt-4">
                    <div>
                        <label class="block" for="email">Email</label>
                        <input type="text" placeholder="Email" id="email"
                        class="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600">
                    </div>
                    <div class="mt-4">
                        <label class="block">Password</label>
                        <input type="password" placeholder="Password" id="password"
                        class="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600">
                    </div>
                    <div class="flex items-baseline justify-between">
                        <button type="submit" class="px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900">Sign up</button>
                        <a href="#" onclick="showLoginForm()" class="text-sm text-blue-600 hover:underline">Login</a>
                    </div>
                </div>
            </form>
        </div>
    </div>
    `;

    document.getElementById('signupForm').addEventListener('submit', handleSignup);
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
        currentUser = userCredential.user;
        console.log('User logged in:', currentUser);
        window.loadApp();
    })
    .catch((error) => {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    });
}

function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
        currentUser = userCredential.user;
        console.log('User signed up:', currentUser);
        window.loadApp();
    })
    .catch((error) => {
        console.error('Signup error:', error);
        alert('Signup failed: ' + error.message);
    });
}

function handleLogout() {
    firebase.auth().signOut().then(() => {
        console.log('User signed out');
        currentUser = null;
        showLoginForm();
    }).catch((error) => {
        console.error('Sign out error', error);
    });
}

firebase.auth().onAuthStateChanged((user) => {
    currentUser = user;
    if (user) {
        window.loadApp();
    } else {
        showLoginForm();
    }
});