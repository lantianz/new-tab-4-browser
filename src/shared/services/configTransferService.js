const CONFIG_BACKUP_TYPE = 'new-tab-bookmarker-config'
const CONFIG_BACKUP_VERSION = 1

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export async function createConfigurationBackup({
  webdavConfig,
  theme,
  searchPageState,
  background,
  backgroundAsset,
}) {
  const asset = backgroundAsset
    ? {
        name: backgroundAsset.name || background.label || 'background-image',
        type: backgroundAsset.type || 'application/octet-stream',
        dataUrl: await blobToDataUrl(backgroundAsset),
      }
    : null

  return {
    type: CONFIG_BACKUP_TYPE,
    version: CONFIG_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    webdavConfig,
    theme,
    searchPageState,
    background: {
      ...background,
      asset,
    },
  }
}

export function downloadConfigurationBackup(backup) {
  const content = JSON.stringify(backup, null, 2)
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
  const link = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `new-tab-bookmarker-config-${date}.json`
  link.click()
  URL.revokeObjectURL(url)
}

function validateConfigurationBackup(value) {
  if (!value || typeof value !== 'object' || value.type !== CONFIG_BACKUP_TYPE) {
    throw new Error('不是有效的新标签页配置文件')
  }
  if (value.version !== CONFIG_BACKUP_VERSION) {
    throw new Error(`不支持的配置版本: ${value.version}`)
  }
  for (const key of ['webdavConfig', 'theme', 'searchPageState', 'background']) {
    if (value[key] && typeof value[key] !== 'object') {
      throw new Error(`${key} 配置无效`)
    }
  }
  if (value.background?.source && !['none', 'local', 'remote'].includes(value.background.source)) {
    throw new Error('背景来源配置无效')
  }
  if (value.background?.asset?.dataUrl
    && !value.background.asset.dataUrl.startsWith('data:image/')) {
    throw new Error('背景图片数据无效')
  }
  return value
}

export function pickConfigurationBackup() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = async () => {
      try {
        const file = input.files?.[0]
        if (!file) {
          reject(new DOMException('未选择配置文件', 'AbortError'))
          return
        }
        const backup = JSON.parse(await file.text())
        resolve(validateConfigurationBackup(backup))
      } catch (error) {
        reject(error)
      }
    }
    input.click()
  })
}

export async function configurationAssetToBlob(asset) {
  if (!asset?.dataUrl) {
    return null
  }
  const response = await fetch(asset.dataUrl)
  return response.blob()
}
