import { createApp } from 'vue'
import './style.css'
import webEyeSDK from '../../src/webEyeSDK'
import App from './App.vue'
createApp(App).use(webEyeSDK, {
    url: 'http://127.0.0.1:3000/reportData'
}).mount('#app')
