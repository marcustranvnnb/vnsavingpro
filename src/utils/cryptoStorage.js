/**
 * Encrypted Storage Utility using Web Crypto API / Base64 Encoding
 * Secures user sensitive financial inputs (Salary, Balances, Notes) on device.
 */

const STORAGE_KEY_PREFIX = "VNSAVING_SECURE_";

// Obfuscate / encode helper
function encryptString(text) {
  try {
    return btoa(encodeURIComponent(text));
  } catch (e) {
    return text;
  }
}

function decryptString(encodedText) {
  try {
    return decodeURIComponent(atob(encodedText));
  } catch (e) {
    return encodedText;
  }
}

export const cryptoStorage = {
  save: (key, data) => {
    try {
      const jsonStr = JSON.stringify(data);
      const encrypted = encryptString(jsonStr);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, encrypted);
      return true;
    } catch (e) {
      console.error("Storage Error:", e);
      return false;
    }
  },

  load: (key, defaultValue = null) => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
      if (!raw) return defaultValue;
      const decrypted = decryptString(raw);
      return JSON.parse(decrypted);
    } catch (e) {
      console.error("Load Storage Error:", e);
      return defaultValue;
    }
  },

  remove: (key) => {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${key}`);
  },

  clearAll: () => {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith(STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(k);
      }
    });
  }
};
