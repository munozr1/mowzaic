const MODE = import.meta.env.VITE_MODE;
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
export const MAPBOX_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places/';
export const BACKEND_URL = MODE === 'development' ? 'http://localhost:3000' : import.meta.env.VITE_API_URL;
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
