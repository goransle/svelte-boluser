import { writable } from 'svelte/store';
import { browser } from '$app/env';

const defaultConfig = {
    API_URL: 'https:/',
    API_KEY: '',
    STEP: 1
}

export const CONFIG = writable(JSON.parse(browser &&localStorage.getItem('appconfig')) || defaultConfig);
CONFIG.subscribe((val) => {
    if(browser){
        localStorage.setItem('appconfig', JSON.stringify(val));
    }
});

