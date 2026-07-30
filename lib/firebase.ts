import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBdj98cPqJssORHtspWQPgTwLbdMf4fa7A",
  authDomain: "movie-box-96be3.firebaseapp.com",
  projectId: "movie-box-96be3",
  storageBucket: "movie-box-96be3.firebasestorage.app",
  messagingSenderId: "765316934018",
  appId: "1:765316934018:web:cf84debe772d32caec079b",
  measurementId: "G-2NRWN33B78"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
