/*
  Firestore helper module for product, vendor, order, and profile queries.
  The methods below are placeholders for future role-based data operations.
*/
window.tulaFirestore = {
  async getCollection(name) {
    console.info('Firestore collection placeholder', name);
    return [];
  },
  async saveDocument(path, payload) {
    console.info('Firestore save placeholder', { path, payload });
    return { success: false, message: 'Firestore is not configured yet.' };
  }
};
