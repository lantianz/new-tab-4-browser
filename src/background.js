/**
 * Background Service Worker
 * Chrome 扩展的后台脚本，处理扩展的核心逻辑
 */

/**
 * 扩展安装或更新时触发
 * 可以在这里初始化默认配置、创建右键菜单等
 */
chrome.runtime.onInstalled.addListener((_details) => {
  console.log('Extension installed/updated')

  // 设置默认配置到 Chrome 存储
  chrome.storage.sync.set({
    // 在此添加你的默认配置
    // 例如: autoEnable: false
  })

  // 创建右键菜单(可选)
  // chrome.contextMenus.create({
  //   id: 'your-menu-id',
  //   title: 'Your Menu Title',
  //   contexts: ['page']
  // })
})

/**
 * 处理右键菜单点击事件(可选)
 */
// chrome.contextMenus.onClicked.addListener((_info, _tab) => {
//   // 根据菜单 ID 执行不同的操作
//   // if (info.menuItemId === 'your-menu-id') {
//   //   chrome.tabs.sendMessage(tab.id, { action: 'yourAction' })
//   // }
// })

/**
 * 监听来自 content script 或 popup 的消息
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Background received message:', message)

  // 根据消息类型处理不同的逻辑
  switch (message.action) {
    case 'getData':
      // 示例：从存储中获取数据
      chrome.storage.sync.get(['yourData'], (result) => {
        sendResponse({ success: true, data: result.yourData })
      })
      return true // 表示异步响应

    case 'saveData':
      // 示例：保存数据到存储
      chrome.storage.sync.set({ yourData: message.data }, () => {
        sendResponse({ success: true })
      })
      return true

    default:
      sendResponse({ success: false, error: 'Unknown action' })
  }
})

/**
 * 监听标签页更新事件(可选)
 */
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (changeInfo.status === 'complete' && tab.url) {
//     // 页面加载完成后执行某些操作
//   }
// })
