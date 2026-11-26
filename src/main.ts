import { mount } from 'svelte';
import { startSongprints } from '$lib/art/art.svelte';
import { pwa } from '$lib/pwa.svelte';
import { sky } from '$lib/sky/sky.svelte';
import App from './App.svelte';
import './styles/base.css';

sky.start();

const target = document.getElementById('app');
if (!target) throw new Error('Missing #app root element');

export default mount(App, { target });

pwa.start();
startSongprints();
