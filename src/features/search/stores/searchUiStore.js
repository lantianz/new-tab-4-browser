import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { DEFAULT_SEARCH_PAGE_CONFIG, SEARCH_ENGINES } from '../constants'

export const useSearchUiStore = defineStore('search-ui', () => {
  const query = ref('')
  const currentEngine = ref(DEFAULT_SEARCH_PAGE_CONFIG.currentEngine)
  const searchUiReady = ref(false)
  const isSearchContainerRendered = ref(true)
  const searchContainerAnimationClass = ref('')
  const engineExpanded = ref(false)
  const searchPopoverWidth = ref(560)

  const orderedEngines = computed(() => {
    const selected = SEARCH_ENGINES.find((item) => item.name === currentEngine.value) || SEARCH_ENGINES[0]
    const rest = SEARCH_ENGINES.filter((item) => item.name !== selected.name)
    return [selected, ...rest]
  })

  const visibleEngines = computed(() => {
    return engineExpanded.value ? orderedEngines.value : orderedEngines.value.slice(0, 1)
  })

  return {
    query,
    currentEngine,
    searchUiReady,
    isSearchContainerRendered,
    searchContainerAnimationClass,
    engineExpanded,
    searchPopoverWidth,
    orderedEngines,
    visibleEngines,
  }
})
