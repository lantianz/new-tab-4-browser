import { SEARCH_PAGE_STORAGE_KEY } from '@/shared/constants/storageKeys'
import { readJsonStorage, writeJsonStorage } from '@/shared/services/localStorageService'
import { DEFAULT_SEARCH_PAGE_CONFIG } from '../constants'

export function loadSearchPageState() {
  return {
    ...DEFAULT_SEARCH_PAGE_CONFIG,
    ...(readJsonStorage(SEARCH_PAGE_STORAGE_KEY, {}) || {}),
  }
}

export function patchSearchPageState(patch) {
  writeJsonStorage(SEARCH_PAGE_STORAGE_KEY, {
    ...loadSearchPageState(),
    ...patch,
  })
}
