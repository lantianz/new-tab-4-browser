<template>
  <el-drawer
    v-model="visibleProxy"
    class="panel-drawer"
    title="WebDAV 配置"
    direction="rtl"
    size="360px">
    <el-scrollbar max-height="calc(100vh - 120px)">
      <el-form label-position="top" :model="localConfig">
        <el-form-item label="地址">
          <el-input v-model="localConfig.url" />
        </el-form-item>
        <el-form-item label="账号">
          <el-input v-model="localConfig.username" />
        </el-form-item>
        <el-form-item label="应用密码">
          <el-input v-model="localConfig.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="书签文件">
          <el-input v-model="localConfig.remoteFile" />
        </el-form-item>
        <el-form-item label="自动同步">
          <el-switch v-model="localConfig.autoSyncEnabled" />
        </el-form-item>
        <el-form-item label="同步时间粒度">
          <el-segmented
            v-model="localConfig.autoSyncIntervalUnit"
            :options="intervalUnitOptions" />
        </el-form-item>
        <el-form-item label="同步时间大小">
          <el-input-number
            v-model="localConfig.autoSyncIntervalValue"
            :min="1"
            :max="365"
            :step="1"
            style="width: 100%" />
        </el-form-item>
      </el-form>
    </el-scrollbar>
    <template #footer>
      <div class="drawer-actions">
        <el-button :loading="testing" @click="emit('test', { ...localConfig })">测试连接</el-button>
        <el-button type="primary" @click="emit('save', { ...localConfig })">保存</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  config: { type: Object, required: true },
  testing: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'save', 'test'])

const localConfig = ref({ ...props.config })
const intervalUnitOptions = [
  { label: '分', value: 'minute' },
  { label: '时', value: 'hour' },
  { label: '天', value: 'day' },
]

const visibleProxy = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

watch(
  () => props.config,
  (value) => {
    localConfig.value = { ...value }
  },
  { deep: true, immediate: true },
)
</script>

<style scoped>
.drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
