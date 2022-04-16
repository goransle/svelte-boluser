import { writable } from 'svelte/store';

const defaultConfig = {
    API_URL: 'https:/',
    API_KEY: '',
    STEP: 1
}

export const CONFIG = writable(JSON.parse(localStorage.getItem('appconfig')) || defaultConfig);
CONFIG.subscribe((val) => {
    localStorage.setItem('appconfig', JSON.stringify(val));
});

