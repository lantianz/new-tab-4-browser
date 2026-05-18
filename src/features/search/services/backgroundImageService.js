import {
  BACKGROUND_HANDLE_DB_NAME,
  BACKGROUND_HANDLE_KEY,
  BACKGROUND_HANDLE_STORE_NAME,
  BACKGROUND_IMAGE_FILE_LABEL_KEY,
  BACKGROUND_IMAGE_FILE_NAME_KEY,
  BACKGROUND_IMAGE_REMOTE_URL_KEY,
  BACKGROUND_IMAGE_SOURCE_KEY,
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

export async function pickBackgroundImageFile() {
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
