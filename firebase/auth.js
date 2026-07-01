/*
  Authentication helper module for future Firebase Auth integration.
  This placeholder exposes a consistent API for sign-up, sign-in, and password reset workflows.
*/
function getStoredUsers() {
  try {
    return JSON.parse(localStorage.getItem('tula-users') || '[]');
  } catch (error) {
    return [];
  }
}

function saveStoredUsers(users) {
  localStorage.setItem('tula-users', JSON.stringify(users));
}

function getStoredSession() {
  try {
    return JSON.parse(localStorage.getItem('tula-auth-session') || 'null');
  } catch (error) {
    return null;
  }
}

function setStoredSession(session) {
  localStorage.setItem('tula-auth-session', JSON.stringify(session));
}

function clearStoredSession() {
  localStorage.removeItem('tula-auth-session');
}

function getAdminCredentials() {
  const stored = localStorage.getItem('tula-admin-credentials');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      return null;
    }
  }
  const fallback = { email: 'admin@tula.market', password: 'admin123' };
  localStorage.setItem('tula-admin-credentials', JSON.stringify(fallback));
  return fallback;
}

function makeUniqueStoreSlug(baseSlug, users) {
  const slug = String(baseSlug || 'my-store')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const existingSlugs = new Set((users || []).map((user) => user.storeSlug).filter(Boolean));
  if (!existingSlugs.has(slug)) {
    return slug;
  }
  let index = 2;
  let candidate = `${slug}-${index}`;
  while (existingSlugs.has(candidate)) {
    index += 1;
    candidate = `${slug}-${index}`;
  }
  return candidate;
}

async function ensureFirebaseReady() {
  if (window.tulaFirebaseReady && window.tulaFirebaseAuth) {
    return { success: true };
  }
  const result = await window.tulaFirebaseInitialize?.();
  return result || { success: false, message: 'Firebase is not ready.' };
}

async function syncUserProfile(user, role, name, vendorId, storeSlug) {
  if (!window.tulaFirebaseFirestore || !user?.uid) {
    return;
  }

  const profile = {
    uid: user.uid,
    email: user.email,
    role,
    name,
    vendorId: vendorId || null,
    storeSlug: storeSlug || null,
    createdAt: new Date().toISOString()
  };

  try {
    await window.tulaFirebaseFirestore.collection('users').doc(user.uid).set(profile, { merge: true });
  } catch (error) {
    console.warn('Unable to sync user profile to Firestore:', error);
  }
}

window.tulaAuth = {
  async signIn(email, password) {
    const firebaseReady = await ensureFirebaseReady();
    if (firebaseReady.success && window.tulaFirebaseAuth) {
      try {
        const result = await window.tulaFirebaseAuth.signInWithEmailAndPassword(String(email).trim(), String(password));
        const user = result.user;
        const userDoc = await window.tulaFirebaseFirestore.collection('users').doc(user.uid).get();
        const profile = userDoc.exists ? userDoc.data() : {};
        const role = profile.role || 'customer';
        const session = {
          uid: user.uid,
          email: user.email,
          role,
          name: profile.name || user.email,
          vendorId: profile.vendorId || null,
          storeSlug: profile.storeSlug || null
        };
        setStoredSession(session);
        return { success: true, role, uid: user.uid, message: 'Signed in successfully.' };
      } catch (error) {
        console.warn('Firebase sign-in failed:', error);
        const fallbackUsers = getStoredUsers();
        const fallbackUser = fallbackUsers.find((item) => item.email.toLowerCase() === String(email).trim().toLowerCase() && item.password === String(password));
        if (fallbackUser) {
          const session = {
            email: fallbackUser.email,
            role: fallbackUser.role,
            name: fallbackUser.name,
            vendorId: fallbackUser.vendorId,
            storeSlug: fallbackUser.storeSlug
          };
          setStoredSession(session);
          return { success: true, role: fallbackUser.role, message: 'Signed in successfully.' };
        }
        return { success: false, message: error.message || 'Unable to sign in.' };
      }
    }

    const fallbackUsers = getStoredUsers();
    const fallbackUser = fallbackUsers.find((item) => item.email.toLowerCase() === String(email).trim().toLowerCase() && item.password === String(password));
    if (fallbackUser) {
      const session = {
        email: fallbackUser.email,
        role: fallbackUser.role,
        name: fallbackUser.name,
        vendorId: fallbackUser.vendorId,
        storeSlug: fallbackUser.storeSlug
      };
      setStoredSession(session);
      return { success: true, role: fallbackUser.role, message: 'Signed in successfully.' };
    }

    return { success: false, message: 'No account found for this email and password.' };
  },
  async signUp(email, password, role = 'customer', name = '') {
    if (role === 'admin') {
      return { success: false, message: 'Admin registration is disabled.' };
    }

    const firebaseReady = await ensureFirebaseReady();
    if (firebaseReady.success && window.tulaFirebaseAuth) {
      try {
        const result = await window.tulaFirebaseAuth.createUserWithEmailAndPassword(String(email).trim(), String(password));
        const user = result.user;
        const normalizedRole = role === 'vendor' ? 'vendor' : 'customer';
        const vendorId = normalizedRole === 'vendor' ? `vendor_${Math.random().toString(36).slice(2, 8)}` : null;
        const storeSlug = normalizedRole === 'vendor' && name ? makeUniqueStoreSlug(name, getStoredUsers()) : null;
        await syncUserProfile(user, normalizedRole, String(name).trim(), vendorId, storeSlug);

        const session = {
          uid: user.uid,
          email: user.email,
          role: normalizedRole,
          name: String(name).trim(),
          vendorId,
          storeSlug
        };
        setStoredSession(session);

        const users = getStoredUsers();
        users.push({
          email: String(email).trim(),
          password: String(password),
          role: normalizedRole,
          name: String(name).trim(),
          vendorId,
          storeSlug,
          createdAt: new Date().toISOString()
        });
        saveStoredUsers(users);

        return {
          success: true,
          role: normalizedRole,
          vendorId,
          storeSlug,
          message: normalizedRole === 'vendor' ? 'Vendor account created. Complete onboarding to publish your store.' : 'Customer account created.'
        };
      } catch (error) {
        console.warn('Firebase sign-up failed:', error);
        return { success: false, message: error.message || 'Unable to complete registration.' };
      }
    }

    const users = getStoredUsers();
    if (users.some((user) => user.email.toLowerCase() === String(email).trim().toLowerCase())) {
      return { success: false, message: 'An account already exists for this email.' };
    }
    const normalizedRole = role === 'vendor' ? 'vendor' : 'customer';
    const vendorId = normalizedRole === 'vendor' ? `vendor_${Math.random().toString(36).slice(2, 8)}` : null;
    const storeSlug = normalizedRole === 'vendor' && name ? makeUniqueStoreSlug(name, users) : null;
    const user = {
      email: String(email).trim(),
      password: String(password),
      role: normalizedRole,
      name: String(name).trim(),
      vendorId,
      storeSlug,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    saveStoredUsers(users);
    setStoredSession({ email: user.email, role: user.role, name: user.name, vendorId, storeSlug });
    return {
      success: true,
      role: normalizedRole,
      vendorId,
      storeSlug,
      message: normalizedRole === 'vendor' ? 'Vendor account created. Complete onboarding to publish your store.' : 'Customer account created.'
    };
  },
  async signInAdmin(email, password) {
    const adminAccount = getAdminCredentials();
    if (!email || !password) {
      return { success: false, message: 'Please provide admin credentials.' };
    }

    const firebaseReady = await ensureFirebaseReady();
    if (firebaseReady.success && window.tulaFirebaseAuth) {
      try {
        const result = await window.tulaFirebaseAuth.signInWithEmailAndPassword(String(email).trim(), String(password));
        const user = result.user;
        const userDoc = await window.tulaFirebaseFirestore.collection('users').doc(user.uid).get();
        const profile = userDoc.exists ? userDoc.data() : {};
        if (profile.role === 'admin') {
          setStoredSession({ uid: user.uid, email: user.email, role: 'admin', name: profile.name || user.email });
          return { success: true, role: 'admin', message: 'Admin login successful.' };
        }
      } catch (error) {
        console.warn('Admin sign-in failed:', error);
      }
    }

    if (String(email).trim().toLowerCase() === adminAccount.email && String(password) === adminAccount.password) {
      setStoredSession({ email: adminAccount.email, role: 'admin', name: 'Platform Admin' });
      return { success: true, role: 'admin', message: 'Admin login successful.' };
    }
    return { success: false, message: 'Access denied. Only authorized admins can sign in.' };
  },
  getSession() {
    return getStoredSession();
  },
  signOut() {
    clearStoredSession();
    if (window.tulaFirebaseAuth) {
      window.tulaFirebaseAuth.signOut().catch(() => {});
    }
    return true;
  },
  async resetPassword(email) {
    if (window.tulaFirebaseAuth) {
      try {
        await window.tulaFirebaseAuth.sendPasswordResetEmail(String(email).trim());
        return { success: true, message: 'Password reset email sent.' };
      } catch (error) {
        return { success: false, message: error.message || 'Unable to reset password.' };
      }
    }
    return { success: false, message: 'Password reset is not available until Firebase is configured.' };
  }
};
