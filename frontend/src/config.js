const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const API_URL = (
  import.meta.env.VITE_API_URL ||
  (isLocalHost ? 'http://localhost:5000/api' : `${window.location.origin.replace(/\/$/, '')}/api`)
).replace(/\/$/, '');
