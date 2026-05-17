<template>
  <el-drawer
    v-model="visibleProxy"
    title="页面设置"
    direction="rtl"
    size="480px">
    <el-scrollbar max-height="calc(100vh - 120px)">
      <div class="settings-panel">
        <section class="settings-section">
          <div class="section-head">
            <div class="section-title">书签栏样式</div>
            <div class="section-desc">统一设置顶部书签栏的背景、文字与状态色。</div>
          </div>
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

        <section class="settings-section">
          <div class="section-head">
            <div class="section-title">跳转遮罩</div>
            <div class="section-desc">点击书签后展示全屏占位，增强跳转反馈。</div>
          </div>
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

        <section class="settings-section">
          <div class="section-head">
            <div class="section-title">背景图片</div>
            <div class="section-desc">直接选择本地图片作为新标签页背景。</div>
          </div>
          <div class="background-card">
            <div class="background-info">
              <div class="background-label">当前图片</div>
              <div class="background-value">{{ backgroundImageLabel || '未设置背景图片' }}</div>
            </div>
            <div class="background-actions">
              <el-button @click="$emit('choose-background')">选择图片</el-button>
              <el-button @click="$emit('clear-background')">清空背景</el-button>
            </div>
          </div>
        </section>

        <div class="drawer-actions">
          <el-button @click="resetAll">恢复默认</el-button>
          <el-button
            type="primary"
            @click="emit('save', { ...localTheme })">
            保存设置
          </el-button>
        </div>
      </div>
    </el-scrollbar>
  </el-drawer>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { DEFAULT_BOOKMARK_THEME } from '../constants'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  theme: { type: Object, required: true },
  backgroundImageLabel: { type: String, default: '' },
})

const emit = defineEmits([
  'update:modelValue',
  'save',
  'choose-background',
  'clear-background',
])

const localTheme = ref({ ...DEFAULT_BOOKMARK_THEME, ...props.theme })

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
</script>

<style scoped>
.settings-panel {
  display: grid;
  gap: 16px;
  padding: 8px 6px 22px;
}

.settings-section {
  padding: 16px;
  border-radius: 18px;
  background: rgba(251, 253, 253, 0.96);
  border: 1px solid rgba(118, 157, 166, 0.12);
  box-shadow: 0 8px 22px rgba(113, 143, 151, 0.08);
}

.section-head {
  margin-bottom: 14px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
}

.section-desc {
  margin-top: 4px;
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

.background-actions,
.drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
