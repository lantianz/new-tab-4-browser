<template>
  <Transition name="toast-fade">
    <div v-if="visible" class="toast-container" :class="`toast-${type}`">
      <component :is="iconComponent" class="toast-icon" />
      <span class="toast-message">{{ message }}</span>
    </div>
  </Transition>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import IconSuccess from "~icons/mdi/check-circle";
import IconError from "~icons/mdi/alert-circle";
import IconWarning from "~icons/mdi/alert";
import IconInfo from "~icons/mdi/information";

export default {
  name: "Toast",
  components: {
    IconSuccess,
    IconError,
    IconWarning,
    IconInfo,
  },
  props: {
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: "info",
      validator: (value) => ["success", "error", "warning", "info"].includes(value),
    },
    duration: {
      type: Number,
      default: 1500,
    },
    onClose: {
      type: Function,
      default: () => {},
    },
  },
  setup(props) {
    const visible = ref(false);

    const iconComponent = computed(() => {
      const iconMap = {
        success: IconSuccess,
        error: IconError,
        warning: IconWarning,
        info: IconInfo,
      };
      return iconMap[props.type];
    });

    onMounted(() => {
      visible.value = true;

      setTimeout(() => {
        visible.value = false;
        setTimeout(() => {
          props.onClose();
        }, 300); // 等待动画结束
      }, props.duration);
    });

    return {
      visible,
      iconComponent,
    };
  },
};
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 16px;
  left: 16px;
  min-height: 40px;
  max-width: 300px;
  padding: 12px 16px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 9999;
  word-break: break-word;
}

.toast-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  line-height: 1.4;
}

/* 不同类型的背景色 */
.toast-success {
  background: #10b981;
}

.toast-error {
  background: #ef4444;
}

.toast-warning {
  background: #f59e0b;
}

.toast-info {
  background: #3b82f6;
}

/* 淡入淡出动画 */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-fade-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
