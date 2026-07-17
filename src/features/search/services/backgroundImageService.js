import {
  BACKGROUND_HANDLE_DB_NAME,
  BACKGROUND_HANDLE_KEY,
  BACKGROUND_HANDLE_STORE_NAME,
  BACKGROUND_IMAGE_FILE_LABEL_KEY,
  BACKGROUND_IMAGE_FILE_NAME_KEY,
  BACKGROUND_IMAGE_REMOTE_URL_KEY,
  BACKGROUND_IMAGE_SOURCE_KEY,
  BACKGROUND_LOCAL_FILE_KEY,
  BACKGROUND_REMOTE_CACHE_KEY,
} from '@/shared/constants/storageKeys'
import { readJsonStorage, writeJsonStorage } from '@/shared/services/localStorageService'

function openBackgroundHandleDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(BACKGROUND_HANDLE_DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(BACKGROUND_HANDLE_STORE_NAME)) {
        db.createObjectStore(BACKGROUND_HANDLE_STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function writeBackgroundAsset(key, value) {
  const db = await openBackgroundHandleDb()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(BACKGROUND_HANDLE_STORE_NAME, 'readwrite')
    tx.objectStore(BACKGROUND_HANDLE_STORE_NAME).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

async function readBackgroundAsset(key) {
  const db = await openBackgroundHandleDb()
  const value = await new Promise((resolve, reject) => {
    const tx = db.transaction(BACKGROUND_HANDLE_STORE_NAME, 'readonly')
    const request = tx.objectStore(BACKGROUND_HANDLE_STORE_NAME).get(key)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
  db.close()
  return value
}

async function deleteBackgroundAsset(key) {
  const db = await openBackgroundHandleDb()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(BACKGROUND_HANDLE_STORE_NAME, 'readwrite')
    tx.objectStore(BACKGROUND_HANDLE_STORE_NAME).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function saveBackgroundFileHandle(handle) {
  const db = await openBackgroundHandleDb()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(BACKGROUND_HANDLE_STORE_NAME, 'readwrite')
    tx.objectStore(BACKGROUND_HANDLE_STORE_NAME).put(handle, BACKGROUND_HANDLE_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function loadBackgroundFileHandle() {
  const db = await openBackgroundHandleDb()
  const handle = await new Promise((resolve, reject) => {
    const tx = db.transaction(BACKGROUND_HANDLE_STORE_NAME, 'readonly')
    const request = tx.objectStore(BACKGROUND_HANDLE_STORE_NAME).get(BACKGROUND_HANDLE_KEY)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
  db.close()
  return handle
}

export async function clearBackgroundFileHandle() {
  const db = await openBackgroundHandleDb()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(BACKGROUND_HANDLE_STORE_NAME, 'readwrite')
    tx.objectStore(BACKGROUND_HANDLE_STORE_NAME).delete(BACKGROUND_HANDLE_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function saveBackgroundImageFile(file) {
  await writeBackgroundAsset(BACKGROUND_LOCAL_FILE_KEY, file)
}

export async function loadBackgroundImageFile() {
  return readBackgroundAsset(BACKGROUND_LOCAL_FILE_KEY)
}

export async function clearBackgroundImageFile() {
  await deleteBackgroundAsset(BACKGROUND_LOCAL_FILE_KEY)
}

export async function fetchRemoteBackgroundImage(url) {
  const response = await fetch(url, { cache: 'no-cache' })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const blob = await response.blob()
  if (!blob.type.startsWith('image/')) {
    throw new Error('not-an-image')
  }

  return blob
}

export async function saveCachedRemoteBackgroundImage(url, blob) {
  await writeBackgroundAsset(BACKGROUND_REMOTE_CACHE_KEY, {
    url,
    blob,
    updatedAt: Date.now(),
  })
}

export async function loadCachedRemoteBackgroundImage(url) {
  const cache = await readBackgroundAsset(BACKGROUND_REMOTE_CACHE_KEY)
  return cache?.url === url && cache?.blob instanceof Blob ? cache.blob : null
}

export async function clearCachedRemoteBackgroundImage() {
  await deleteBackgroundAsset(BACKGROUND_REMOTE_CACHE_KEY)
}

export async function pickBackgroundImageFile() {
  if (typeof window.showOpenFilePicker !== 'function') {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = () => {
        const file = input.files?.[0]
        if (file) {
          resolve({ fileHandle: null, file })
        } else {
          reject(new DOMException('未选择图片', 'AbortError'))
        }
      }
      input.click()
    })
  }

  const [fileHandle] = await window.showOpenFilePicker({
    multiple: false,
    types: [
      {
        description: '图片文件',
        accept: {
          'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'],
        },
      },
    ],
  })

  const file = await fileHandle.getFile()
  return { fileHandle, file }
}

export function loadBackgroundImageLabel() {
  return readJsonStorage(BACKGROUND_IMAGE_FILE_LABEL_KEY, '') || ''
}

export function loadBackgroundImageSource() {
  return readJsonStorage(BACKGROUND_IMAGE_SOURCE_KEY, 'none') || 'none'
}

export function saveBackgroundImageSource(source) {
  writeJsonStorage(BACKGROUND_IMAGE_SOURCE_KEY, source || 'none')
}

export function loadBackgroundRemoteUrl() {
  return readJsonStorage(BACKGROUND_IMAGE_REMOTE_URL_KEY, '') || ''
}

export function saveBackgroundRemoteUrl(url) {
  writeJsonStorage(BACKGROUND_IMAGE_REMOTE_URL_KEY, url || '')
}

export function persistBackgroundImageMeta(fileName, label) {
  writeJsonStorage(BACKGROUND_IMAGE_FILE_NAME_KEY, fileName)
  writeJsonStorage(BACKGROUND_IMAGE_FILE_LABEL_KEY, label)
}

export function clearBackgroundImageMeta() {
  writeJsonStorage(BACKGROUND_IMAGE_FILE_NAME_KEY, '')
  writeJsonStorage(BACKGROUND_IMAGE_FILE_LABEL_KEY, '')
}
