const firebaseConfig = {
    // Your Firebase configuration here
    apiKey: "AIzaSyA1vPwf3cqooqLlRmpJ3fySMNrjPuOZnp8",
  authDomain: "penguinpms.firebaseapp.com",
  projectId: "penguinpms",
  storageBucket: "penguinpms.appspot.com",
  messagingSenderId: "797363618186",
  appId: "1:797363618186:web:81f4c036891161c8044873"    
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();