// Dynamic API Base URL configuration
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocalhost 
  ? 'http://localhost:8000' 
  : 'https://axon-backend-n3ng.onrender.com';

// Supabase configuration for frontend Auth
const SUPABASE_URL = 'https://hfltstfrcxjhpefrmxio.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmbHRzdGZyY3hqaHBlZnJteGlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMjA0MzQsImV4cCI6MjEwNjU5NjQzNH0.hfzXSnEMXOaiKu-aDWSVje0SQRwHffuy9GK2GX7MHkg';
