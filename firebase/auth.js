/*
  Authentication helper module for future Firebase Auth integration.
  This placeholder exposes a consistent API for sign-up, sign-in, and password reset workflows.
*/
window.tulaAuth = {
  async signIn(email, password) {
    console.info('Firebase Auth sign-in placeholder', { email, password });
    return { success: false, message: 'Authentication has not been configured yet.' };
  },
  async signUp(email, password) {
    console.info('Firebase Auth sign-up placeholder', { email, password });
    return { success: false, message: 'Authentication has not been configured yet.' };
  },
  async resetPassword(email) {
    console.info('Firebase Auth password reset placeholder', { email });
    return { success: false, message: 'Password reset is not available until Firebase is configured.' };
  }
};
