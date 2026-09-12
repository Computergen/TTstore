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

function clearLocalAccountData(uid, email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const users = getStoredUsers().filter((user) => user.uid !== uid && user.email?.toLowerCase() !== normalizedEmail);
  saveStoredUsers(users);

  const profiles = JSON.parse(localStorage.getItem('tula-vendor-profiles') || '[]');
  const removedVendorIds = new Set(profiles.filter((profile) => profile.ownerUid === uid || profile.ownerEmail?.toLowerCase() === normalizedEmail).map((profile) => profile.vendorId));
  localStorage.setItem('tula-vendor-profiles', JSON.stringify(profiles.filter((profile) => !removedVendorIds.has(profile.vendorId))));

  const commerceData = JSON.parse(localStorage.getItem('tula-commerce-data') || '{"stores":[],"products":[]}');
  commerceData.stores = (commerceData.stores || []).filter((store) => !removedVendorIds.has(store.vendorId));
  commerceData.products = (commerceData.products || []).filter((product) => !removedVendorIds.has(product.vendorId));
  localStorage.setItem('tula-commerce-data', JSON.stringify(commerceData));
  if (getStoredSession()?.uid === uid || getStoredSession()?.email?.toLowerCase() === normalizedEmail) clearStoredSession();
}

async function completeVendorSignUp() {
  const draft = JSON.parse(localStorage.getItem('tula-vendor-signup-draft') || 'null');
  if (!draft?.email || !draft?.password) return { success: false, message: 'Your vendor signup session expired. Please start again.' };
  const firebaseReady = await ensureFirebaseReady();
  if (firebaseReady.success && window.tulaFirebaseAuth) {
    try {
      const result = await window.tulaFirebaseAuth.createUserWithEmailAndPassword(draft.email, draft.password);
      const user = result.user;
      const vendorId = `vendor_${Math.random().toString(36).slice(2, 8)}`;
      const storeSlug = makeUniqueStoreSlug(draft.storeName, getStoredUsers());
      await syncUserProfile(user, 'vendor', draft.name, vendorId, storeSlug, draft.profileImageUrl);
      localStorage.removeItem('tula-vendor-signup-draft');
      setStoredSession({ uid: user.uid, email: user.email, role: 'vendor', name: draft.name, profileImageUrl: draft.profileImageUrl || null, vendorId, storeSlug, storeName: draft.storeName });
      return { success: true, uid: user.uid, vendorId, storeSlug };
    } catch (error) {
      return { success: false, message: getAuthErrorMessage(error, 'Unable to create your vendor account.') };
    }
  }
  return { success: false, message: firebaseReady.message || 'Vendor registration requires Firebase.' };
}

function monitorFirebaseAccount() {
  if (!window.tulaFirebaseAuth || window.tulaFirebaseAccountMonitor) return;
  window.tulaFirebaseAccountMonitor = window.tulaFirebaseAuth.onAuthStateChanged((user) => {
    const session = getStoredSession();
    if (session?.uid && !user) clearLocalAccountData(session.uid, session.email);
  });
}

function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(String(password));
  return window.crypto.subtle.digest('SHA-256', data).then((hashBuffer) => {
    return Array.from(new Uint8Array(hashBuffer))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  });
}

function getAdminCredentials() {
  return null;
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

function getAuthErrorMessage(error, fallback) {
  const messages = {
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account was found for this email.',
    'auth/wrong-password': 'The email or password is incorrect.',
    'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase Authentication.',
    'auth/expired-action-code': 'This password reset link has expired. Request a new one.',
    'auth/invalid-action-code': 'This password reset link is invalid or has already been used.',
    'auth/weak-password': 'Choose a stronger password with at least 8 characters.',
  };
  return messages[error?.code] || error?.message || fallback;
}

async function syncUserProfile(user, role, name, vendorId, storeSlug, profileImageUrl) {
  if (!window.tulaFirebaseFirestore || !user?.uid) {
    return;
  }

  const profile = {
    uid: user.uid,
    email: user.email,
    role,
    name,
    profileImageUrl: profileImageUrl || null,
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
    const normalizedEmail = String(email || '').trim();
    const normalizedPassword = String(password || '');
    if (!normalizedEmail || !normalizedPassword) {
      return { success: false, message: 'Enter your email and password.' };
    }
    if (window.tulaApi) {
      try {
        const result = await window.tulaApi.login(normalizedEmail, normalizedPassword);
        const user = result.user;
        setStoredSession(user);
        return { success: true, role: user.role, uid: user.uid, message: 'Signed in successfully.' };
      } catch (error) {
        if (error.status && error.status !== 404 && error.status !== 500) {
          return { success: false, message: error.message };
        }
      }
    }
    const firebaseReady = await ensureFirebaseReady();
    if (firebaseReady.success && window.tulaFirebaseAuth) {
      try {
        const result = await window.tulaFirebaseAuth.signInWithEmailAndPassword(normalizedEmail, normalizedPassword);
        const user = result.user;
        const userDoc = await window.tulaFirebaseFirestore.collection('users').doc(user.uid).get();
        const profile = userDoc.exists ? userDoc.data() : {};
        const role = profile.role || 'customer';
        const session = {
          uid: user.uid,
          email: user.email,
          role,
          name: profile.name || user.email,
          profileImageUrl: profile.profileImageUrl || null,
          vendorId: profile.vendorId || null,
          storeSlug: profile.storeSlug || null,
          storeName: profile.storeName || null
        };
        setStoredSession(session);
        return { success: true, role, uid: user.uid, message: 'Signed in successfully.' };
      } catch (error) {
        console.warn('Firebase sign-in failed:', error);
        const fallbackUsers = getStoredUsers();
        const passwordHash = await hashPassword(normalizedPassword);
        const fallbackUser = fallbackUsers.find((item) => {
          return item.email.toLowerCase() === normalizedEmail.toLowerCase() &&
            ((item.passwordHash && item.passwordHash === passwordHash) || item.password === normalizedPassword);
        });
        if (fallbackUser) {
          const session = {
            email: fallbackUser.email,
            role: fallbackUser.role,
            name: fallbackUser.name,
            profileImageUrl: fallbackUser.profileImageUrl || null,
            vendorId: fallbackUser.vendorId,
            storeSlug: fallbackUser.storeSlug,
            storeName: fallbackUser.storeName || null
          };
          setStoredSession(session);
          return { success: true, role: fallbackUser.role, message: 'Signed in successfully.' };
        }
        if (error?.code === 'auth/user-not-found') {
          clearLocalAccountData(null, normalizedEmail);
        }
        return { success: false, message: getAuthErrorMessage(error, 'Unable to sign in.') };
      }
    }

    const fallbackUsers = getStoredUsers();
    const passwordHash = await hashPassword(normalizedPassword);
    const fallbackUser = fallbackUsers.find((item) => item.email.toLowerCase() === normalizedEmail.toLowerCase() && item.passwordHash === passwordHash);
    if (fallbackUser) {
      const session = {
        email: fallbackUser.email,
        role: fallbackUser.role,
        name: fallbackUser.name,
        profileImageUrl: fallbackUser.profileImageUrl || null,
        vendorId: fallbackUser.vendorId,
          storeSlug: fallbackUser.storeSlug,
          storeName: fallbackUser.storeName || null
      };
      setStoredSession(session);
      return { success: true, role: fallbackUser.role, message: 'Signed in successfully.' };
    }

    return { success: false, message: firebaseReady.message || 'No account found for this email and password.' };
  },
  async signUp(email, password, role = 'customer', name = '', storeName = '', profileImageUrl = '') {
    if (role === 'admin') {
      return { success: false, message: 'Admin registration is disabled.' };
    }

    if (role === 'vendor') {
      localStorage.setItem('tula-vendor-signup-draft', JSON.stringify({ email: String(email).trim(), password: String(password), name: String(name).trim(), storeName: String(storeName).trim(), profileImageUrl: profileImageUrl || '' }));
      setStoredSession({ email: String(email).trim(), role: 'vendor', name: String(name).trim(), storeName: String(storeName).trim(), pendingVendorOnboarding: true });
      return { success: true, role: 'vendor', message: 'Continue onboarding to create your vendor account.' };
    }

    if (window.tulaApi) {
      try {
        const result = await window.tulaApi.register({ email, password, name, role, profileImageUrl });
        setStoredSession(result.user);
        return { success: true, role: result.user.role, uid: result.user.uid, message: 'Customer account created.' };
      } catch (error) {
        if (error.status && error.status !== 404 && error.status !== 500) {
          return { success: false, message: error.message };
        }
      }
    }

    const firebaseReady = await ensureFirebaseReady();
    if (firebaseReady.success && window.tulaFirebaseAuth) {
      try {
        const result = await window.tulaFirebaseAuth.createUserWithEmailAndPassword(String(email).trim(), String(password));
        const user = result.user;
        const normalizedRole = role === 'vendor' ? 'vendor' : 'customer';
        const vendorId = normalizedRole === 'vendor' ? `vendor_${Math.random().toString(36).slice(2, 8)}` : null;
        const storeSlug = normalizedRole === 'vendor' && storeName ? makeUniqueStoreSlug(storeName, getStoredUsers()) : null;
        await syncUserProfile(user, normalizedRole, String(name).trim(), vendorId, storeSlug, profileImageUrl);

        const session = {
          uid: user.uid,
          email: user.email,
          role: normalizedRole,
          name: String(name).trim(),
          profileImageUrl: profileImageUrl || null,
          vendorId,
          storeSlug,
          storeName: storeName || null
        };
        setStoredSession(session);

        const users = getStoredUsers();
        const passwordHash = await hashPassword(password);
        users.push({
          email: String(email).trim(),
          passwordHash,
          role: normalizedRole,
          name: String(name).trim(),
          vendorId,
          storeSlug,
          storeName: storeName || null,
          createdAt: new Date().toISOString()
        });
        saveStoredUsers(users);

        return {
          success: true,
          role: normalizedRole,
          vendorId,
          storeSlug,
          message: normalizedRole === 'vendor' ? 'Vendor account created. Complete onboarding to publish your storefront.' : 'Customer account created.'
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
    const storeSlug = normalizedRole === 'vendor' && storeName ? makeUniqueStoreSlug(storeName, users) : null;
    const passwordHash = await hashPassword(password);
    const user = {
      email: String(email).trim(),
      passwordHash,
      role: normalizedRole,
      name: String(name).trim(),
      profileImageUrl: profileImageUrl || null,
      vendorId,
      storeSlug,
      storeName: storeName || null,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    saveStoredUsers(users);
    setStoredSession({ email: user.email, role: user.role, name: user.name, profileImageUrl: user.profileImageUrl || null, vendorId, storeSlug, storeName: user.storeName });
    return {
      success: true,
      role: normalizedRole,
      vendorId,
      storeSlug,
      message: normalizedRole === 'vendor' ? 'Vendor account created. Complete onboarding to publish your storefront.' : 'Customer account created.'
    };
  },
  async signInAdmin(email, password) {
    if (!email || !password) {
      return { success: false, message: 'Please provide admin credentials.' };
    }

    const firebaseReady = await ensureFirebaseReady();
    if (!firebaseReady.success || !window.tulaFirebaseAuth) {
      return { success: false, message: 'Admin login requires Firebase configuration.' };
    }

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
      return { success: false, message: error.message || 'Unable to sign in as admin.' };
    }

    return { success: false, message: 'Access denied. Only authorized admins can sign in.' };
  },
  getSession() {
    return getStoredSession();
  },
  completeVendorSignUp,
  clearLocalAccountData,
  monitorFirebaseAccount,
  signOut() {
    clearStoredSession();
    localStorage.removeItem('tula-cart');
    window.tulaApi?.logout?.().catch(() => {});
    if (window.tulaFirebaseAuth) {
      window.tulaFirebaseAuth.signOut().catch(() => {});
    }
    return true;
  },
  async resetPassword(email) {
    const normalizedEmail = String(email || '').trim();
    if (!normalizedEmail) {
      return { success: false, message: 'Enter the email linked to your account.' };
    }
    const firebaseReady = await ensureFirebaseReady();
    if (!firebaseReady.success || !window.tulaFirebaseAuth) {
      return { success: false, message: firebaseReady.message || 'Password reset is not available until Firebase is configured.' };
    }
    try {
      await window.tulaFirebaseAuth.sendPasswordResetEmail(normalizedEmail, {
        url: `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, '/reset-password.html')}`,
        handleCodeInApp: true
      });
      return { success: true, message: 'Password reset email sent. Check your inbox.' };
    } catch (error) {
      return { success: false, message: getAuthErrorMessage(error, 'Unable to reset password.') };
    }
  },
  async verifyPasswordResetCode(code) {
    if (!code) return { success: false, message: 'This password reset link is incomplete.' };
    const firebaseReady = await ensureFirebaseReady();
    if (!firebaseReady.success || !window.tulaFirebaseAuth) {
      return { success: false, message: firebaseReady.message || 'Password reset is not available.' };
    }
    try {
      const email = await window.tulaFirebaseAuth.verifyPasswordResetCode(code);
      return { success: true, email };
    } catch (error) {
      return { success: false, message: getAuthErrorMessage(error, 'This password reset link is invalid or expired.') };
    }
  },
  async confirmPasswordReset(code, password) {
    if (!code || String(password || '').length < 8) {
      return { success: false, message: 'Choose a password with at least 8 characters.' };
    }
    const firebaseReady = await ensureFirebaseReady();
    if (!firebaseReady.success || !window.tulaFirebaseAuth) {
      return { success: false, message: firebaseReady.message || 'Password reset is not available until Firebase is configured.' };
    }
    try {
      await window.tulaFirebaseAuth.confirmPasswordReset(code, String(password));
      return { success: true, message: 'Password updated successfully. You can now sign in.' };
    } catch (error) {
      return { success: false, message: getAuthErrorMessage(error, 'Unable to update your password.') };
    }
  }
};

window.addEventListener('tula-firebase-ready', () => window.tulaAuth.monitorFirebaseAccount());
if (window.tulaFirebaseReady) window.tulaAuth.monitorFirebaseAccount();
