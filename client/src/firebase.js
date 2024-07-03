// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "mickberryz-mern-estate.firebaseapp.com",
    projectId: "mickberryz-mern-estate",
    storageBucket: "mickberryz-mern-estate.appspot.com",
    messagingSenderId: "877481017630",
    appId: "1:877481017630:web:32bab20b3156724f65490f"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);