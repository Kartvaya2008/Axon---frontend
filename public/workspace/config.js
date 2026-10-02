// Dynamic API Base URL configuration
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocalhost 
  ? 'http://localhost:8000' 
  : 'https://axon-backend-n3ng.onrender.com';
