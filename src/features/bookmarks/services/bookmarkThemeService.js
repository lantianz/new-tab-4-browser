import { BOOKMARK_THEME_KEY } from '@/shared/constants/storageKeys'
import { readJsonStorage, writeJsonStorage } from '@/shared/services/localStorageService'
import { DEFAULT_BOOKMARK_THEME } from '../constants'

export function loadBookmarkTheme() {
  return {
    ...DEFAULT_BOOKMARK_THEME,
    ...(readJsonStorage(BOOKMARK_THEME_KEY, {}) || {}),
  }
}

export function saveBookmarkTheme(theme) {
  writeJsonStorage(BOOKMARK_THEME_KEY, theme)
}
