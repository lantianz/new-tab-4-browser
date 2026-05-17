import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { buildTopBarItems, flattenLinks } from '@/utils/bookmark'
import { DEFAULT_BOOKMARK_THEME } from '../constants'
import { loadBookmarkTheme, saveBookmarkTheme as persistBookmarkTheme } from '../services/bookmarkThemeService'

export const useBookmarkUiStore = defineStore('bookmark-ui', () => {
  const bookmarkTree = ref(null)
  const toolbarItems = ref([])
  const visibleToolbarItems = ref([])
  const overflowToolbarItems = ref([])
  const allLinks = ref([])
  const activeTopFolderId = ref(null)
  const bookmarkTheme = ref({ ...DEFAULT_BOOKMARK_THEME })
  const debugVisible = ref(false)
  const themeVisible = ref(false)
  const jumpOverlayVisible = ref(false)

  const bookmarkBarStyle = computed(() => ({
    '--bar-bg': bookmarkTheme.value.barBg,
    '--line-color': bookmarkTheme.value.lineColor,
    '--text-main': bookmarkTheme.value.textMain,
    '--text-sub': bookmarkTheme.value.textSub,
    '--icon-color': bookmarkTheme.value.iconColor,
    '--bar-hover-bg': bookmarkTheme.value.hoverBg,
    '--bar-active-bg': bookmarkTheme.value.activeBg,
    '--bar-active-border': bookmarkTheme.value.activeBorder,
    '--jump-overlay-bg': bookmarkTheme.value.jumpOverlayBg,
    '--jump-overlay-text-color': bookmarkTheme.value.jumpOverlayTextColor,
  }))

  function loadTheme() {
    bookmarkTheme.value = loadBookmarkTheme()
  }

  function saveTheme() {
    persistBookmarkTheme(bookmarkTheme.value)
  }

  function resetTheme() {
    bookmarkTheme.value = { ...DEFAULT_BOOKMARK_THEME }
  }

  function resetThemeField(field) {
    bookmarkTheme.value[field] = DEFAULT_BOOKMARK_THEME[field]
  }

  function updateTree(tree) {
    bookmarkTree.value = tree
    toolbarItems.value = buildTopBarItems(tree)
    allLinks.value = flattenLinks(tree)
  }

  function clearBookmarks() {
    bookmarkTree.value = null
    toolbarItems.value = []
    visibleToolbarItems.value = []
    overflowToolbarItems.value = []
    allLinks.value = []
    activeTopFolderId.value = null
  }

  return {
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
    loadTheme,
    saveTheme,
    resetTheme,
    resetThemeField,
    updateTree,
    clearBookmarks,
  }
})
