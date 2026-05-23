const tokenKey = 'dailyflowToken';
const anonymousStorageScope = 'anonymous';

const decodeBase64Url = (value) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  return window.atob(paddedBase64);
};

export const getCurrentUserIdFromToken = () => {
  try {
    const token = localStorage.getItem(tokenKey);
    const payload = token?.split('.')[1];

    if (!payload) {
      return anonymousStorageScope;
    }

    const parsedPayload = JSON.parse(decodeBase64Url(payload));
    return parsedPayload.id || anonymousStorageScope;
  } catch {
    return anonymousStorageScope;
  }
};

export const getUserStorageKey = (baseKey) =>
  `${baseKey}:${getCurrentUserIdFromToken()}`;

