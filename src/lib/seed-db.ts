
// CJS, car on l'exécute avec Node directement
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, writeBatch, getDocs, doc } = require("firebase/firestore");
const { MOCK_PRODUCTS, MOCK_USERS, MOCK_ORDERS } = require("./mock-data");

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'next-js-dashboard-ab7fa',
  apiKey: 'dummy-key-for-emulator'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const { connectFirestoreEmulator } = require("firebase/firestore");
connectFirestoreEmulator(db, 'localhost', 8080);

console.log(`Connecté à l'émulateur Firestore sur l'hôte localhost et le port 8080.`);

async function seedDatabase() {
  console.log("Début du seeding de la base de données...");

  try {
    // 1. Nettoyer les collections existantes
    const collectionsToClean = ['products', 'orders', 'users'];
    for (const coll of collectionsToClean) {
      console.log(`Nettoyage de la collection: ${coll}...`);
      const querySnapshot = await getDocs(collection(db, coll));
      const batch = writeBatch(db);
      querySnapshot.forEach((document) => {
        batch.delete(document.ref);
      });
      await batch.commit();
      console.log(`Collection ${coll} nettoyée.`);
    }

    // 2. Seeder les utilisateurs
    console.log("Seeding des utilisateurs...");
    const usersBatch = writeBatch(db);
    MOCK_USERS.forEach(user => {
       // We use the uid from mock data as the document ID
       const userRef = doc(db, "users", user.uid);
       usersBatch.set(userRef, user);
    });
    await usersBatch.commit();
    console.log(`${MOCK_USERS.length} utilisateurs ajoutés.`);

    // 3. Seeder les produits
    console.log("Seeding des produits...");
    const productsBatch = writeBatch(db);
    MOCK_PRODUCTS.forEach(product => {
      const productRef = doc(db, "products", product.id);
      productsBatch.set(productRef, product);
    });
    await productsBatch.commit();
    console.log(`${MOCK_PRODUCTS.length} produits ajoutés.`);

    // 4. Seeder les commandes
    console.log("Seeding des commandes...");
    const ordersBatch = writeBatch(db);
    MOCK_ORDERS.forEach(order => {
        const newOrderRef = doc(collection(db, "orders")); // Auto-generate ID
        ordersBatch.set(newOrderRef, order);
    });
    await ordersBatch.commit();
    console.log(`${MOCK_ORDERS.length} commandes ajoutées.`);

    console.log("\n\x1b[32m%s\x1b[0m", "✅ Seeding terminé avec succès !");

  } catch (e) {
    console.error("\n\x1b[31m%s\x1b[0m", "❌ Erreur durant le seeding:", e);
    process.exit(1);
  }
}

seedDatabase();
