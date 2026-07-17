<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="bookmark-context-menu"
      :style="menuStyle"
      role="menu"
      @pointerdown.stop
      @contextmenu.prevent>
      <template v-if="bookmark?.url">
        <button type="button" role="menuitem" @click="selectAction('open')">打开</button>
        <button type="button" role="menuitem" @click="selectAction('open-new-tab')">
          在新标签页中打开
        </button>
        <div class="menu-divider" />
        <button type="button" role="menuitem" @click="selectAction('edit')">修改书签</button>
        <button class="danger-item" type="button" role="menuitem" @click="selectAction('delete')">
          删除书签
        </button>
      </template>
      <template v-else>
        <button type="button" role="menuitem" @click="selectAction('create-folder')">
          新建文件夹
        </button>
        <button type="button" role="menuitem" @click="selectAction('edit')">重命名文件夹</button>
        <button class="danger-item" type="button" role="menuitem" @click="selectAction('delete')">
          删除文件夹
        </button>
      </template>
      <div class="menu-divider" />
      <button type="button" role="menuitem" @click="selectAction('open-manager')">
        打开书签管理器
      </button>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  bookmark: { type: Object, default: null },
})

const emit = defineEmits(['update:visible', 'action'])

const menuStyle = computed(() => ({
  left: `${Math.max(8, Math.min(props.x, window.innerWidth - 206))}px`,
  top: `${Math.max(8, Math.min(props.y, window.innerHeight - 250))}px`,
}))

function closeMenu() {
  if (props.visible) {
    emit('update:visible', false)
  }
}

function selectAction(action) {
  emit('action', action)
  closeMenu()
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', closeMenu)
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('blur', closeMenu)
  window.addEventListener('resize', closeMenu)
  window.addEventListener('scroll', closeMenu, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closeMenu)
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('blur', closeMenu)
  window.removeEventListener('resize', closeMenu)
  window.removeEventListener('scroll', closeMenu, true)
})
</script>

<style scoped>
.bookmark-context-menu {
  position: fixed;
  z-index: 5000;
  display: grid;
  width: 198px;
  padding: 5px;
  border: 1px solid rgba(118, 157, 166, 0.18);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 12px 30px rgba(54, 73, 82, 0.2);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

button {
  min-height: 32px;
  padding: 0 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--text-main);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

button:hover {
  background: rgba(231, 241, 243, 0.96);
}

.danger-item {
  color: #c45656;
}

.danger-item:hover {
  background: rgba(245, 108, 108, 0.1);
}

.menu-divider {
  height: 1px;
  margin: 4px 6px;
  background: rgba(118, 157, 166, 0.16);
}
</style>
