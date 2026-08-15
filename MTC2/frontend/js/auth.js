/* ==========================================================================
   MODREN QUIZ COUNDECTER - Email Authentication & Session Manager
   ========================================================================== */

class AuthManager {
  constructor() {
    this.storageKey = 'mqc_current_user';
    this.currentUser = this.loadSession();
  }

  loadSession() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  login(email, name = '') {
    if (!email || !this.validateEmail(email)) {
      throw new Error('Please enter a valid email address.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const displayName = name.trim() || cleanEmail.split('@')[0];
    const initial = displayName.charAt(0).toUpperCase();

    const user = {
      email: cleanEmail,
      name: displayName,
      initial: initial,
      loggedInAt: new Date().toISOString()
    };

    this.currentUser = user;
    localStorage.setItem(this.storageKey, JSON.stringify(user));
    return user;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem(this.storageKey);
  }

  isLoggedIn() {
    return !!this.currentUser;
  }

  getUser() {
    return this.currentUser;
  }

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }
}

window.authManager = new AuthManager();
