import { mount } from 'svelte';
import { applySky, skyForHour } from '$lib/theme/sky';
import App from './App.svelte';
import './styles/base.css';

applySky(skyForHour(new Date().getHours()));

const target = document.getElementById('app');
if (!target) throw new Error('Missing #app root element');

export default mount(App, { target });
