<template>
  <el-config-provider :locale="zhCn">
    <div class="page-shell">
      <BookmarkBar
        :toolbar-items="toolbarItems"
        :visible-toolbar-items="visibleToolbarItems"
        :overflow-toolbar-items="overflowToolbarItems"
        :active-top-folder-id="activeTopFolderId"
        :bookmark-bar-style="bookmarkBarStyle"
        :loading="loading"
        :build-bookmark-title="buildBookmarkTitle"
        @top-folder-visible-change="handleTopFolderVisibleChange"
        @clear-cache="clearCache"
        @refresh-bookmarks="refreshBookmarks()"
        @open-debug="debugVisible = true"
        @open-theme="themeVisible = true"
        @open-webdav="configVisible = true"
        @bookmark-link-click="handleBookmarkNavigate" />

      <main
        class="main-stage"
        @click="handleMainStageClick">
        <div class="tab-stage">
          <SearchStage
            ref="searchStageRef"
            :all-links="allLinks"
            :suspend-hotkeys="configVisible || themeVisible || debugVisible"
            @bookmark-link-click="handleBookmarkNavigate" />
        </div>
      </main>

      <WebDavConfigDrawer
        v-model="configVisible"
        :config="config"
        :testing="testing"
        @test="testConnection"
        @save="saveConfig" />

      <el-drawer
        v-model="debugVisible"
        class="panel-drawer"
        title="解析树调试"
        direction="rtl"
        size="520px">
        <el-scrollbar max-height="calc(100vh - 120px)">
          <pre class="debug-tree">{{ debugTreeText }}</pre>
        </el-scrollbar>
      </el-drawer>

      <BookmarkThemeDrawer
        v-model="themeVisible"
        :theme="bookmarkTheme"
        :background-config="backgroundConfig"
        :background-files="backgroundFiles"
        @choose-background="chooseBackgroundImage"
        @apply-remote-background="applyRemoteBackground"
        @change-background-source="changeBackgroundSource"
        @clear-background="clearBackgroundImage"
        @save="saveBookmarkTheme" />

      <JumpOverlay
        :visible="jumpOverlayVisible"
        :text="bookmarkTheme.jumpOverlayText" />
    </div>
  </el-config-provider>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { ElMessage } from 'element-plus'
import BookmarkBar from '@/features/bookmarks/components/BookmarkBar.vue'
import BookmarkThemeDrawer from '@/features/bookmarks/components/BookmarkThemeDrawer.vue'
import JumpOverlay from '@/features/bookmarks/components/JumpOverlay.vue'
import WebDavConfigDrawer from '@/features/bookmarks/components/WebDavConfigDrawer.vue'
import { DEFAULT_BOOKMARK_THEME } from '@/features/bookmarks/constants'
import { buildBookmarkTitle } from '@/features/bookmarks/services/bookmarkTitleService'
import { hasCompleteWebDavConfig, fetchBookmarksFromWebDav } from '@/features/bookmarks/services/webdavBookmarkService'
import { useBookmarkUiStore } from '@/features/bookmarks/stores/bookmarkUiStore'
import SearchStage from '@/features/search/components/SearchStage.vue'
import {
  clearBackgroundFileHandle,
  clearBackgroundImageMeta,
  loadBackgroundFileHandle,
  loadBackgroundImageLabel,
  loadBackgroundImageSource,
  loadBackgroundRemoteUrl,
  pickBackgroundImageFile,
  persistBackgroundImageMeta,
  saveBackgroundImageSource,
  saveBackgroundRemoteUrl,
  saveBackgroundFileHandle,
} from '@/features/search/services/backgroundImageService'
import { STORAGE_CACHE_KEY, STORAGE_CONFIG_KEY } from '@/shared/constants/storageKeys'
import { getChromeLocal, sendChromeMessage, setChromeLocal } from '@/shared/services/chromeStorageService'

const bookmarkUiStore = useBookmarkUiStore()
const {
  bookmarkTree,
  toolbarItems,
  visibleToolbarItems,
  overflowToolbarItems,
  allLinks,
  activeTopFolderId,
  bookmarkTheme,
  debugVisible,
  themeVisible,
  jumpOverlayVisible,
  bookmarkBarStyle,
} = storeToRefs(bookmarkUiStore)

const searchStageRef = ref(null)
const configVisible = ref(false)
const loading = ref(false)
const testing = ref(false)
const backgroundFileHandle = ref(null)
const backgroundSource = ref('none')
const backgroundRemoteUrl = ref('')
const backgroundImageLabel = ref('')
const backgroundPreviewUrl = ref('')

let currentBackgroundObjectUrl = null
let jumpOverlayTimer = null

function normalizeConfig(rawConfig = {}) {
  const normalized = {
    ...rawConfig,
  }

  if (!normalized.autoSyncIntervalUnit) {
    normalized.autoSyncIntervalUnit = 'minute'
  }

  if (!normalized.autoSyncIntervalValue) {
    normalized.autoSyncIntervalValue = normalized.autoSyncIntervalMinutes || 30
  }

  delete normalized.autoSyncIntervalMinutes
  return normalized
}

const config = ref({
  url: 'https://dav.jianguoyun.com/dav/',
  username: '',
  password: '',
  remoteFile: '',
  autoSyncEnabled: false,
  autoSyncIntervalUnit: 'minute',
  autoSyncIntervalValue: 30,
})

const debugTreeText = computed(() => {
  if (!bookmarkTree.value) {
    return '暂无解析结果，请先刷新书签。'
  }

  return (bookmarkTree.value.children || [])
    .map((child) => formatDebugTree(child, 0))
    .join('\n')
    .trim()
})

const backgroundFiles = computed(() => {
  if (backgroundSource.value !== 'local' || !backgroundPreviewUrl.value) {
    return []
  }

  return [
    {
      name: backgroundImageLabel.value || '背景图片',
      url: backgroundPreviewUrl.value,
    },
  ]
})

const backgroundConfig = computed(() => ({
  source: backgroundSource.value,
  remoteUrl: backgroundRemoteUrl.value,
}))

function showMessage(message, type = 'success') {
  ElMessage.closeAll()
  ElMessage({
    message,
    type,
    appendTo: document.body,
    offset: 20,
    zIndex: 4000,
    grouping: true,
  })
}

function formatDebugTree(node, depth = 0) {
  if (!node) return ''

  const indent = '  '.repeat(depth)
  if (node.type === 'link') {
    return `${indent}- ${node.name}\n`
  }

  const lines = depth === 0 ? [] : [`${indent}${node.name}\n`]
  for (const child of node.children || []) {
    lines.push(formatDebugTree(child, depth + (depth === 0 ? 0 : 1)))
  }
  return lines.join('')
}

function updateView(tree) {
  bookmarkUiStore.updateTree(tree)
  recalcToolbarItems()
}

function handleTopFolderVisibleChange(id, visible) {
  activeTopFolderId.value = visible ? id : activeTopFolderId.value === id ? null : activeTopFolderId.value
}

function estimateBarItemWidth(item) {
  const text = item?.name || ''
  return Math.min(72 + text.length * 14, 220)
}

function recalcToolbarItems() {
  const items = toolbarItems.value || []
  if (!items.length) {
    visibleToolbarItems.value = []
    overflowToolbarItems.value = []
    return
  }

  const containerWidth = document.querySelector('.bar-left')?.getBoundingClientRect?.().width || 0
  if (!containerWidth) {
    visibleToolbarItems.value = items
    overflowToolbarItems.value = []
    return
  }

  const overflowButtonWidth = 44
  const nextVisible = []
  const nextOverflow = []
  let used = 0

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index]
    const width = estimateBarItemWidth(item)
    const isOther = item.name === '其他书签'
    const remainCount = items.length - index - 1
    const reserveOverflow = remainCount > 0 ? overflowButtonWidth : 0

    if (isOther) {
      nextVisible.push(item)
      continue
    }

    if (used + width + reserveOverflow <= containerWidth) {
      nextVisible.push(item)
      used += width + 4
    } else {
      nextOverflow.push(item)
    }
  }

  visibleToolbarItems.value = nextVisible
  overflowToolbarItems.value = nextOverflow
}

function applyBackgroundImage(path) {
  if (currentBackgroundObjectUrl) {
    URL.revokeObjectURL(currentBackgroundObjectUrl)
    currentBackgroundObjectUrl = null
  }

  if (!path) {
    document.body.style.removeProperty('background-image')
    backgroundPreviewUrl.value = ''
    return
  }

  if (path.startsWith('blob:')) {
    currentBackgroundObjectUrl = path
  }
  backgroundPreviewUrl.value = path
  document.body.style.backgroundImage = `url("${path}")`
}

function applyBackgroundFile(file) {
  backgroundImageLabel.value = file.name
  persistBackgroundImageMeta(file.name, file.name)
  backgroundSource.value = 'local'
  saveBackgroundImageSource('local')
  applyBackgroundImage(URL.createObjectURL(file))
}

async function applyBackgroundFromHandle(silent = false) {
  if (!backgroundFileHandle.value) {
    applyBackgroundImage('')
    return
  }

  try {
    if (typeof backgroundFileHandle.value.queryPermission === 'function') {
      let permission = await backgroundFileHandle.value.queryPermission({ mode: 'read' })
      if (permission !== 'granted' && typeof backgroundFileHandle.value.requestPermission === 'function') {
        permission = await backgroundFileHandle.value.requestPermission({ mode: 'read' })
      }
      if (permission !== 'granted') {
        if (!silent) {
          showMessage('背景图读取权限未授予，请重新选择图片', 'warning')
        }
        return
      }
    }

    const file = await backgroundFileHandle.value.getFile()
    applyBackgroundFile(file)
  } catch (_error) {
    if (backgroundSource.value === 'local') {
      applyBackgroundImage('')
    }
    if (!silent) {
      showMessage('背景图读取失败，请重新选择图片', 'warning')
    }
  }
}

function validateRemoteBackgroundUrl(url) {
  const nextUrl = (url || '').trim()
  if (!nextUrl) {
    return { valid: false, message: '请输入图片链接' }
  }

  try {
    const parsed = new URL(nextUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, message: '仅支持 http 或 https 图片链接' }
    }
  } catch {
    return { valid: false, message: '图片链接格式不正确' }
  }

  return { valid: true, url: nextUrl }
}

function preloadRemoteImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(url)
    image.onerror = () => reject(new Error('load-failed'))
    image.src = url
  })
}

async function chooseBackgroundImage() {
  try {
    if (typeof window.showOpenFilePicker !== 'function') {
      showMessage('当前环境不支持图片选择器', 'warning')
      return
    }

    const { fileHandle, file } = await pickBackgroundImageFile()
    backgroundFileHandle.value = fileHandle
    await saveBackgroundFileHandle(fileHandle)
    applyBackgroundFile(file)
    showMessage('背景图已更新')
  } catch (error) {
    if (error?.name !== 'AbortError') {
      showMessage('背景图设置失败，请重试', 'error')
    }
  }
}

async function applyRemoteBackground(url, options = {}) {
  const { silent = false } = options
  const validation = validateRemoteBackgroundUrl(url)
  if (!validation.valid) {
    if (!silent) {
      showMessage(validation.message, 'warning')
    }
    return false
  }

  try {
    await preloadRemoteImage(validation.url)
    backgroundRemoteUrl.value = validation.url
    backgroundSource.value = 'remote'
    saveBackgroundRemoteUrl(validation.url)
    saveBackgroundImageSource('remote')
    applyBackgroundImage(validation.url)
    backgroundImageLabel.value = '网络背景图片'
    if (!silent) {
      showMessage('背景图已更新')
    }
    return true
  } catch {
    if (!silent) {
      showMessage('网络图片加载失败，请检查链接是否可访问', 'error')
    }
    return false
  }
}

async function changeBackgroundSource(source) {
  if (source === backgroundSource.value) {
    return
  }

  if (source === 'local') {
    backgroundSource.value = 'local'
    saveBackgroundImageSource('local')

    if (backgroundFileHandle.value) {
      await applyBackgroundFromHandle(true)
    } else {
      applyBackgroundImage('')
    }
    return
  }

  if (source === 'remote') {
    backgroundSource.value = 'remote'
    saveBackgroundImageSource('remote')

    if (backgroundRemoteUrl.value) {
      const applied = await applyRemoteBackground(backgroundRemoteUrl.value, { silent: true })
      if (!applied) {
        applyBackgroundImage('')
      }
    } else {
      applyBackgroundImage('')
    }
    return
  }

  backgroundSource.value = 'none'
  saveBackgroundImageSource('none')
  applyBackgroundImage('')
}

async function clearBackgroundImage() {
  if (backgroundSource.value === 'remote') {
    backgroundRemoteUrl.value = ''
    saveBackgroundRemoteUrl('')
  } else {
    backgroundFileHandle.value = null
    backgroundImageLabel.value = ''
    await clearBackgroundFileHandle()
    clearBackgroundImageMeta()
  }

  backgroundSource.value = 'none'
  saveBackgroundImageSource('none')
  applyBackgroundImage('')
  showMessage('背景图已清空')
}

function showJumpOverlay() {
  jumpOverlayVisible.value = true
  clearTimeout(jumpOverlayTimer)
  jumpOverlayTimer = setTimeout(() => {
    jumpOverlayVisible.value = false
  }, 1400)
}

function handleBookmarkNavigate(url) {
  if (!url) return
  showJumpOverlay()
  window.setTimeout(() => {
    window.location.assign(url)
  }, 120)
}

function saveBookmarkTheme(nextTheme) {
  bookmarkTheme.value = {
    ...DEFAULT_BOOKMARK_THEME,
    ...nextTheme,
  }
  bookmarkUiStore.saveTheme()
  themeVisible.value = false
  showMessage('页面设置已保存')
}

function handleMainStageClick(event) {
  searchStageRef.value?.handleStageClick?.(event)
}

async function saveConfig(nextConfig) {
  config.value = normalizeConfig({
    ...config.value,
    ...nextConfig,
  })
  await setChromeLocal({
    [STORAGE_CONFIG_KEY]: config.value,
  })
  await sendChromeMessage({ action: 'updateAutoSync' })
  configVisible.value = false

  if (hasCompleteWebDavConfig(config.value)) {
    await refreshBookmarks('配置已保存，书签已刷新')
    return
  }

  showMessage('配置已保存')
}

async function clearCache() {
  await setChromeLocal({
    [STORAGE_CACHE_KEY]: null,
  })
  bookmarkUiStore.clearBookmarks()
  showMessage('缓存已清空')
}

async function testConnection(nextConfig) {
  const testConfig = normalizeConfig({
    ...config.value,
    ...nextConfig,
  })

  if (!hasCompleteWebDavConfig(testConfig)) {
    showMessage('请先填写完整的 WebDAV 配置', 'error')
    return
  }

  testing.value = true
  try {
    const result = await fetchBookmarksFromWebDav(testConfig)
    if (typeof result.html !== 'string' || !result.html.includes('NETSCAPE-Bookmark-file-1')) {
      showMessage('连接成功，但目标文件不像是 Chrome 书签导出文件', 'warning')
      return
    }
    showMessage('连接成功，书签文件可读取')
  } catch (error) {
    showMessage(`连接失败: ${error.message}`, 'error')
  } finally {
    testing.value = false
  }
}

async function refreshBookmarks(successMessage = '书签刷新成功') {
  if (!hasCompleteWebDavConfig(config.value)) {
    showMessage('请先填写完整的 WebDAV 配置', 'error')
    return
  }

  loading.value = true
  try {
    const { tree } = await fetchBookmarksFromWebDav(config.value)
    updateView(tree)
    await setChromeLocal({
      [STORAGE_CACHE_KEY]: {
        tree,
        updatedAt: new Date().toISOString(),
      },
    })
    showMessage(successMessage)
  } catch (error) {
    showMessage(`刷新失败: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

function handleChromeStorageChanged(changes, areaName) {
  if (areaName !== 'local') {
    return
  }

  if (changes[STORAGE_CACHE_KEY]) {
    const nextCache = changes[STORAGE_CACHE_KEY].newValue
    if (nextCache?.tree) {
      updateView(nextCache.tree)
    } else {
      bookmarkUiStore.clearBookmarks()
    }
  }

  if (changes[STORAGE_CONFIG_KEY]?.newValue) {
    config.value = normalizeConfig({
      ...config.value,
      ...changes[STORAGE_CONFIG_KEY].newValue,
    })
  }
}

async function initData() {
  const result = await getChromeLocal([STORAGE_CONFIG_KEY, STORAGE_CACHE_KEY])
  if (result[STORAGE_CONFIG_KEY]) {
    config.value = normalizeConfig({
      ...config.value,
      ...result[STORAGE_CONFIG_KEY],
    })
  }

  if (result[STORAGE_CACHE_KEY]?.tree) {
    updateView(result[STORAGE_CACHE_KEY].tree)
  }

  bookmarkUiStore.loadTheme()
  bookmarkTheme.value = {
    ...DEFAULT_BOOKMARK_THEME,
    ...bookmarkTheme.value,
  }
  backgroundSource.value = loadBackgroundImageSource()
  backgroundRemoteUrl.value = loadBackgroundRemoteUrl()
  backgroundImageLabel.value = loadBackgroundImageLabel()
  backgroundFileHandle.value = await loadBackgroundFileHandle()

  if (backgroundSource.value === 'remote' && backgroundRemoteUrl.value) {
    const applied = await applyRemoteBackground(backgroundRemoteUrl.value, { silent: true })
    if (!applied) {
      backgroundSource.value = 'none'
      saveBackgroundImageSource('none')
    }
  } else if (backgroundSource.value === 'local' && backgroundFileHandle.value) {
    await applyBackgroundFromHandle(true)
  } else {
    backgroundSource.value = 'none'
    applyBackgroundImage('')
  }

  recalcToolbarItems()
}

onMounted(async () => {
  await initData()
  window.addEventListener('resize', recalcToolbarItems)
  chrome.storage.onChanged.addListener(handleChromeStorageChanged)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', recalcToolbarItems)
  chrome.storage.onChanged.removeListener(handleChromeStorageChanged)
  clearTimeout(jumpOverlayTimer)
  if (currentBackgroundObjectUrl) {
    URL.revokeObjectURL(currentBackgroundObjectUrl)
    currentBackgroundObjectUrl = null
  }
})
</script>

<style>
:root {
  --el-color-primary: #6faeb5;
  --el-color-primary-light-3: #8dbfc5;
  --el-color-primary-light-5: #a7cfd3;
  --el-color-primary-light-7: #c5dfe2;
  --el-color-primary-light-8: #d5e9eb;
  --el-color-primary-light-9: #e8f5f6;
  --el-color-primary-dark-2: #538f97;
  --bar-bg: rgba(241, 249, 250, 0.82);
  --panel-bg: rgba(255, 255, 255, 0.92);
  --line-color: rgba(103, 149, 157, 0.16);
  --text-main: #32424d;
  --text-sub: #738992;
  --icon-color: #7ea5b1;
  --bar-hover-bg: rgba(218, 235, 238, 0.88);
  --bar-active-bg: rgba(210, 231, 235, 0.98);
  --bar-active-border: rgba(126, 165, 177, 0.28);
}

.panel-drawer {
  --el-drawer-padding-primary: 12px;
}

body {
  color: var(--text-main);
}

.page-shell {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.bookmark-bar {
  position: fixed;
  inset: 0 0 auto 0;
  height: 44px;
  padding: 2px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--bar-bg);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--line-color);
  z-index: 50;
}

.bar-left {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: stretch;
}

.bar-scroll {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
}

.other-bookmarks-item {
  margin-left: auto;
}

.overflow-bookmarks-button {
  padding: 0 12px;
}

.bar-empty {
  min-width: 0;
  padding: 0 10px;
  color: var(--text-sub);
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar-right {
  display: flex;
  align-items: center;
}

.bar-item {
  height: 32px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-main);
  border-radius: 8px;
}
.bar-item:hover {
  background: var(--bar-hover-bg);
  border-color: var(--line-color);
}

.bookmark-bar.has-active-folder .link-item:hover {
  background: transparent;
  border-color: transparent;
}

.bar-item.is-active {
  background: var(--bar-active-bg);
  border-color: var(--bar-active-border);
  color: #23343d;
}

.bar-item {
  flex: 0 0 auto;
  min-width: 0;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 7px;
  text-decoration: none;
  cursor: pointer;
  width: auto;
  max-width: 176px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-icon,
.menu-icon {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  color: var(--icon-color);
}

.item-text,
.menu-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favicon,
.menu-favicon {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex: 0 0 auto;
}

.more-button {
  width: 28px;
  height: 28px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--text-main);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.more-button:hover {
  background: rgba(231, 241, 243, 0.96);
  border-color: var(--line-color);
}

.main-stage {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-stage {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-stage * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  border: none;
  outline: none;
}

.search-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.search-stack {
  width: 48vw;
  min-width: 350px;
}

.search-container {
  --height-1: 48px;
  --height-2: 46px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: var(--height-1);
  border-radius: calc(var(--height-1) / 2);
  background-color: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.search-container > * {
  height: var(--height-2);
}

.engine-container > *,
.button-container > * {
  height: var(--height-2);
}

.input-container > input {
  width: 100%;
  height: var(--height-2);
}

.shortcut-container > * {
  height: calc(var(--height-2) / 2);
}

.engine-item,
.button-item {
  height: var(--height-2);
}

.shortcut-item {
  height: calc(var(--height-2) / 2);
}

.engine-item > svg,
.button-item > svg {
  height: calc(var(--height-2) / 2);
}

.input-container,
.shortcut-container,
.button-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 12px;
}

.input-container {
  flex: 1;
}

.engine-item,
.shortcut-item,
.button-item {
  animation: pop-in 0.3s ease-out;
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: scale(0.3);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.engine-list,
.button-list {
  display: flex;
  align-items: center;
  cursor: auto;
  height: var(--height-2);
  border-radius: calc(var(--height-2) / 2);
  transition: all 0.3s ease-in-out;
}

.engine-list.expanded,
.button-list.expanded {
  background-color: rgba(255, 255, 255, 0.2);
}

.engine-item {
  width: var(--height-2);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.engine-item:hover {
  background-color: rgba(255, 255, 255, 0.9);
}

.engine-item > svg {
  aspect-ratio: 1;
  border-radius: 50%;
}

.search-input,
.settings-input {
  background-color: transparent;
  font-size: 17px;
  color: var(--text-main);
}

.search-input::placeholder,
.settings-input::placeholder {
  color: rgba(50, 66, 77, 0.66);
}

.shortcut-list {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.shortcut-item {
  aspect-ratio: 1;
  border-radius: 15%;
  cursor: pointer;
  transition: transform 0.2s ease-out;
}

.shortcut-item:hover {
  transform: scale(1.2);
}

.button-list {
  flex-direction: row-reverse;
}

.button-item {
  aspect-ratio: 1;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.button-item > svg {
  aspect-ratio: 1;
  border-radius: 50%;
}

.button-item:hover {
  background-color: rgba(255, 255, 255, 0.9);
}

.hidden {
  display: none !important;
}

.fade-out-up {
  animation: fadeOutUp 0.5s forwards;
}

.fade-in-down {
  animation: fadeInDown 0.5s forwards;
}

@keyframes fadeOutUp {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-50px);
    visibility: hidden;
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-50px);
    visibility: hidden;
  }
  to {
    opacity: 1;
    transform: translateY(0);
    visibility: visible;
  }
}

.bookmark-result-popper.el-popper {
  padding: 10px !important;
  border-radius: 20px !important;
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
  background: rgba(255, 255, 255, 0.28) !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1) !important;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 46px;
  padding: 6px 12px;
  border-radius: 12px;
  border: 1px solid transparent;
  text-decoration: none;
  color: var(--text-main);
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    backdrop-filter 0.18s ease,
    -webkit-backdrop-filter 0.18s ease;
}

.result-item:hover {
  background: rgba(255, 255, 255, 0.34);
  border-color: rgba(255, 255, 255, 0.42);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 6px 18px rgba(98, 122, 131, 0.08);
}

.result-copy {
  min-width: 0;
  flex: 1;
}

.result-name {
  font-size: 15px;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-path {
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.25;
  color: var(--text-sub);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-state {
  padding: 24px 0;
  text-align: center;
  color: var(--text-sub);
}

.debug-tree {
  margin: 0;
  padding: 8px 10px 24px;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 13px;
  line-height: 1.65;
  color: var(--text-main);
}

.theme-panel {
  display: grid;
  gap: 14px;
  padding: 10px 6px 22px;
}

.theme-row {
  display: grid;
  grid-template-columns: 88px 1fr;
  align-items: center;
  gap: 14px;
}

.theme-control {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
}

.theme-value {
  min-width: 0;
  font-size: 12px;
  line-height: 1.3;
  color: var(--text-sub);
  font-family: Consolas, 'SFMono-Regular', Monaco, monospace;
  white-space: normal;
  word-break: break-word;
  padding: 6px 10px;
  border-radius: 10px;
  background: rgba(244, 248, 249, 0.92);
  border: 1px solid rgba(118, 157, 166, 0.14);
}

.theme-label {
  color: var(--text-main);
  font-size: 14px;
}

.theme-color-input {
  width: 72px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(118, 157, 166, 0.18);
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
}

.theme-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 6px;
}

.drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.bookmark-popper.el-popper {
  padding: 4px !important;
  border-radius: 10px !important;
  border-color: rgba(118, 157, 166, 0.14) !important;
  box-shadow: 0 10px 24px rgba(69, 88, 96, 0.14) !important;
  background: rgba(255, 255, 255, 0.98) !important;
  overflow: hidden !important;
}

.action-popper {
  min-width: 148px !important;
}

.action-menu {
  display: grid;
  gap: 2px;
}

.action-menu-item {
  min-height: 30px;
  padding: 0 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--text-main);
  text-align: left;
  cursor: pointer;
}

.action-menu-item:hover {
  background: rgba(231, 241, 243, 0.88);
}

.bookmark-popover-transition-enter-active,
.bookmark-popover-transition-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.bookmark-popover-transition-enter-from,
.bookmark-popover-transition-leave-to {
  opacity: 0;
  transform: translateY(-3px);
}

.bookmark-menu {
  display: grid;
  gap: 2px;
  width: 100%;
  min-width: 0;
}

.menu-row {
  width: 100%;
  min-height: 28px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  border-radius: 6px;
  color: var(--text-main);
  background: transparent;
  border: 0;
  text-decoration: none;
  cursor: pointer;
  font-size: 13px;
}

.menu-row:hover {
  background: rgba(231, 241, 243, 0.88);
}

.menu-arrow {
  margin-left: auto;
  color: var(--text-sub);
  font-size: 12px;
}

.bookmark-suggest-panel,
.bookmark-popper,
.el-drawer__body {
  scrollbar-width: thin;
  scrollbar-color: rgba(146, 172, 179, 0.9) rgba(235, 244, 246, 0.7);
}

.bookmark-suggest-panel::-webkit-scrollbar,
.bookmark-popper::-webkit-scrollbar,
.el-drawer__body::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.bookmark-suggest-panel::-webkit-scrollbar-thumb,
.bookmark-popper::-webkit-scrollbar-thumb,
.el-drawer__body::-webkit-scrollbar-thumb {
  background: rgba(146, 172, 179, 0.9);
  border-radius: 999px;
}

.bookmark-suggest-panel::-webkit-scrollbar-track,
.bookmark-popper::-webkit-scrollbar-track,
.el-drawer__body::-webkit-scrollbar-track {
  background: rgba(235, 244, 246, 0.7);
  border-radius: 999px;
}
</style>
