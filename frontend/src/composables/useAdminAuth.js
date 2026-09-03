import { ref, computed } from 'vue';
import { adminLogin as apiAdminLogin, adminLogout as apiAdminLogout, getAdminMe } from '../services/api';

const TOKEN_KEY = 'sigap_hse_admin_token';
const USER_KEY = 'sigap_hse_admin_user';

const token = ref(localStorage.getItem(TOKEN_KEY) || '');
const adminUser = ref(JSON.parse(localStorage.getItem(USER_KEY) || 'null'));

export function useAdminAuth() {
  const isAuthenticated = computed(() => !!token.value);

  async function login(username, password) {
    const res = await apiAdminLogin(username, password);
    if (res && res.success && res.data) {
      token.value = res.data.token;
      adminUser.value = res.data.user;
      localStorage.setItem(TOKEN_KEY, res.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
      return res.data.user;
    }
    throw new Error(res?.message || 'Login gagal.');
  }

  async function logout() {
    try {
      if (token.value) {
        await apiAdminLogout();
      }
    } catch (e) {
      // Continue clearing session locally
    } finally {
      token.value = '';
      adminUser.value = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }

  async function verifySession() {
    if (!token.value) return false;
    try {
      const res = await getAdminMe();
      if (res && res.success && res.data) {
        adminUser.value = res.data.user;
        localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
        return true;
      }
      logout();
      return false;
    } catch (e) {
      logout();
      return false;
    }
  }

  return {
    token,
    adminUser,
    isAuthenticated,
    login,
    logout,
    verifySession
  };
}
