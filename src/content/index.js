/**
 * Content Script
 * 注入到网页中的脚本，可以访问和操作页面 DOM
 */

console.log('Content script loaded')

/**
 * 监听来自 background 或 popup 的消息
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Content script received message:', message)

  switch (message.action) {
    case 'getPageInfo':
      // 示例：获取页面信息
      sendResponse({
        success: true,
        data: {
          title: document.title,
          url: window.location.href,
        },
      })
      break

    case 'executeAction':
      // 示例：在页面上执行某些操作
      try {
        // 在这里添加你的页面操作逻辑
        sendResponse({ success: true })
      } catch (error) {
        sendResponse({ success: false, error: error.message })
      }
      break

    default:
      sendResponse({ success: false, error: 'Unknown action' })
  }
})

/**
 * 向 background 发送消息的示例函数
 */
function sendMessageToBackground(action, data = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action, ...data }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
      } else {
        resolve(response)
      }
    })
  })
}

// 导出供其他模块使用（如果需要）
window.__extensionContentScript = {
  sendMessageToBackground,
}
