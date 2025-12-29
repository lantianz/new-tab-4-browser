<template>
  <div class="plugin-popup">
    <!-- 标题栏 -->
    <div class="popup-header">
      <div class="header-title">
        <span class="title">Chrome Extension</span>
      </div>
      <span class="version">v{{ version }}</span>
    </div>

    <!-- 内容区域 -->
    <div class="popup-content">
      <!-- 欢迎卡片 -->
      <div class="welcome-card">
        <h2>欢迎使用!</h2>
        <p>这是一个基于 Vue3 + Vite 的 Chrome 扩展脚手架。</p>
      </div>

      <!-- 功能演示 -->
      <div class="demo-section">
        <h3>功能演示</h3>

        <!-- 计数器 -->
        <div class="demo-item">
          <span class="label">计数器:</span>
          <div class="counter-controls">
            <button class="btn btn-sm" @click="decrement">-</button>
            <span class="count">{{ count }}</span>
            <button class="btn btn-sm" @click="increment">+</button>
          </div>
        </div>

        <!-- 下拉选择 -->
        <div class="demo-item">
          <span class="label">选择框:</span>
          <CustomSelect
            v-model="selectedOption"
            :options="selectOptions"
          />
        </div>

        <!-- Toast 演示 -->
        <div class="demo-item">
          <span class="label">Toast:</span>
          <div class="toast-buttons">
            <button class="btn btn-success btn-sm" @click="showSuccessToast">成功</button>
            <button class="btn btn-error btn-sm" @click="showErrorToast">错误</button>
            <button class="btn btn-warning btn-sm" @click="showWarningToast">警告</button>
            <button class="btn btn-info btn-sm" @click="showInfoToast">信息</button>
          </div>
        </div>
      </div>

      <!-- 页面信息 -->
      <div class="page-info">
        <h3>当前页面</h3>
        <p class="page-title">{{ pageTitle || '加载中...' }}</p>
        <p class="page-url">{{ pageUrl || '加载中...' }}</p>
      </div>
    </div>

    <!-- 底部 -->
    <div class="popup-footer">
      <span>using Vue3 + Vite</span>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import CustomSelect from '@/components/common/CustomSelect.vue'
import { showSuccess, showError, showWarning, showInfo } from '@/utils/common/toast'

export default {
  name: 'App',
  components: {
    CustomSelect,
  },
  setup() {
    const version = ref('1.0.0')
    const count = ref(0)
    const selectedOption = ref('option1')
    const pageTitle = ref('')
    const pageUrl = ref('')

    const selectOptions = [
      { label: '选项一', value: 'option1' },
      { label: '选项二', value: 'option2' },
      { label: '选项三', value: 'option3' },
    ]

    const increment = () => {
      count.value++
    }

    const decrement = () => {
      count.value--
    }

    const showSuccessToast = () => {
      showSuccess('操作成功!')
    }

    const showErrorToast = () => {
      showError('操作失败!')
    }

    const showWarningToast = () => {
      showWarning('请注意!')
    }

    const showInfoToast = () => {
      showInfo('这是一条信息')
    }

    // 获取当前页面信息
    const getPageInfo = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (tab) {
          pageTitle.value = tab.title || '无标题'
          pageUrl.value = tab.url || '无 URL'
        }
      } catch (error) {
        console.error('获取页面信息失败:', error)
        pageTitle.value = '获取失败'
        pageUrl.value = '获取失败'
      }
    }

    onMounted(() => {
      getPageInfo()
    })

    return {
      version,
      count,
      selectedOption,
      selectOptions,
      pageTitle,
      pageUrl,
      increment,
      decrement,
      showSuccessToast,
      showErrorToast,
      showWarningToast,
      showInfoToast,
    }
  },
}
</script>

<style scoped>
.plugin-popup {
  width: 360px;
  height: 400px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 标题栏 */
.popup-header {
  padding: 16px;
  background: gray;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.title {
  font-size: 16px;
  font-weight: 600;
}

.version {
  font-size: 12px;
  opacity: 0.8;
}

/* 内容区域 */
.popup-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 欢迎卡片 */
.welcome-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  border-radius: 12px;
  padding: 16px;
}

.welcome-card h2 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #1f2937;
}

.welcome-card p {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
}

/* 功能演示 */
.demo-section {
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
}

.demo-section h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #374151;
}

.demo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.demo-item:last-child {
  margin-bottom: 0;
}

.demo-item .label {
  font-size: 13px;
  color: #6b7280;
  min-width: 60px;
}

/* 计数器 */
.counter-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.count {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  min-width: 32px;
  text-align: center;
}

/* Toast 按钮 */
.toast-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* 按钮样式 */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:active {
  transform: translateY(0);
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-error {
  background: #ef4444;
  color: white;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-info {
  background: #3b82f6;
  color: white;
}

/* 页面信息 */
.page-info {
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
}

.page-info h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #374151;
}

.page-title {
  margin: 0 0 4px 0;
  font-size: 13px;
  color: #1f2937;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-url {
  margin: 0;
  font-size: 11px;
  color: #9ca3af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 底部 */
.popup-footer {
  padding: 12px 16px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  font-size: 11px;
  color: #9ca3af;
}
</style>
