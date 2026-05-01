
import { initializeFirebase } from "@/firebase";

const { firebaseApp, firestore, auth } = initializeFirebase();

export { firebaseApp as app, firestore as db, auth };
