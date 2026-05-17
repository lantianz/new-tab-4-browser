<template>
  <div class="page-shell">
    <header class="bookmark-bar">
      <div class="bar-left">
        <div class="bar-scroll">
          <template
            v-for="item in visibleToolbarItems"
            :key="item.id">
            <el-popover
              v-if="item.type === 'folder'"
              :visible="activeTopFolderId === item.id"
              @update:visible="(visible) => handleTopFolderVisibleChange(item.id, visible)"
              placement="bottom-start"
              :width="260"
              trigger="click"
              :hide-after="60"
              :show-after="0"
              :offset="8"
              transition="bookmark-popover-transition"
              :fallback-placements="['bottom-start', 'bottom-end']"
              popper-class="bookmark-popper">
              <template #reference>
                <button
                  class="bar-item folder-item"
                  :class="{
                    'is-active': activeTopFolderId === item.id,
                    'other-bookmarks-item': item.name === '其他书签',
                  }"
                  :title="item.name">
                  <el-icon class="item-icon"><Folder /></el-icon>
                  <span class="item-text">{{ item.name }}</span>
                </button>
              </template>
              <BookmarkMenu :items="item.children" />
            </el-popover>
            <a
              v-else
              class="bar-item link-item"
              :href="item.url"
              :title="item.name">
              <img
                v-if="item.icon"
                :src="item.icon"
                class="favicon"
                alt="" />
              <el-icon
                v-else
                class="item-icon">
                <ChromeFilled />
              </el-icon>
              <span class="item-text">{{ item.name }}</span>
            </a>
          </template>
          <div
            v-if="!toolbarItems.length"
              class="bar-empty">
            暂无书签，先配置 WebDAV 后点击刷新
          </div>
          <el-popover
            v-if="overflowToolbarItems.length"
            placement="bottom-end"
            :width="260"
            trigger="click"
            :hide-after="60"
            :show-after="0"
            :offset="8"
            transition="bookmark-popover-transition"
            popper-class="bookmark-popper">
            <template #reference>
              <button
                class="bar-item overflow-bookmarks-button"
                title="更多书签">
                <el-icon class="item-icon"><DArrowRight /></el-icon>
              </button>
            </template>
            <BookmarkMenu :items="overflowToolbarItems" />
          </el-popover>
        </div>
      </div>
      <div class="bar-right">
        <el-popover
          placement="bottom-end"
          trigger="click"
          :hide-after="60"
          :show-after="0"
          :offset="8"
          transition="bookmark-popover-transition"
          popper-class="bookmark-popper action-popper">
          <template #reference>
            <button
              class="more-button"
              title="更多操作">
              <el-icon><ArrowDown /></el-icon>
            </button>
          </template>
          <div class="action-menu">
            <button
              class="action-menu-item"
              type="button"
              @click="clearCache">
              清空缓存
            </button>
            <button
              class="action-menu-item"
              type="button"
              @click="refreshBookmarks()">
              {{ loading ? '刷新中...' : '刷新书签' }}
            </button>
            <button
              class="action-menu-item"
              type="button"
              @click="debugVisible = true">
              解析树调试
            </button>
            <button
              class="action-menu-item"
              type="button"
              @click="configVisible = true">
              WebDAV 配置
            </button>
          </div>
        </el-popover>
      </div>
    </header>

    <main
      class="main-stage"
      @click="handleMainStageClick">
      <div class="tab-stage">
        <div class="search-stage">
          <el-popover
            :visible="showBookmarkSuggest"
            trigger="manual"
            placement="bottom-start"
            :width="searchPopoverWidth"
            :offset="12"
            :show-arrow="false"
            popper-class="bookmark-result-popper">
            <template #reference>
              <div
                ref="searchStackRef"
                class="search-stack">
                <div
                  class="search-container"
                  :class="[searchContainerAnimationClass, { hidden: !isSearchContainerRendered }]"
                  :style="{ visibility: searchUiReady ? 'visible' : 'hidden' }"
                  @mousedown="handleSearchContainerMouseDown">
              <div
                v-if="!settingsMode"
                class="engine-container">
                <div
                  class="engine-list"
                  :class="{ expanded: engineExpanded }"
                  @mouseenter="scheduleEngineExpand"
                  @mouseleave="collapseEngineList">
                  <div
                    v-for="engine in visibleEngines"
                    :key="engine.name"
                    class="engine-item"
                    :name="engine.name"
                    :title="engine.title"
                    @click="selectEngine(engine.name)"
                    v-html="engine.icon">
                  </div>
                </div>
              </div>

              <div
                class="input-container"
                :style="{ marginLeft: settingsMode ? '60px' : '12px' }">
                <input
                  v-if="!settingsMode"
                  ref="searchInputRef"
                  v-model="query"
                  class="search-input"
                  type="text"
                  autocomplete="off"
                  placeholder="more ..."
                  @keydown.enter.prevent="performSearch" />
                <input
                  v-else
                  ref="settingsInputRef"
                  v-model="settingsImagePath"
                  class="settings-input"
                  type="text"
                  autocomplete="off"
                  :placeholder="settingsPlaceholder"
                  @keydown.enter.prevent="confirmSettings" />
              </div>

              <div
                v-if="!settingsMode"
                class="shortcut-container">
                <div class="shortcut-list">
                  <div
                    class="shortcut-item"
                    title="github"
                    @click="openShortcut('https://www.github.com/')">
                    <svg
                      fill="#045237FF"
                      viewBox="-2 -2 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      preserveAspectRatio="xMinYMin">
                      <path
                        d="M8.18 15.008c.12 0 .211-.004.271-.012a.317.317 0 0 0 .18-.107c.06-.063.09-.154.09-.274l-.004-.557c-.003-.355-.004-.637-.004-.844l-.188.033a2.41 2.41 0 0 1-.455.028 3.498 3.498 0 0 1-.57-.057 1.276 1.276 0 0 1-.548-.246 1.04 1.04 0 0 1-.36-.503l-.082-.189a2.046 2.046 0 0 0-.258-.417.989.989 0 0 0-.357-.312l-.057-.04a.602.602 0 0 1-.106-.1.455.455 0 0 1-.074-.114c-.016-.038-.003-.07.04-.094a.533.533 0 0 1 .238-.037l.164.025c.11.021.245.087.406.196.16.11.293.251.397.426.126.224.277.395.455.512a.964.964 0 0 0 .536.176c.18 0 .336-.013.467-.04a1.63 1.63 0 0 0 .369-.124c.049-.365.182-.647.4-.843a5.61 5.61 0 0 1-.839-.148 3.346 3.346 0 0 1-.77-.32 2.204 2.204 0 0 1-.66-.548c-.174-.219-.317-.505-.43-.86a4.09 4.09 0 0 1-.167-1.229c0-.66.216-1.223.647-1.687-.202-.497-.183-1.054.057-1.671.159-.05.394-.013.705.11.311.123.54.228.684.316.145.087.26.16.348.22a5.814 5.814 0 0 1 1.573-.212c.54 0 1.065.07 1.573.213l.31-.197c.214-.13.465-.251.754-.36.29-.11.511-.14.664-.09.246.617.268 1.174.065 1.67.432.465.648 1.027.648 1.688 0 .464-.056.875-.168 1.233-.112.358-.257.644-.434.86a2.29 2.29 0 0 1-.664.545 3.342 3.342 0 0 1-.77.32 5.605 5.605 0 0 1-.84.147c.284.245.426.633.426 1.163v1.957c0 .093.014.168.041.226a.226.226 0 0 0 .131.119c.06.021.114.035.16.04.047.006.113.009.2.009h-1.966-2.227z" />
                      <path
                        d="M4 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4zm0-2h12a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div class="button-container">
                <div
                  class="button-list"
                  :class="{ expanded: buttonExpanded || settingsMode }"
                  @mouseleave="collapseButtonList">
                  <div
                    v-if="settingsMode"
                    class="button-item confirm-button"
                    title="confirm"
                    @click="confirmSettings">
                    <svg
                      viewBox="0 0 1024 1024"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="#000000">
                      <path
                        d="M511.64164 924.327835c-228.816869 0-414.989937-186.16283-414.989937-414.989937S282.825796 94.347961 511.64164 94.347961c102.396724 0 200.763434 37.621642 276.975315 105.931176 9.47913 8.499272 10.266498 23.077351 1.755963 32.556481-8.488009 9.501656-23.054826 10.266498-32.556481 1.778489-67.723871-60.721519-155.148319-94.156494-246.174797-94.156494-203.396868 0-368.880285 165.482394-368.880285 368.880285S308.243749 878.218184 511.64164 878.218184c199.164126 0 361.089542-155.779033 368.60998-354.639065 0.49556-12.720751 11.032364-22.863359 23.910794-22.177356 12.720751 0.484298 22.649367 11.190043 22.15483 23.910794-8.465484 223.74966-190.609564 399.015278-414.675604 399.015278z"
                        fill="#22C67F" />
                      <path
                        d="M960.926616 327.538868l-65.210232-65.209209-350.956149 350.956149-244.56832-244.566273-65.210233 65.209209 309.745789 309.743741 0.032764-0.031741 0.03174 0.031741z"
                        fill="#74E8AE" />
                    </svg>
                  </div>
                  <div
                    v-if="settingsMode"
                    class="button-item cancel-button"
                    title="cancel"
                    @click="settingsModeExit">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M14.5 9.50002L9.5 14.5M9.49998 9.5L14.5 14.5"
                        stroke="#be3c3c"
                        stroke-width="1.5"
                        stroke-linecap="round" />
                      <path
                        d="M7 3.33782C8.47087 2.48697 10.1786 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 10.1786 2.48697 8.47087 3.33782 7"
                        stroke="#be3c3c"
                        stroke-width="1.5"
                        stroke-linecap="round" />
                    </svg>
                  </div>
                  <div
                    v-if="settingsMode"
                    class="button-item reset-button"
                    title="reset"
                    @click="resetBackgroundSettings">
                    <svg
                      viewBox="2 2 21 21"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style="width: 25px; height: 25px">
                      <path
                        d="M5.88468 17C7.32466 19.1128 9.75033 20.5 12.5 20.5C16.9183 20.5 20.5 16.9183 20.5 12.5C20.5 8.08172 16.9183 4.5 12.5 4.5C8.08172 4.5 4.5 8.08172 4.5 12.5V13.5M12.5 8V12.5L15.5 15.5"
                        stroke="#F59E0B"
                        stroke-width="1.2"
                        stroke-linecap="round"
                        stroke-linejoin="round" />
                    </svg>
                  </div>
                  <div
                    class="button-item search-button"
                    title="search"
                    @mouseenter="scheduleButtonExpand"
                    @click="performSearch">
                    <svg
                      viewBox="0 0 1024 1024"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="#06a0a2"
                      stroke="#06a0a2"
                      stroke-width="15.36">
                      <path
                        fill="#06a0a2"
                        d="m795.904 750.72 124.992 124.928a32 32 0 0 1-45.248 45.248L750.656 795.904a416 416 0 1 1 45.248-45.248zM480 832a352 352 0 1 0 0-704 352 352 0 0 0 0 704z" />
                    </svg>
                  </div>
                </div>
              </div>
                </div>
              </div>
            </template>
            <el-scrollbar
              class="bookmark-suggest-panel"
              max-height="30vh">
              <a
                v-for="item in filteredLinks"
                :key="item.id"
                class="result-item"
                :href="item.url"
                :title="item.name">
                <img
                  v-if="item.icon"
                  :src="item.icon"
                  class="favicon"
                  alt="" />
                <el-icon
                  v-else
                  class="item-icon">
                  <ChromeFilled />
                </el-icon>
                <div class="result-copy">
                  <div class="result-name">{{ item.name }}</div>
                  <div class="result-path">{{ item.path.join(' / ') || item.url }}</div>
                </div>
              </a>
              <div
                v-if="filteredLinks.length === 0"
                class="empty-state">
                没有匹配结果
              </div>
            </el-scrollbar>
          </el-popover>
        </div>
      </div>
    </main>

    <el-drawer
      v-model="configVisible"
      title="WebDAV 配置"
      direction="rtl"
      size="360px">
      <el-scrollbar max-height="calc(100vh - 120px)">
        <el-form
          label-position="top"
          :model="config">
        <el-form-item label="地址">
          <el-input v-model="config.url" />
        </el-form-item>
        <el-form-item label="账号">
          <el-input v-model="config.username" />
        </el-form-item>
        <el-form-item label="应用密码">
          <el-input
            v-model="config.password"
            type="password"
            show-password />
        </el-form-item>
        <el-form-item label="书签文件">
          <el-input v-model="config.remoteFile" />
        </el-form-item>
        <div class="drawer-actions">
          <el-button @click="configVisible = false">关闭</el-button>
          <el-button
            :loading="testing"
            @click="testConnection">
            测试连接
          </el-button>
          <el-button
            type="primary"
            @click="saveConfig">
            保存
          </el-button>
        </div>
        </el-form>
      </el-scrollbar>
    </el-drawer>

    <el-drawer
      v-model="debugVisible"
      title="解析树调试"
      direction="rtl"
      size="520px">
      <el-scrollbar max-height="calc(100vh - 120px)">
        <pre class="debug-tree">{{ debugTreeText }}</pre>
      </el-scrollbar>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { ArrowDown, ChromeFilled, DArrowRight, Folder } from '@element-plus/icons-vue'
import BookmarkMenu from '@/components/BookmarkMenu.vue'
import {
  buildTopBarItems,
  flattenLinks,
  parseBookmarks,
} from '@/utils/bookmark'

const STORAGE_CONFIG_KEY = 'new-tab-bookmarker-webdav-config'
const STORAGE_CACHE_KEY = 'new-tab-bookmarker-bookmark-cache'
const SEARCH_PAGE_STORAGE_KEY = 'new-tab-bookmarker-search-page'
const BACKGROUND_IMAGE_FILE_NAME_KEY = 'new-tab-bookmarker-background-image-file-name'
const BACKGROUND_IMAGE_FILE_LABEL_KEY = 'new-tab-bookmarker-background-image-file-label'
const BACKGROUND_HANDLE_DB_NAME = 'new-tab-bookmarker-db'
const BACKGROUND_HANDLE_STORE_NAME = 'fs-handles'
const BACKGROUND_HANDLE_KEY = 'background-file-handle'

const DEFAULT_SEARCH_PAGE_CONFIG = {
  currentEngine: 'bing',
  settingsMode: 'no',
  isSearchContainerVisible: 'yes',
}

const SEARCH_ENGINES = [
  {
    name: 'bing',
    title: 'bing',
    value: 'https://cn.bing.com/search?q={query}',
    icon: `
      <svg xmlns="http://www.w3.org/2000/svg" aria-label="Bing" role="img" viewBox="0 0 512 512">
        <path d="M145,73l73,26V356l103-59-50-24-32-79,162,57v83L218,439l-73-41Z" fill="#008373"></path>
      </svg>
    `,
  },
  {
    name: 'baidu',
    title: 'baidu',
    value: 'https://www.baidu.com/s?wd={query}',
    icon: `
      <svg xmlns="http://www.w3.org/2000/svg" aria-label="Baidu" role="img" viewBox="0 0 512 512">
        <path d="m131 251c41-9 35-58 34-68-2-17-21-45-48-43-33 3-37 50-37 50-5 22 10 70 51 61m76-82c22 0 40-26 40-58s-18-58-40-58c-23 0-41 26-41 58s18 58 41 58m96 4c31 4 50-28 54-53 4-24-16-52-37-57s-48 29-50 52c-3 27 3 54 33 58m120 41c0-12-10-47-46-47s-41 33-41 57c0 22 2 53 47 52s40-51 40-62m-46 102s-46-36-74-75c-36-57-89-34-106-5-18 29-45 48-49 53-4 4-56 33-44 84 11 52 52 51 52 51s30 3 65-5 65 2 65 2 81 27 104-25c22-53-13-80-13-80" fill="#2319dc"></path>
        <path d="m214 266v34h-28s-29 3-39 35c-3 21 4 34 5 36 1 3 10 19 33 23h53v-128zm-1 107h-21s-15-1-19-18c-3-7 0-16 1-20 1-3 6-11 17-14h22zm38-70v68s1 17 24 23h61v-91h-26v68h-25s-8-1-10-7v-61z" fill="#ffffff"></path>
      </svg>
    `,
  },
  {
    name: 'google',
    title: 'google',
    value: 'https://www.google.com/search?q={query}',
    icon: `
      <svg viewBox="-1.6 -1.6 19.20 19.20" xmlns="http://www.w3.org/2000/svg" fill="none">
        <path fill="#4285F4" d="M14.9 8.161c0-.476-.039-.954-.121-1.422h-6.64v2.695h3.802a3.24 3.24 0 01-1.407 2.127v1.75h2.269c1.332-1.22 2.097-3.02 2.097-5.15z"></path>
        <path fill="#34A853" d="M8.14 15c1.898 0 3.499-.62 4.665-1.69l-2.268-1.749c-.631.427-1.446.669-2.395.669-1.836 0-3.393-1.232-3.952-2.888H1.85v1.803A7.044 7.044 0 008.14 15z"></path>
        <path fill="#FBBC04" d="M4.187 9.342a4.17 4.17 0 010-2.68V4.859H1.849a6.97 6.97 0 000 6.286l2.338-1.803z"></path>
        <path fill="#EA4335" d="M8.14 3.77a3.837 3.837 0 012.7 1.05l2.01-1.999a6.786 6.786 0 00-4.71-1.82 7.042 7.042 0 00-6.29 3.858L4.186 6.66c.556-1.658 2.116-2.89 3.952-2.89z"></path>
      </svg>
    `,
  },
]

const SETTINGS_ENGINE = {
  name: 'settings',
  title: 'settings',
  icon: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13.6006 21.0761L19.0608 17.9236C19.6437 17.5871 19.9346 17.4188 20.1465 17.1834C20.3341 16.9751 20.4759 16.7297 20.5625 16.4632C20.6602 16.1626 20.6602 15.8267 20.6602 15.1568V8.84268C20.6602 8.17277 20.6602 7.83694 20.5625 7.53638C20.4759 7.26982 20.3341 7.02428 20.1465 6.816C19.9355 6.58161 19.6453 6.41405 19.0674 6.08043L13.5996 2.92359C13.0167 2.58706 12.7259 2.41913 12.416 2.35328C12.1419 2.295 11.8584 2.295 11.5843 2.35328C11.2744 2.41914 10.9826 2.58706 10.3997 2.92359L4.93843 6.07666C4.35623 6.41279 4.06535 6.58073 3.85352 6.816C3.66597 7.02428 3.52434 7.26982 3.43773 7.53638C3.33984 7.83765 3.33984 8.17436 3.33984 8.84742V15.1524C3.33984 15.8254 3.33984 16.1619 3.43773 16.4632C3.52434 16.7297 3.66597 16.9751 3.85352 17.1834C4.06548 17.4188 4.35657 17.5871 4.93945 17.9236L10.3997 21.0761C10.9826 21.4126 11.2744 21.5806 11.5843 21.6465C11.8584 21.7047 12.1419 21.7047 12.416 21.6465C12.7259 21.5806 13.0177 21.4126 13.6006 21.0761Z"
        stroke="#06a0a2"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round" />
      <path
        d="M9 11.9998C9 13.6566 10.3431 14.9998 12 14.9998C13.6569 14.9998 15 13.6566 15 11.9998C15 10.3429 13.6569 8.99976 12 8.99976C10.3431 8.99976 9 10.3429 9 11.9998Z"
        stroke="#06a0a2"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round" />
    </svg>
  `,
}

const configVisible = ref(false)
const loading = ref(false)
const testing = ref(false)
const query = ref('')
const settingsImagePath = ref('')
const toolbarItems = ref([])
const allLinks = ref([])
const bookmarkTree = ref(null)
const visibleToolbarItems = ref([])
const overflowToolbarItems = ref([])
const currentEngine = ref(DEFAULT_SEARCH_PAGE_CONFIG.currentEngine)
const settingsMode = ref(false)
const searchUiReady = ref(false)
const isSearchContainerRendered = ref(true)
const searchContainerAnimationClass = ref('')
const engineExpanded = ref(false)
const buttonExpanded = ref(false)
const searchInputRef = ref(null)
const settingsInputRef = ref(null)
const backgroundDirectoryHandle = ref(null)
const activeTopFolderId = ref(null)
const searchStackRef = ref(null)
const searchPopoverWidth = ref(560)
const debugVisible = ref(false)

let engineExpandTimer = null
let buttonExpandTimer = null
let hideSearchContainerTimer = null
let currentBackgroundObjectUrl = null

const config = ref({
  url: 'https://dav.jianguoyun.com/dav/',
  username: '',
  password: '',
  remoteFile: '',
})

function hasCompleteConfig() {
  return Boolean(
    config.value.url
    && config.value.username
    && config.value.password
    && config.value.remoteFile,
  )
}

function showMessage(message, type = 'success') {
  ElMessage.closeAll()
  ElMessage({
    message,
    type,
    appendTo: document.body,
    offset: 20,
    zIndex: 4000,
    grouping: true,
    plain: false,
  })
}

function openBackgroundHandleDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(BACKGROUND_HANDLE_DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(BACKGROUND_HANDLE_STORE_NAME)) {
        db.createObjectStore(BACKGROUND_HANDLE_STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function saveBackgroundDirectoryHandle(handle) {
  const db = await openBackgroundHandleDb()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(BACKGROUND_HANDLE_STORE_NAME, 'readwrite')
    tx.objectStore(BACKGROUND_HANDLE_STORE_NAME).put(handle, BACKGROUND_HANDLE_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

async function loadBackgroundDirectoryHandle() {
  const db = await openBackgroundHandleDb()
  const handle = await new Promise((resolve, reject) => {
    const tx = db.transaction(BACKGROUND_HANDLE_STORE_NAME, 'readonly')
    const request = tx.objectStore(BACKGROUND_HANDLE_STORE_NAME).get(BACKGROUND_HANDLE_KEY)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
  db.close()
  return handle
}

async function clearBackgroundDirectoryHandle() {
  const db = await openBackgroundHandleDb()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(BACKGROUND_HANDLE_STORE_NAME, 'readwrite')
    tx.objectStore(BACKGROUND_HANDLE_STORE_NAME).delete(BACKGROUND_HANDLE_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

function getSearchPageState() {
  try {
    return {
      ...DEFAULT_SEARCH_PAGE_CONFIG,
      ...(JSON.parse(localStorage.getItem(SEARCH_PAGE_STORAGE_KEY) || '{}')),
    }
  } catch {
    return { ...DEFAULT_SEARCH_PAGE_CONFIG }
  }
}

function setSearchPageState(patch) {
  const nextState = {
    ...getSearchPageState(),
    ...patch,
  }
  localStorage.setItem(SEARCH_PAGE_STORAGE_KEY, JSON.stringify(nextState))
}

function dbGet(key) {
  if ([BACKGROUND_IMAGE_FILE_NAME_KEY, BACKGROUND_IMAGE_FILE_LABEL_KEY].includes(key)) {
    try {
      return JSON.parse(localStorage.getItem(key))
    } catch {
      return null
    }
  }
  return getSearchPageState()[key]
}

function dbSet(key, value) {
  if ([BACKGROUND_IMAGE_FILE_NAME_KEY, BACKGROUND_IMAGE_FILE_LABEL_KEY].includes(key)) {
    localStorage.setItem(key, JSON.stringify(value))
    return
  }
  setSearchPageState({ [key]: value })
}

function updateView(tree) {
  bookmarkTree.value = tree
  toolbarItems.value = buildTopBarItems(tree)
  allLinks.value = flattenLinks(tree)
  recalcToolbarItems()
}

function handleTopFolderVisibleChange(id, visible) {
  activeTopFolderId.value = visible ? id : activeTopFolderId.value === id ? null : activeTopFolderId.value
}

const filteredLinks = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword || settingsMode.value) return []
  return allLinks.value
    .filter((item) =>
      `${item.name} ${item.url} ${item.path.join(' ')}`.toLowerCase().includes(keyword),
    )
    .slice(0, 24)
})

const showBookmarkSuggest = computed(() => !settingsMode.value && query.value.trim() !== '')

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

const debugTreeText = computed(() => {
  if (!bookmarkTree.value) {
    return '暂无解析结果，请先刷新书签。'
  }
  const tree = bookmarkTree.value
  const lines = []
  for (const child of tree.children || []) {
    lines.push(formatDebugTree(child, 0))
  }
  return lines.join('\n').trim()
})

const orderedEngines = computed(() => {
  const selected = SEARCH_ENGINES.find((item) => item.name === currentEngine.value) || SEARCH_ENGINES[0]
  const rest = SEARCH_ENGINES.filter((item) => item.name !== selected.name)
  return [selected, ...rest]
})

const visibleEngines = computed(() => {
  const engines = [...orderedEngines.value, SETTINGS_ENGINE]
  return engineExpanded.value ? engines : engines.slice(0, 1)
})

const settingsPlaceholder = computed(() => dbGet(BACKGROUND_IMAGE_FILE_LABEL_KEY)
  || '点击右侧确认按钮，直接选择一张背景图片')

function focusActiveInput() {
  nextTick(() => {
    const input = settingsMode.value ? settingsInputRef.value : searchInputRef.value
    input?.focus()
    setTimeout(() => {
      input?.focus()
    }, 100)
  })
}

function updateSearchPopoverWidth() {
  const width = searchStackRef.value?.getBoundingClientRect?.().width
  if (width) {
    searchPopoverWidth.value = Math.round(width)
  }
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

function scheduleEngineExpand() {
  clearTimeout(engineExpandTimer)
  engineExpandTimer = setTimeout(() => {
    if (!settingsMode.value) {
      engineExpanded.value = true
    }
  }, 300)
}

function collapseEngineList() {
  clearTimeout(engineExpandTimer)
  engineExpanded.value = false
}

function scheduleButtonExpand() {
  clearTimeout(buttonExpandTimer)
  buttonExpandTimer = setTimeout(() => {
    if (!settingsMode.value) {
      buttonExpanded.value = true
    }
  }, 300)
}

function collapseButtonList() {
  clearTimeout(buttonExpandTimer)
  if (!settingsMode.value) {
    buttonExpanded.value = false
  }
}

function selectEngine(name) {
  if (name === SETTINGS_ENGINE.name) {
    settingsModeEnter()
    collapseEngineList()
    return
  }
  currentEngine.value = name
  dbSet('currentEngine', name)
  collapseEngineList()
}

function getCurrentEngine() {
  return SEARCH_ENGINES.find((item) => item.name === currentEngine.value) || SEARCH_ENGINES[0]
}

function performSearch() {
  const keyword = query.value.trim()
  if (!keyword || settingsMode.value) return
  const engine = getCurrentEngine()
  const searchUrl = engine.value.replace('{query}', encodeURIComponent(keyword))
  window.open(searchUrl, '_self')
}

function openShortcut(url) {
  window.open(url, '_self')
}

async function getBackgroundImageFile() {
  try {
    if (typeof window.showOpenFilePicker !== 'function') {
      showMessage('当前环境不支持图片选择器', 'warning')
      return undefined
    }
    const [fileHandle] = await window.showOpenFilePicker({
      multiple: false,
      types: [
        {
          description: '图片文件',
          accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'],
          },
        },
      ],
    })
    const file = await fileHandle.getFile()
    return {
      fileHandle,
      file,
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      showMessage('无法访问目录，请检查浏览器权限设置', 'error')
    }
    return undefined
  }
}

function applyBackgroundImage(path) {
  if (currentBackgroundObjectUrl) {
    URL.revokeObjectURL(currentBackgroundObjectUrl)
    currentBackgroundObjectUrl = null
  }
  if (!path) {
    document.body.style.removeProperty('background-image')
    return
  }
  currentBackgroundObjectUrl = path
  document.body.style.backgroundImage = `url("${path}")`
}

async function randomBackgroundImageSet() {
  if (!backgroundDirectoryHandle.value) {
    applyBackgroundImage('')
    return
  }
  try {
    if (typeof backgroundDirectoryHandle.value.queryPermission === 'function') {
      const permission = await backgroundDirectoryHandle.value.queryPermission({ mode: 'read' })
      if (permission !== 'granted') {
        applyBackgroundImage('')
        return
      }
    }
    const file = await backgroundDirectoryHandle.value.getFile()
    const objectUrl = URL.createObjectURL(file)
    applyBackgroundImage(objectUrl)
  } catch (error) {
    applyBackgroundImage('')
    showMessage('背景图读取失败，请重新设置目录', 'warning')
  }
}

function settingsModeEnter() {
  settingsMode.value = true
  buttonExpanded.value = true
  dbSet('settingsMode', 'yes')
  focusActiveInput()
}

function settingsModeExit() {
  settingsMode.value = false
  buttonExpanded.value = false
  dbSet('settingsMode', 'no')
  focusActiveInput()
}

async function confirmSettings() {
  const result = await getBackgroundImageFile()
  if (!result?.fileHandle || !result?.file) {
    showMessage('未选择背景图片', 'warning')
    return
  }
  backgroundDirectoryHandle.value = result.fileHandle
  await saveBackgroundDirectoryHandle(result.fileHandle)
  dbSet(BACKGROUND_IMAGE_FILE_NAME_KEY, result.file.name)
  dbSet(BACKGROUND_IMAGE_FILE_LABEL_KEY, result.file.name)
  settingsImagePath.value = result.file.name
  await randomBackgroundImageSet()
  settingsModeExit()
}

async function resetBackgroundSettings() {
  backgroundDirectoryHandle.value = null
  await clearBackgroundDirectoryHandle()
  dbSet(BACKGROUND_IMAGE_FILE_NAME_KEY, '')
  dbSet(BACKGROUND_IMAGE_FILE_LABEL_KEY, '')
  settingsImagePath.value = ''
  await randomBackgroundImageSet()
  settingsModeExit()
}

function showSearchContainer() {
  clearTimeout(hideSearchContainerTimer)
  dbSet('isSearchContainerVisible', 'yes')
  query.value = ''
  isSearchContainerRendered.value = true
  searchContainerAnimationClass.value = 'fade-in-down'
  focusActiveInput()
}

function hideSearchContainer() {
  clearTimeout(hideSearchContainerTimer)
  dbSet('isSearchContainerVisible', 'no')
  searchContainerAnimationClass.value = 'fade-out-up'
  hideSearchContainerTimer = setTimeout(() => {
    isSearchContainerRendered.value = false
    searchContainerAnimationClass.value = ''
  }, 500)
}

function handleSearchContainerMouseDown(event) {
  if (event.button === 1 && query.value.trim() === '' && !settingsMode.value) {
    hideSearchContainer()
  }
}

function handleMainStageClick(event) {
  if (event.target === event.currentTarget && dbGet('isSearchContainerVisible') === 'no') {
    showSearchContainer()
  }
}

function handleGlobalKeydown(event) {
  if (configVisible.value) return

  const printable = event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey
  if (dbGet('isSearchContainerVisible') === 'no') {
    if (event.key === 'Escape') {
      return
    }
    showSearchContainer()
    if (printable) {
      event.preventDefault()
      if (settingsMode.value) {
        settingsImagePath.value = event.key
      } else {
        query.value = event.key
      }
    }
  }

  const currentValue = settingsMode.value ? settingsImagePath.value : query.value
  if (event.key === 'Escape' && currentValue.trim() === '') {
    hideSearchContainer()
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    if (settingsMode.value) {
      confirmSettings()
    } else {
      performSearch()
    }
  }

  focusActiveInput()
}

async function saveConfig() {
  await chrome.storage.local.set({
    [STORAGE_CONFIG_KEY]: config.value,
  })
  configVisible.value = false
  if (hasCompleteConfig()) {
    await refreshBookmarks('配置已保存，书签已刷新')
    return
  }
  showMessage('配置已保存')
}

async function clearCache() {
  await chrome.storage.local.set({
    [STORAGE_CACHE_KEY]: null,
  })
  bookmarkTree.value = null
  toolbarItems.value = []
  visibleToolbarItems.value = []
  overflowToolbarItems.value = []
  allLinks.value = []
  activeTopFolderId.value = null
  showMessage('缓存已清空')
}

async function testConnection() {
  if (!hasCompleteConfig()) {
    showMessage('请先填写完整的 WebDAV 配置', 'error')
    return
  }

  testing.value = true
  try {
    const url = `${config.value.url.replace(/\/+$/, '')}/${config.value.remoteFile.replace(/^\/+/, '')}`
    const auth = btoa(`${config.value.username}:${config.value.password}`)
    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
      responseType: 'text',
    })

    if (typeof response.data !== 'string' || !response.data.includes('NETSCAPE-Bookmark-file-1')) {
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
  if (!hasCompleteConfig()) {
    showMessage('请先填写完整的 WebDAV 配置', 'error')
    return
  }

  loading.value = true
  try {
    const url = `${config.value.url.replace(/\/+$/, '')}/${config.value.remoteFile.replace(/^\/+/, '')}`
    const auth = btoa(`${config.value.username}:${config.value.password}`)
    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
      responseType: 'text',
    })

    const tree = parseBookmarks(response.data)
    updateView(tree)
    await chrome.storage.local.set({
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

async function initData() {
  const result = await chrome.storage.local.get([STORAGE_CONFIG_KEY, STORAGE_CACHE_KEY])
  if (result[STORAGE_CONFIG_KEY]) {
    config.value = {
      ...config.value,
      ...result[STORAGE_CONFIG_KEY],
    }
  }

  const cached = result[STORAGE_CACHE_KEY]
  if (cached?.tree) {
    updateView(cached.tree)
  }

  currentEngine.value = dbGet('currentEngine') || DEFAULT_SEARCH_PAGE_CONFIG.currentEngine
  settingsMode.value = dbGet('settingsMode') === 'yes'
  isSearchContainerRendered.value = dbGet('isSearchContainerVisible') !== 'no'
  searchUiReady.value = true
  settingsImagePath.value = dbGet(BACKGROUND_IMAGE_FILE_LABEL_KEY) || ''
  backgroundDirectoryHandle.value = await loadBackgroundDirectoryHandle()
  await randomBackgroundImageSet()
  recalcToolbarItems()
}

onMounted(async () => {
  await initData()
  document.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('resize', updateSearchPopoverWidth)
  window.addEventListener('resize', recalcToolbarItems)
  updateSearchPopoverWidth()
  focusActiveInput()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('resize', updateSearchPopoverWidth)
  window.removeEventListener('resize', recalcToolbarItems)
  clearTimeout(engineExpandTimer)
  clearTimeout(buttonExpandTimer)
  clearTimeout(hideSearchContainerTimer)
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
  background: rgba(218, 235, 238, 0.88);
  border-color: var(--line-color);
}

.bar-item.is-active {
  background: rgba(210, 231, 235, 0.98);
  border-color: rgba(126, 165, 177, 0.28);
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
  color: #7ea5b1;
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
  background: rgba(255, 255, 255, 0.78);
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
