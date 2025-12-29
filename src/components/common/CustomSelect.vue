<template>
  <div
    ref="selectRef"
    class="custom-select"
  >
    <button
      class="select-trigger"
      :class="{ open: isOpen, disabled: disabled }"
      :disabled="disabled"
      type="button"
      @click="toggleDropdown"
    >
      <span>{{ displayValue }}</span>
      <IconChevronDown class="select-icon" />
    </button>
    <div
      v-if="isOpen"
      class="select-dropdown"
      :class="{ 'drop-up': dropUp }"
      :style="dropdownStyle"
    >
      <ul class="select-options">
        <li
          v-if="options.length === 0"
          class="select-empty"
        >
          暂无选项
        </li>
        <li
          v-for="option in options"
          :key="getOptionValue(option)"
          class="select-option"
          :class="{ selected: isSelected(option) }"
          @click="handleSelect(option)"
        >
          {{ getOptionLabel(option) }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import IconChevronDown from '~icons/mdi/chevron-down'

export default {
  name: 'CustomSelect',
  components: {
    IconChevronDown,
  },
  props: {
    options: {
      type: Array,
      required: true,
    },
    modelValue: {
      type: String,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    maxShow: {
      type: Number,
      default: 5,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const isOpen = ref(false)
    const dropUp = ref(false)
    const maxHeight = ref(null)
    const selectRef = ref(null)

    const OPTION_HEIGHT = 32
    const MIN_HEIGHT = 64
    const MARGIN = 8

    // 根据选项数量估算下拉框实际需要的高度
    const estimateDropdownHeight = () => {
      const count = Math.max(props.options.length, 1) // 至少1项（空提示）
      const visibleCount = Math.min(count, props.maxShow)
      return visibleCount * OPTION_HEIGHT
    }

    // 计算下拉框展开方向和高度
    const calculateDropDirection = () => {
      if (!selectRef.value) return
      const rect = selectRef.value.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom - MARGIN
      const spaceAbove = rect.top - MARGIN
      const neededHeight = estimateDropdownHeight()

      if (spaceBelow >= neededHeight) {
        // 下方空间足够
        dropUp.value = false
        maxHeight.value = neededHeight
      } else if (spaceAbove >= neededHeight) {
        // 上方空间足够
        dropUp.value = true
        maxHeight.value = neededHeight
      } else {
        // 上下空间都不足，选择更大的一侧并限制高度
        dropUp.value = spaceAbove > spaceBelow
        const availableSpace = Math.max(spaceAbove, spaceBelow)
        maxHeight.value = Math.max(availableSpace, MIN_HEIGHT)
      }
    }

    // 下拉框动态样式
    const dropdownStyle = computed(() => {
      if (maxHeight.value) {
        return { '--dropdown-max-height': `${maxHeight.value}px` }
      }
      return {}
    })

    // 判断 option 是对象还是字符串
    const isObjectOption = (option) => {
      return typeof option === 'object' && option !== null
    }

    // 获取选项的值
    const getOptionValue = (option) => {
      return isObjectOption(option) ? option.value : option
    }

    // 获取选项的显示文本
    const getOptionLabel = (option) => {
      return isObjectOption(option) ? option.label : option
    }

    // 获取当前选中值的显示文本
    const displayValue = computed(() => {
      const selectedOption = props.options.find(
        (opt) => getOptionValue(opt) === props.modelValue
      )
      return selectedOption ? getOptionLabel(selectedOption) : props.modelValue
    })

    // 判断选项是否被选中
    const isSelected = (option) => {
      return getOptionValue(option) === props.modelValue
    }

    const toggleDropdown = () => {
      if (props.disabled) return
      if (!isOpen.value) {
        calculateDropDirection()
      }
      isOpen.value = !isOpen.value
    }

    const handleSelect = (option) => {
      const value = getOptionValue(option)
      emit('update:modelValue', value)
      isOpen.value = false
    }

    const handleClickOutside = (e) => {
      if (selectRef.value && !selectRef.value.contains(e.target)) {
        isOpen.value = false
      }
    }

    onMounted(() => {
      // 使用捕获阶段，避免被 @click.stop 阻止
      document.addEventListener('click', handleClickOutside, true)
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside, true)
    })

    return {
      isOpen,
      dropUp,
      dropdownStyle,
      selectRef,
      displayValue,
      getOptionValue,
      getOptionLabel,
      isSelected,
      toggleDropdown,
      handleSelect,
    }
  },
}
</script>

<style scoped>
.custom-select {
  position: relative;
  flex: 1;
}

.select-trigger {
  width: 100%;
  height: 32px;
  padding: 0 12px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 400;
  font-family: inherit;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff;
  color: #1f2937;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

.select-trigger:focus {
  outline: none;
  border-color: #2563eb;
  background: #f0f7ff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}

.select-trigger.open {
  border-color: #2563eb;
  background: #f0f7ff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}

.select-trigger.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f9fafb;
}

.select-trigger.disabled:hover {
  border-color: #e5e7eb;
  background: #f9fafb;
}

.select-icon {
  width: 16px;
  height: 16px;
  color: #9ca3af;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  margin-left: 8px;
  flex-shrink: 0;
}

.select-trigger.open .select-icon {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 8px;
  background: white;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  animation: slideDown 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.select-dropdown.drop-up {
  top: auto;
  bottom: 100%;
  margin-top: 0;
  margin-bottom: 8px;
  animation: slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.select-options {
  list-style: none;
  max-height: var(--dropdown-max-height, 150px);
  overflow-y: auto;
  margin: 0;
  padding: 0;
}

.select-empty {
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
}

.select-options::-webkit-scrollbar {
  width: 6px;
}

.select-options::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.select-option {
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  font-weight: 400;
}

.select-option:hover {
  background: #f0f7ff;
  color: #2563eb;
}

.select-option.selected {
  background: #eff6ff;
  color: #2563eb;
  font-weight: 600;
}
</style>
