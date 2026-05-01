
const { auth, db } = require('./firebase'); // Assurez-vous que le chemin est correct
const { createUserWithEmailAndPassword } = require('firebase/auth');
const { doc, setDoc } = require('firebase/firestore');

const seedDatabase = async () => {
  console.log('Début du seeding de la base de données...');

  try {
    // --- Création de l'administrateur ---
    const adminEmail = 'bahatinyeke@gmail.com';
    const adminPassword = '123456789';
    const adminUsername = 'AdminBahati'; // Un nom d'utilisateur par défaut

    // Étape 1: Créer l'utilisateur dans Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    const adminUser = userCredential.user;
    console.log(`Utilisateur administrateur créé avec l'UID: ${adminUser.uid}`);

    // Étape 2: Sauvegarder les informations de l'utilisateur dans Firestore
    await setDoc(doc(db, 'users', adminUser.uid), {
      id: adminUser.uid,
      username: adminUsername,
      email: adminEmail,
      role: 'admin', // Assignation du rôle d'administrateur
    });
    console.log(`Informations de l'administrateur sauvegardées dans Firestore.`);

    console.log('\x1b[32m%s\x1b[0m', 'Seeding de la base de données terminé avec succès !');

  } catch (error) {
    // Gestion des erreurs spécifiques
    if (error.code === 'auth/email-already-in-use') {
      console.warn('\x1b[33m%s\x1b[0m', 'L\'utilisateur administrateur existe déjà. Aucune action n\'a été effectuée.');
    } else {
      console.error('\x1b[31m%s\x1b[0m', 'Erreur lors du seeding de la base de données:', error.message);
    }
  } finally {
    // Si vous aviez une connexion à fermer, vous le feriez ici.
    // Dans notre cas avec Firebase v9, ce n'est pas nécessaire.
  }
};

// Exécution de la fonction de seeding
seedDatabase();
