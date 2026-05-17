import { parseBookmarks } from './utils/bookmark.js'

const STORAGE_CONFIG_KEY = 'new-tab-bookmarker-webdav-config'
const STORAGE_CACHE_KEY = 'new-tab-bookmarker-bookmark-cache'
const AUTO_SYNC_ALARM_NAME = 'new-tab-bookmarker-auto-sync'

function hasCompleteConfig(config) {
  return Boolean(
    config?.url
    && config?.username
    && config?.password
    && config?.remoteFile,
  )
}

function normalizeRemoteUrl(config) {
  return `${config.url.replace(/\/+$/, '')}/${config.remoteFile.replace(/^\/+/, '')}`
}

function getAutoSyncPeriodMinutes(config = {}) {
  if (config.autoSyncIntervalUnit && config.autoSyncIntervalValue) {
    const value = Math.max(1, Number(config.autoSyncIntervalValue) || 1)
    const unitFactorMap = {
      minute: 1,
      hour: 60,
      day: 1440,
    }
    return value * (unitFactorMap[config.autoSyncIntervalUnit] || 1)
  }

  return Number(config.autoSyncIntervalMinutes) || 30
}

async function syncBookmarksFromWebDav() {
  const result = await chrome.storage.local.get([STORAGE_CONFIG_KEY])
  const config = result[STORAGE_CONFIG_KEY]
  if (!hasCompleteConfig(config)) {
    return { success: false, reason: 'incomplete-config' }
  }

  const response = await fetch(normalizeRemoteUrl(config), {
    headers: {
      Authorization: `Basic ${btoa(`${config.username}:${config.password}`)}`,
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const html = await response.text()
  const tree = parseBookmarks(html)
  await chrome.storage.local.set({
    [STORAGE_CACHE_KEY]: {
      tree,
      updatedAt: new Date().toISOString(),
    },
  })
  return { success: true }
}

async function updateAutoSyncAlarm() {
  const result = await chrome.storage.local.get([STORAGE_CONFIG_KEY])
  const config = result[STORAGE_CONFIG_KEY] || {}

  await chrome.alarms.clear(AUTO_SYNC_ALARM_NAME)

  if (!config.autoSyncEnabled) {
    return
  }

  const intervalMinutes = getAutoSyncPeriodMinutes(config)
  await chrome.alarms.create(AUTO_SYNC_ALARM_NAME, {
    periodInMinutes: intervalMinutes,
  })
}

chrome.runtime.onInstalled.addListener(() => {
  updateAutoSyncAlarm().catch((error) => {
    console.error('Failed to initialize auto sync alarm:', error)
  })
})

chrome.runtime.onStartup.addListener(() => {
  updateAutoSyncAlarm().catch((error) => {
    console.error('Failed to restore auto sync alarm:', error)
  })
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== AUTO_SYNC_ALARM_NAME) {
    return
  }

  syncBookmarksFromWebDav().catch((error) => {
    console.error('Auto sync failed:', error)
  })
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action === 'updateAutoSync') {
    updateAutoSyncAlarm()
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }))
    return true
  }

  if (message?.action === 'syncBookmarksNow') {
    syncBookmarksFromWebDav()
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ success: false, error: error.message }))
    return true
  }

  sendResponse({ success: false, error: 'Unknown action' })
  return false
})
