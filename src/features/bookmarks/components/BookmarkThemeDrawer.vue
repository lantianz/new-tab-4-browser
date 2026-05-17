<template>
  <el-drawer
    v-model="visibleProxy"
    class="panel-drawer"
    title="页面设置"
    direction="rtl"
    size="480px">
    <el-scrollbar max-height="calc(100vh - 120px)">
      <div class="settings-panel">
        <el-divider content-position="left">
          <span class="section-title">书签栏样式</span>
        </el-divider>
        <div class="section-desc">统一设置顶部书签栏的背景、文字与状态色。</div>
        <section>
          <div class="field-list">
            <div
              v-for="field in colorFields"
              :key="field.key"
              class="field-row">
              <span class="field-label">{{ field.label }}</span>
              <div class="field-control">
                <el-color-picker
                  v-model="localTheme[field.key]"
                  show-alpha />
                <span class="field-value">{{ localTheme[field.key] }}</span>
                <el-button
                  text
                  @click="resetField(field.key)">
                  默认
                </el-button>
              </div>
            </div>
          </div>
        </section>

        <el-divider content-position="left">
          <span class="section-title">跳转遮罩</span>
        </el-divider>
        <div class="section-desc">点击书签后展示全屏占位，增强跳转反馈。</div>
        <section>
          <div class="field-list">
            <div class="field-row">
              <span class="field-label">提示文字</span>
              <div class="field-control field-control-text">
                <el-input
                  v-model="localTheme.jumpOverlayText"
                  placeholder="正在跳转..." />
                <el-button
                  text
                  @click="resetField('jumpOverlayText')">
                  默认
                </el-button>
              </div>
            </div>
            <div
              v-for="field in jumpOverlayColorFields"
              :key="field.key"
              class="field-row">
              <span class="field-label">{{ field.label }}</span>
              <div class="field-control">
                <el-color-picker
                  v-model="localTheme[field.key]"
                  show-alpha />
                <span class="field-value">{{ localTheme[field.key] }}</span>
                <el-button
                  text
                  @click="resetField(field.key)">
                  默认
                </el-button>
              </div>
            </div>
          </div>
        </section>

        <el-divider content-position="left">
          <span class="section-title">背景图片</span>
        </el-divider>
        <div class="section-desc">直接选择本地图片作为新标签页背景。</div>
        <section>
          <el-upload
            class="background-upload"
            list-type="picture-card"
            :file-list="backgroundFiles"
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            :on-preview="handlePreview"
            :on-remove="handleBackgroundRemove">
            <el-icon class="background-upload-icon" @click.stop.prevent="emit('choose-background')">
              <Plus />
            </el-icon>
          </el-upload>
          <el-dialog
            v-model="previewVisible"
            :width="previewDialogWidth"
            align-center>
            <template #header>
              <div class="preview-dialog-header">
                <span class="preview-dialog-title">背景预览</span>
                <el-checkbox v-model="showMockLayout">显示模拟页面元素</el-checkbox>
              </div>
            </template>
            <div class="preview-stage" :style="{ '--preview-aspect-ratio': previewAspectRatio }">
              <div
                v-if="showMockLayout"
                class="preview-mock-shell">
                <div class="preview-mock-bar">
                  <span class="preview-mock-bookmark">常用</span>
                  <span class="preview-mock-bookmark">工具</span>
                  <span class="preview-mock-bookmark">项目</span>
                  <span class="preview-mock-bookmark">文档</span>
                  <span class="preview-mock-bookmark preview-mock-bookmark-right">其他书签</span>
                </div>
                <div class="preview-mock-search">
                  <div class="preview-mock-engine" />
                  <div class="preview-mock-input">搜索书签或输入关键词</div>
                  <div class="preview-mock-action" />
                </div>
              </div>
              <img v-if="previewImageUrl" :src="previewImageUrl" alt="背景预览" class="preview-image" />
            </div>
          </el-dialog>
        </section>
      </div>
    </el-scrollbar>
    <template #footer>
      <div class="drawer-actions">
        <el-button @click="resetAll">恢复默认</el-button>
        <el-button
          type="primary"
          @click="emit('save', { ...localTheme })">
          保存设置
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { DEFAULT_BOOKMARK_THEME } from '../constants'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  theme: { type: Object, required: true },
  backgroundFiles: { type: Array, default: () => [] },
})

const emit = defineEmits([
  'update:modelValue',
  'save',
  'choose-background',
  'clear-background',
])

const localTheme = ref({ ...DEFAULT_BOOKMARK_THEME, ...props.theme })
const previewVisible = ref(false)
const previewImageUrl = ref('')
const previewAspectRatio = ref(16 / 9)
const showMockLayout = ref(true)

const visibleProxy = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

watch(
  () => props.theme,
  (value) => {
    localTheme.value = { ...DEFAULT_BOOKMARK_THEME, ...value }
  },
  { deep: true, immediate: true },
)

function resetField(field) {
  localTheme.value[field] = DEFAULT_BOOKMARK_THEME[field]
}

function resetAll() {
  localTheme.value = { ...DEFAULT_BOOKMARK_THEME }
}

function handlePreview(file) {
  previewImageUrl.value = file.url || ''
  previewVisible.value = Boolean(previewImageUrl.value)
}

function handleBackgroundRemove() {
  emit('clear-background')
}

function syncPreviewRatio() {
  previewAspectRatio.value = window.innerWidth / Math.max(window.innerHeight, 1)
}

const previewDialogWidth = computed(() => {
  const widthByHeight = Math.min(window.innerHeight * 0.74 * previewAspectRatio.value, window.innerWidth * 0.92)
  return `${Math.max(720, Math.round(widthByHeight + 48))}px`
})

const colorFields = [
  { key: 'barBg', label: '背景色' },
  { key: 'lineColor', label: '底部边框色' },
  { key: 'textMain', label: '主文字色' },
  { key: 'textSub', label: '辅助文字色' },
  { key: 'iconColor', label: '图标颜色' },
  { key: 'hoverBg', label: '悬停背景色' },
  { key: 'activeBg', label: '激活背景色' },
  { key: 'activeBorder', label: '激活边框色' },
]

const jumpOverlayColorFields = [
  { key: 'jumpOverlayBg', label: '遮罩背景' },
  { key: 'jumpOverlayTextColor', label: '文字颜色' },
]

onMounted(() => {
  syncPreviewRatio()
  window.addEventListener('resize', syncPreviewRatio)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncPreviewRatio)
})
</script>

<style scoped>
.settings-panel {
  display: grid;
  gap: 16px;
  padding: 6px 2px 10px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
}

.section-desc {
  margin-top: -8px;
  margin-bottom: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-sub);
}

.field-list {
  display: grid;
  gap: 12px;
}

.field-row {
  display: grid;
  grid-template-columns: 92px 1fr;
  gap: 12px;
  align-items: center;
}

.field-label {
  font-size: 14px;
  color: var(--text-main);
}

.field-control {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
}

.field-control-text {
  grid-template-columns: 1fr auto;
}

.field-value {
  min-width: 0;
  padding: 6px 10px;
  border-radius: 10px;
  background: rgba(244, 248, 249, 0.92);
  border: 1px solid rgba(118, 157, 166, 0.14);
  color: var(--text-sub);
  font-size: 12px;
  font-family: Consolas, 'SFMono-Regular', Monaco, monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.background-card {
  display: grid;
  gap: 12px;
}

.background-label {
  font-size: 12px;
  color: var(--text-sub);
}

.background-value {
  margin-top: 4px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(244, 248, 249, 0.92);
  border: 1px solid rgba(118, 157, 166, 0.14);
  color: var(--text-main);
  font-size: 13px;
  line-height: 1.5;
  word-break: break-all;
}

.background-upload :deep(.el-upload-list__item),
.background-upload :deep(.el-upload--picture-card) {
  width: 116px;
  height: 116px;
  border-radius: 4px;
}

.background-upload-icon {
  font-size: 18px;
  color: var(--text-sub);
}

.preview-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}

.preview-dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.preview-stage {
  position: relative;
  width: 100%;
  aspect-ratio: var(--preview-aspect-ratio);
  overflow: hidden;
  border-radius: 14px;
  background: rgba(230, 238, 240, 0.72);
}

.preview-mock-shell {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.preview-mock-bar {
  position: absolute;
  inset: 0 0 auto 0;
  height: 44px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  background: rgba(241, 249, 250, 0.82);
  border-bottom: 1px solid rgba(103, 149, 157, 0.16);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.preview-mock-bookmark {
  display: inline-flex;
  align-items: center;
  max-width: 92px;
  height: 28px;
  padding: 0 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.34);
  color: rgba(50, 66, 77, 0.96);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-mock-bookmark-right {
  margin-left: auto;
}

.preview-mock-search {
  position: absolute;
  left: 50%;
  top: 56%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  width: min(58%, 540px);
  min-width: 280px;
  height: 50px;
  padding: 0 12px;
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.24);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.preview-mock-engine,
.preview-mock-action {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(111, 174, 181, 0.28);
  flex: 0 0 auto;
}

.preview-mock-input {
  flex: 1;
  min-width: 0;
  margin: 0 14px;
  color: rgba(50, 66, 77, 0.6);
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-image {
  display: block;
  position: relative;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.drawer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.el-divider__text) {
  padding: 0 10px 0 0;
  background: var(--el-bg-color);
}
</style>
