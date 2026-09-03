import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

// Load original stylesheets verbatim (Preservation-First)
import './styles/style.css';
import './styles/admin.css';

const app = createApp(App);
app.use(router);
app.mount('#app');
