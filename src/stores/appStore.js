/**
 * 示例 Store
 * 使用 Pinia 的 Composition API 风格
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // ==================== 状态 ====================
  const count = ref(0)
  const message = ref('Hello Chrome Extension!')

  // ==================== 计算属性 ====================
  const doubleCount = computed(() => count.value * 2)

  // ==================== 方法 ====================
  function increment() {
    count.value++
  }

  function decrement() {
    count.value--
  }

  function setMessage(newMessage) {
    message.value = newMessage
  }

  // ==================== 持久化到 Chrome Storage ====================
  async function loadFromStorage() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['appState'], (result) => {
        if (result.appState) {
          count.value = result.appState.count || 0
          message.value = result.appState.message || 'Hello Chrome Extension!'
        }
        resolve()
      })
    })
  }

  async function saveToStorage() {
    return new Promise((resolve) => {
      chrome.storage.sync.set(
        {
          appState: {
            count: count.value,
            message: message.value,
          },
        },
        resolve
      )
    })
  }

  return {
    // 状态
    count,
    message,
    // 计算属性
    doubleCount,
    // 方法
    increment,
    decrement,
    setMessage,
    loadFromStorage,
    saveToStorage,
  }
})
