<template>
  <el-drawer v-model="visibleProxy" title="WebDAV 配置" direction="rtl" size="360px">
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
        <el-form-item label="同步频率（分钟）">
          <el-input-number
            v-model="localConfig.autoSyncIntervalMinutes"
            :min="5"
            :max="720"
            :step="5"
            style="width: 100%" />
        </el-form-item>
        <div class="drawer-actions">
          <el-button @click="visibleProxy = false">关闭</el-button>
          <el-button :loading="testing" @click="emit('test', { ...localConfig })">测试连接</el-button>
          <el-button type="primary" @click="emit('save', { ...localConfig })">保存</el-button>
        </div>
      </el-form>
    </el-scrollbar>
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
