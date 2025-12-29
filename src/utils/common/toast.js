import { createApp } from 'vue'
import Toast from '@/components/common/Toast.vue'

// 存储当前显示的 Toast 实例
const toastInstances = []

/**
 * 显示 Toast 提示
 * @param {string} message - 提示消息文本
 * @param {string} type - 提示类型 ('success' | 'error' | 'warning' | 'info')
 * @param {number} duration - 显示时长（毫秒），默认 1500ms
 */
export function showToast(message, type = 'info', duration = 1500) {
  // 创建容器元素
  const container = document.createElement('div')
  document.body.appendChild(container)

  // 计算 top 位置（如果有多个 Toast，依次向下排列）
  const topOffset = 16 + toastInstances.length * 60 // 每个 Toast 高度约 60px（包括间距）

  // 创建 Toast 实例
  const app = createApp(Toast, {
    message,
    type,
    duration,
    onClose: () => {
      // 移除实例
      const index = toastInstances.indexOf(app)
      if (index > -1) {
        toastInstances.splice(index, 1)
      }

      // 卸载组件并移除容器
      app.unmount()
      document.body.removeChild(container)

      // 更新剩余 Toast 的位置
      updateToastPositions()
    },
  })

  // 挂载组件
  app.mount(container)

  // 设置容器的 top 位置
  container.style.position = 'fixed'
  container.style.top = `${topOffset}px`
  container.style.left = '16px'
  container.style.zIndex = '9999'

  // 添加到实例列表
  toastInstances.push({ app, container, topOffset })

  return app
}

/**
 * 更新所有 Toast 的位置
 */
function updateToastPositions() {
  toastInstances.forEach((instance, index) => {
    const newTopOffset = 16 + index * 60
    instance.container.style.top = `${newTopOffset}px`
    instance.topOffset = newTopOffset
  })
}

/**
 * 快捷方法：显示成功提示
 * @param {string} message - 提示消息文本
 * @param {number} duration - 显示时长（毫秒），默认 1500ms
 */
export function showSuccess(message, duration = 1500) {
  return showToast(message, 'success', duration)
}

/**
 * 快捷方法：显示错误提示
 * @param {string} message - 提示消息文本
 * @param {number} duration - 显示时长（毫秒），默认 1500ms
 */
export function showError(message, duration = 1500) {
  return showToast(message, 'error', duration)
}

/**
 * 快捷方法：显示警告提示
 * @param {string} message - 提示消息文本
 * @param {number} duration - 显示时长（毫秒），默认 1500ms
 */
export function showWarning(message, duration = 1500) {
  return showToast(message, 'warning', duration)
}

/**
 * 快捷方法：显示信息提示
 * @param {string} message - 提示消息文本
 * @param {number} duration - 显示时长（毫秒），默认 1500ms
 */
export function showInfo(message, duration = 1500) {
  return showToast(message, 'info', duration)
}
