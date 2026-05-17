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
              :title="buildBookmarkTitle(item)">
              <el-icon class="menu-icon"><Folder /></el-icon>
              <span class="menu-text">{{ item.name }}</span>
              <span class="menu-arrow">›</span>
            </button>
          </template>
          <BookmarkMenu
            :items="item.children"
            @bookmark-link-click="emit('bookmark-link-click', $event)" />
        </el-popover>
        <a
          v-else
          class="menu-row menu-link"
          :href="item.url"
          :title="buildBookmarkTitle(item)"
          @click.prevent="emit('bookmark-link-click', item.url)">
          <img
            v-if="item.icon"
            :src="item.icon"
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
import { ref } from 'vue'
import { Folder, Link } from '@element-plus/icons-vue'
import { buildBookmarkTitle } from '@/features/bookmarks/services/bookmarkTitleService'

const emit = defineEmits(['bookmark-link-click'])

const activeFolderId = ref(null)

function handleFolderVisibleChange(id, visible) {
  activeFolderId.value = visible ? id : activeFolderId.value === id ? null : activeFolderId.value
}

defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})
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
