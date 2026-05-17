<template>
  <transition name="jump-overlay-fade">
    <div v-if="visible" class="jump-overlay">
      <div class="jump-overlay-card">
        <el-icon class="jump-overlay-icon"><Loading /></el-icon>
        <div class="jump-overlay-text">{{ text }}</div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { Loading } from '@element-plus/icons-vue'

defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  text: {
    type: String,
    default: '正在跳转...',
  },
})
</script>

<style scoped>
.jump-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--jump-overlay-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.jump-overlay-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 24px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: var(--jump-overlay-text-color);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.12);
}

.jump-overlay-icon {
  font-size: 22px;
  animation: jump-overlay-spin 1s linear infinite;
}

.jump-overlay-text {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.jump-overlay-fade-enter-active,
.jump-overlay-fade-leave-active {
  transition: opacity 0.18s ease;
}

.jump-overlay-fade-enter-from,
.jump-overlay-fade-leave-to {
  opacity: 0;
}

@keyframes jump-overlay-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
