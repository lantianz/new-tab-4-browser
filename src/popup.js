/**
 * Popup 入口文件
 * 创建 Vue 应用并挂载到 DOM
 */
import { createApp } from 'vue'
import { pinia } from '@/stores'
import App from '@/App.vue'

const app = createApp(App)
app.use(pinia)
app.mount('#app')
