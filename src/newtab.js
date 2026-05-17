import { createApp } from 'vue'
import 'element-plus/dist/index.css'
import 'element-plus/es/components/message/style/css'
import { pinia } from '@/stores'
import App from '@/App.vue'

const app = createApp(App)
app.use(pinia)
app.mount('#app')
