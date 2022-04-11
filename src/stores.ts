import { writable } from 'svelte/store';

// The values
export const API_URL = writable(localStorage.getItem('api_url') || 'https://');
export const API_KEY = writable(localStorage.getItem('api_key') || '');


API_URL.subscribe((val)=>{
    localStorage.setItem('api_url', val);
});
API_KEY.subscribe((val)=>{
    localStorage.setItem('api_key', val);
});
