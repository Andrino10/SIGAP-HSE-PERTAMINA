import { ref, computed } from 'vue';
import { adminLogin as apiAdminLogin, adminLogout as apiAdminLogout, getAdminMe } from '../services/api';

const TOKEN_KEY = 'sigap_hse_admin_token';
const USER_KEY = 'sigap_hse_admin_user';

// State global (shared across all composable instances)
const token = ref(localStorage.getItem(TOKEN_KEY) || '');
const adminUser = ref(() => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
})();

export function useAdminAuth() {
  const isAuthenticated = computed(() => !!token.value);

  /**
   * Login admin. Throws error jika gagal.
   */
  async function login(username, password) {
    if (!username || !password) {
      throw new Error('Username dan password wajib diisi.');
    }

    let res;
    try {
      res = await apiAdminLogin(username.trim(), password);
    } catch (err) {
      // Coba baca pesan error dari response backend
      const errMsg = err?.data?.message || err?.message || 'Koneksi ke server gagal. Periksa internet Anda.';
      throw new Error(errMsg);
    }

    if (!res) {
      throw new Error('Server tidak memberikan respons. Coba lagi.');
    }

    if (!res.success) {
      throw new Error(res.message || 'Login gagal. Periksa username dan password.');
    }

    if (!res.data) {
      throw new Error('Data sesi tidak valid dari server.');
    }

    // Ekstrak token dari berbagai kemungkinan struktur response
    const tokenValue =
      res.data.token ||
      res.data.session?.token ||
      res.data.user?.token ||
      null;

    const userValue =
      res.data.user ||
      res.data.session ||
      null;

    if (!tokenValue) {
      throw new Error('Token sesi tidak ditemukan dalam respons server.');
    }

    // Simpan ke state dan localStorage
    token.value = tokenValue;
    adminUser.value = userValue;
    localStorage.setItem(TOKEN_KEY, tokenValue);
    localStorage.setItem(USER_KEY, JSON.stringify(userValue));

    return userValue;
  }

  /**
   * Logout admin — hapus session di server dan localStorage.
   */
  async function logout() {
    try {
      if (token.value) {
        await apiAdminLogout();
      }
    } catch {
      // Lanjutkan meskipun server logout gagal
    } finally {
      token.value = '';
      adminUser.value = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }

  /**
   * Verifikasi session masih valid di server.
   * Jika gagal, lakukan logout lokal.
   */
  async function verifySession() {
    if (!token.value) return false;
    try {
      const res = await getAdminMe();
      if (res && res.success && res.data) {
        adminUser.value = res.data.user;
        if (res.data.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
        }
        return true;
      }
      // Session tidak valid di server
      await logout();
      return false;
    } catch {
      // Jaringan error — jangan logout agar admin tidak terpaksa login ulang karena timeout
      return !!token.value;
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
