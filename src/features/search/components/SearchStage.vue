<template>
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
            <div class="engine-container">
              <div
                class="engine-list"
                :class="{ expanded: engineExpanded }"
                @mouseenter="scheduleEngineExpand"
                @mouseleave="collapseEngineList">
                <div
                  v-for="engine in visibleEngines"
                  :key="engine.name"
                  class="engine-item"
                  :title="engine.title"
                  @click="selectEngine(engine.name)"
                  v-html="engine.icon" />
              </div>
            </div>

            <div class="input-container">
              <input
                ref="searchInputRef"
                v-model="query"
                class="search-input"
                type="text"
                autocomplete="off"
                placeholder="搜索书签或输入关键词"
                @keydown.enter.stop.prevent="performSearch" />
            </div>

            <div class="shortcut-container">
              <div class="shortcut-list">
                <div
                  class="shortcut-item"
                  title="GitHub"
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
              <div class="button-list">
                <div
                  class="button-item search-button"
                  title="搜索"
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
        max-height="42vh">
        <a
          v-for="item in filteredLinks"
          :key="item.id"
          class="result-item"
          :href="item.url"
          :title="item.name"
          @click.prevent="emit('bookmark-link-click', item.url)"
          @contextmenu.prevent="emit('bookmark-contextmenu', { event: $event, item })">
          <img
            v-if="getBookmarkFaviconUrl(item)"
            :src="getBookmarkFaviconUrl(item)"
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
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ChromeFilled } from '@element-plus/icons-vue'
import { getBookmarkFaviconUrl } from '@/features/bookmarks/services/bookmarkFaviconService'
import { SEARCH_ENGINES } from '../constants'
import { patchSearchPageState, loadSearchPageState } from '../services/searchPageStateService'
import { useSearchUiStore } from '../stores/searchUiStore'

const props = defineProps({
  allLinks: {
    type: Array,
    default: () => [],
  },
  suspendHotkeys: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['bookmark-link-click', 'bookmark-contextmenu'])

const searchUiStore = useSearchUiStore()
const {
  query,
  currentEngine,
  searchUiReady,
  isSearchContainerRendered,
  searchContainerAnimationClass,
  engineExpanded,
  searchPopoverWidth,
  visibleEngines,
} = storeToRefs(searchUiStore)

const searchInputRef = ref(null)
const searchStackRef = ref(null)
const isNavigating = ref(false)

let engineExpandTimer = null
let hideSearchContainerTimer = null

const filteredLinks = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return []
  return props.allLinks
    .filter((item) =>
      `${item.name} ${item.url} ${item.path.join(' ')}`.toLowerCase().includes(keyword),
    )
    .slice(0, 24)
})

const showBookmarkSuggest = computed(() => query.value.trim() !== '')

function focusInput() {
  nextTick(() => {
    searchInputRef.value?.focus()
    setTimeout(() => searchInputRef.value?.focus(), 100)
  })
}

function updateSearchPopoverWidth() {
  const width = searchStackRef.value?.getBoundingClientRect?.().width
  if (width) {
    searchPopoverWidth.value = Math.round(width)
  }
}

function scheduleEngineExpand() {
  clearTimeout(engineExpandTimer)
  engineExpandTimer = setTimeout(() => {
    engineExpanded.value = true
  }, 300)
}

function collapseEngineList() {
  clearTimeout(engineExpandTimer)
  engineExpanded.value = false
}

function selectEngine(name) {
  currentEngine.value = name
  patchSearchPageState({ currentEngine: name })
  collapseEngineList()
}

function getCurrentEngine() {
  return SEARCH_ENGINES.find((item) => item.name === currentEngine.value) || SEARCH_ENGINES[0]
}

function performSearch() {
  const keyword = query.value.trim()
  if (!keyword || isNavigating.value) return
  isNavigating.value = true
  const engine = getCurrentEngine()
  const searchUrl = engine.value.replace('{query}', encodeURIComponent(keyword))
  window.location.assign(searchUrl)
}

function openShortcut(url) {
  window.open(url, '_self')
}

function showSearchContainer() {
  clearTimeout(hideSearchContainerTimer)
  patchSearchPageState({ isSearchContainerVisible: 'yes' })
  query.value = ''
  isSearchContainerRendered.value = true
  searchContainerAnimationClass.value = 'fade-in-down'
  focusInput()
}

function hideSearchContainer() {
  clearTimeout(hideSearchContainerTimer)
  patchSearchPageState({ isSearchContainerVisible: 'no' })
  searchContainerAnimationClass.value = 'fade-out-up'
  hideSearchContainerTimer = setTimeout(() => {
    isSearchContainerRendered.value = false
    searchContainerAnimationClass.value = ''
  }, 500)
}

function handleSearchContainerMouseDown(event) {
  if (event.button === 1 && query.value.trim() === '') {
    hideSearchContainer()
  }
}

function handleGlobalKeydown(event) {
  if (props.suspendHotkeys) {
    return
  }

  const printable = event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey
  const state = loadSearchPageState()

  if (state.isSearchContainerVisible === 'no') {
    if (event.key === 'Escape') {
      return
    }
    showSearchContainer()
    if (printable) {
      event.preventDefault()
      query.value = event.key
    }
  }

  if (event.key === 'Escape' && query.value.trim() === '') {
    hideSearchContainer()
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    performSearch()
  }

  focusInput()
}

function handleStageClick(event) {
  if (event.target === event.currentTarget && loadSearchPageState().isSearchContainerVisible === 'no') {
    showSearchContainer()
  }
}

defineExpose({
  handleStageClick,
})

onMounted(() => {
  const state = loadSearchPageState()
  currentEngine.value = state.currentEngine
  isSearchContainerRendered.value = state.isSearchContainerVisible !== 'no'
  searchUiReady.value = true

  document.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('resize', updateSearchPopoverWidth)
  updateSearchPopoverWidth()
  focusInput()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('resize', updateSearchPopoverWidth)
  clearTimeout(engineExpandTimer)
  clearTimeout(hideSearchContainerTimer)
})
</script>

<style scoped>
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

.search-input {
  background-color: transparent;
  font-size: 17px;
  color: var(--text-main);
}

.search-input::placeholder {
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

:deep(.bookmark-result-popper.el-popper) {
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
  min-height: 42px;
  padding: 5px 10px;
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
  font-size: 14px;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-path {
  margin-top: 1px;
  font-size: 11px;
  line-height: 1.2;
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

.bookmark-suggest-panel {
  scrollbar-width: thin;
  scrollbar-color: rgba(146, 172, 179, 0.9) rgba(235, 244, 246, 0.7);
}

.bookmark-suggest-panel::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.bookmark-suggest-panel::-webkit-scrollbar-thumb {
  background: rgba(146, 172, 179, 0.9);
  border-radius: 999px;
}

.bookmark-suggest-panel::-webkit-scrollbar-track {
  background: rgba(235, 244, 246, 0.7);
  border-radius: 999px;
}
</style>
