import { createApp } from 'vue'
import { createPinia } from 'pinia'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
// Bootstrap JS for collapse / modal / dropdown. Side-effect import.
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import './assets/main.css'
import './assets/pastel-design-system.css'
import './assets/buyer.scss'

import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
