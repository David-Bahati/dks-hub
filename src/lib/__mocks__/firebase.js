
const firestore = {
  collection: jest.fn(() => ({
    getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  })),
};

const auth = {};

module.exports = {
  db: firestore,
  auth: auth,
};
