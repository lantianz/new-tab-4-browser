<template>
  <header
    class="bookmark-bar"
    :class="{ 'has-active-folder': !!activeTopFolderId }"
    :style="bookmarkBarStyle">
    <div class="bar-left">
      <div
        class="bar-scroll"
        :class="{ 'has-overflow-bookmarks': overflowToolbarItems.length }">
        <template v-for="item in visibleToolbarItems" :key="item.id">
          <el-popover
            v-if="item.type === 'folder'"
            :visible="activeTopFolderId === item.id"
            placement="bottom-start"
            :width="260"
            trigger="click"
            :hide-after="60"
            :show-after="0"
            :offset="8"
            transition="bookmark-popover-transition"
            :fallback-placements="['bottom-start', 'bottom-end']"
            popper-class="bookmark-popper"
            @update:visible="(visible) => emit('top-folder-visible-change', item.id, visible)">
            <template #reference>
              <button
                class="bar-item folder-item"
                :class="{
                  'is-active': activeTopFolderId === item.id,
                  'other-bookmarks-item': item.name === '所有书签',
                }"
                :title="buildBookmarkTitle(item)"
                @mouseenter="handleFolderMouseenter(item.id, activeTopFolderId)"
                @contextmenu.prevent="emit('bookmark-contextmenu', { event: $event, item })">
                <el-icon class="item-icon"><Folder /></el-icon>
                <span class="item-text">{{ item.name }}</span>
              </button>
            </template>
            <BookmarkMenu
              :items="item.children"
              :close-signal="activeTopFolderId"
              @bookmark-link-click="handleLinkClick"
              @bookmark-contextmenu="forwardBookmarkContextMenu" />
          </el-popover>
          <a
            v-else
            class="bar-item link-item"
            :href="item.url"
            :title="buildBookmarkTitle(item)"
            @click="handleTopLinkClick($event, item.url, activeTopFolderId)"
            @contextmenu.prevent="emit('bookmark-contextmenu', { event: $event, item })">
            <img
              v-if="getBookmarkFaviconUrl(item)"
              :src="getBookmarkFaviconUrl(item)"
              class="favicon"
              alt="" />
            <el-icon v-else class="item-icon"><ChromeFilled /></el-icon>
            <span class="item-text">{{ item.name }}</span>
          </a>
        </template>

        <div v-if="!toolbarItems.length" class="bar-empty">
          暂无书签，可在浏览器中添加书签或配置 WebDAV
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
            <button class="bar-item overflow-bookmarks-button" title="更多书签">
              <el-icon class="item-icon"><DArrowRight /></el-icon>
            </button>
          </template>
          <BookmarkMenu
            :items="overflowToolbarItems"
            @bookmark-link-click="handleLinkClick"
            @bookmark-contextmenu="forwardBookmarkContextMenu" />
        </el-popover>
      </div>
    </div>
  </header>

  <div class="floating-actions">
    <el-popover
      placement="top-end"
      trigger="click"
      :hide-after="60"
      :show-after="0"
      :offset="8"
      transition="bookmark-popover-transition"
      popper-class="bookmark-popper action-popper">
      <template #reference>
        <button class="more-button" title="更多操作">
          <el-icon><ArrowUp /></el-icon>
        </button>
      </template>
      <div class="action-menu">
        <button class="action-menu-item" type="button" @click="emit('clear-cache')">清空缓存</button>
        <button class="action-menu-item" type="button" @click="emit('refresh-bookmarks')">
          {{ loading ? '刷新中...' : '刷新书签' }}
        </button>
        <button
          class="action-menu-item"
          type="button"
          :disabled="browserSyncing"
          @click="emit('sync-browser-bookmarks')">
          {{ browserSyncing ? '同步中...' : '同步当前浏览器书签' }}
        </button>
        <button class="action-menu-item" type="button" @click="emit('export-config')">导出配置</button>
        <button class="action-menu-item" type="button" @click="emit('import-config')">导入配置</button>
        <button class="action-menu-item" type="button" @click="emit('open-debug')">解析树调试</button>
        <button class="action-menu-item" type="button" @click="emit('open-theme')">页面设置</button>
        <button class="action-menu-item" type="button" @click="emit('open-webdav')">WebDAV 配置</button>
      </div>
    </el-popover>
  </div>
</template>

<script setup>
import { ArrowUp, ChromeFilled, DArrowRight, Folder } from '@element-plus/icons-vue'
import BookmarkMenu from '@/components/BookmarkMenu.vue'
import { getBookmarkFaviconUrl } from '@/features/bookmarks/services/bookmarkFaviconService'

defineProps({
  toolbarItems: { type: Array, default: () => [] },
  visibleToolbarItems: { type: Array, default: () => [] },
  overflowToolbarItems: { type: Array, default: () => [] },
  activeTopFolderId: { type: String, default: null },
  bookmarkBarStyle: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
  browserSyncing: { type: Boolean, default: false },
  buildBookmarkTitle: { type: Function, required: true },
})

const emit = defineEmits([
  'top-folder-visible-change',
  'clear-cache',
  'refresh-bookmarks',
  'sync-browser-bookmarks',
  'export-config',
  'import-config',
  'bookmark-contextmenu',
  'open-debug',
  'open-theme',
  'open-webdav',
  'bookmark-link-click',
])

function handleLinkClick(url) {
  emit('bookmark-link-click', url)
}

function forwardBookmarkContextMenu(payload) {
  emit('bookmark-contextmenu', payload)
}

function handleTopLinkClick(event, url, currentActiveId) {
  if (currentActiveId) {
    event.preventDefault()
    emit('top-folder-visible-change', currentActiveId, false)
    return
  }

  handleLinkClick(url)
}

function handleFolderMouseenter(id, currentActiveId) {
  if (!currentActiveId || currentActiveId === id) {
    return
  }

  emit('top-folder-visible-change', id, true)
}
</script>
