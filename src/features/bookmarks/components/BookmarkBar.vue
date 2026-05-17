<template>
  <header class="bookmark-bar" :style="bookmarkBarStyle">
    <div class="bar-left">
      <div class="bar-scroll">
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
                  'other-bookmarks-item': item.name === '其他书签',
                }"
                :title="buildBookmarkTitle(item)">
                <el-icon class="item-icon"><Folder /></el-icon>
                <span class="item-text">{{ item.name }}</span>
              </button>
            </template>
            <BookmarkMenu
              :items="item.children"
              @bookmark-link-click="handleLinkClick" />
          </el-popover>
          <a
            v-else
            class="bar-item link-item"
            :href="item.url"
            :title="buildBookmarkTitle(item)"
            @click="handleLinkClick(item.url)">
            <img v-if="item.icon" :src="item.icon" class="favicon" alt="" />
            <el-icon v-else class="item-icon"><ChromeFilled /></el-icon>
            <span class="item-text">{{ item.name }}</span>
          </a>
        </template>

        <div v-if="!toolbarItems.length" class="bar-empty">
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
            <button class="bar-item overflow-bookmarks-button" title="更多书签">
              <el-icon class="item-icon"><DArrowRight /></el-icon>
            </button>
          </template>
          <BookmarkMenu
            :items="overflowToolbarItems"
            @bookmark-link-click="handleLinkClick" />
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
          <button class="more-button" title="更多操作">
            <el-icon><ArrowDown /></el-icon>
          </button>
        </template>
        <div class="action-menu">
          <button class="action-menu-item" type="button" @click="emit('clear-cache')">清空缓存</button>
          <button class="action-menu-item" type="button" @click="emit('refresh-bookmarks')">
            {{ loading ? '刷新中...' : '刷新书签' }}
          </button>
          <button class="action-menu-item" type="button" @click="emit('open-debug')">解析树调试</button>
          <button class="action-menu-item" type="button" @click="emit('open-theme')">页面设置</button>
          <button class="action-menu-item" type="button" @click="emit('open-webdav')">WebDAV 配置</button>
        </div>
      </el-popover>
    </div>
  </header>
</template>

<script setup>
import { ArrowDown, ChromeFilled, DArrowRight, Folder } from '@element-plus/icons-vue'
import BookmarkMenu from '@/components/BookmarkMenu.vue'

defineProps({
  toolbarItems: { type: Array, default: () => [] },
  visibleToolbarItems: { type: Array, default: () => [] },
  overflowToolbarItems: { type: Array, default: () => [] },
  activeTopFolderId: { type: String, default: null },
  bookmarkBarStyle: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
  buildBookmarkTitle: { type: Function, required: true },
})

const emit = defineEmits([
  'top-folder-visible-change',
  'clear-cache',
  'refresh-bookmarks',
  'open-debug',
  'open-theme',
  'open-webdav',
  'bookmark-link-click',
])

function handleLinkClick(url) {
  emit('bookmark-link-click', url)
}
</script>
