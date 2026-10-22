const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
const API_BASE_URL = `${protocol}//${window.location.hostname}:3001`;

export default API_BASE_URL;
