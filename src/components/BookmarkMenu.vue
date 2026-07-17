<template>
  <el-scrollbar
    class="bookmark-menu-scroll"
    max-height="480px">
    <div class="bookmark-menu">
      <template
        v-for="item in items"
        :key="item.id">
        <el-popover
          v-if="item.type === 'folder'"
          :visible="activeFolderId === item.id"
          placement="right-start"
          :width="260"
          trigger="click"
          :hide-after="60"
          :show-after="0"
          :offset="4"
          transition="bookmark-popover-transition"
          :fallback-placements="['right-start', 'left-start']"
          popper-class="bookmark-popper"
          @update:visible="(visible) => handleFolderVisibleChange(item.id, visible)">
          <template #reference>
            <button
              class="menu-row menu-folder"
              :class="{ 'is-active': activeFolderId === item.id }"
              :title="buildBookmarkTitle(item)"
              @contextmenu.prevent="emit('bookmark-contextmenu', { event: $event, item })">
              <el-icon class="menu-icon"><Folder /></el-icon>
              <span class="menu-text">{{ item.name }}</span>
              <span class="menu-arrow">›</span>
            </button>
          </template>
          <BookmarkMenu
            :items="item.children"
            @bookmark-link-click="emit('bookmark-link-click', $event)"
            @bookmark-contextmenu="forwardBookmarkContextMenu" />
        </el-popover>
        <a
          v-else
          class="menu-row menu-link"
          :href="item.url"
          :title="buildBookmarkTitle(item)"
          @click.prevent="emit('bookmark-link-click', item.url)"
          @contextmenu.prevent="emit('bookmark-contextmenu', { event: $event, item })">
          <img
            v-if="getBookmarkFaviconUrl(item)"
            :src="getBookmarkFaviconUrl(item)"
            class="menu-favicon"
            alt="" />
          <el-icon
            v-else
            class="menu-icon">
            <Link />
          </el-icon>
          <span class="menu-text">{{ item.name }}</span>
        </a>
      </template>
    </div>
  </el-scrollbar>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Folder, Link } from '@element-plus/icons-vue'
import { getBookmarkFaviconUrl } from '@/features/bookmarks/services/bookmarkFaviconService'
import { buildBookmarkTitle } from '@/features/bookmarks/services/bookmarkTitleService'

const emit = defineEmits(['bookmark-link-click', 'bookmark-contextmenu'])

const activeFolderId = ref(null)

function handleFolderVisibleChange(id, visible) {
  activeFolderId.value = visible ? id : activeFolderId.value === id ? null : activeFolderId.value
}

function forwardBookmarkContextMenu(payload) {
  emit('bookmark-contextmenu', payload)
}

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  closeSignal: {
    type: String,
    default: null,
  },
})

watch(
  () => props.closeSignal,
  () => {
    activeFolderId.value = null
  }
)
</script>

<style scoped>
.menu-row {
  width: 100%;
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box;
  padding: 0 10px;
}

.menu-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-folder,
.menu-link {
  justify-content: flex-start;
  text-align: left;
}

.menu-folder.is-active {
  background: rgba(210, 231, 235, 0.98);
  color: #23343d;
}

.bookmark-menu-scroll {
  padding-right: 2px;
}

.bookmark-menu-scroll :deep(.el-scrollbar__view) {
  width: 100%;
}
</style>
