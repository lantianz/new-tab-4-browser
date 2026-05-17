import axios from 'axios'
import { parseBookmarks } from '@/utils/bookmark'

export function hasCompleteWebDavConfig(config) {
  return Boolean(
    config?.url
    && config?.username
    && config?.password
    && config?.remoteFile,
  )
}

export function normalizeWebDavUrl(config) {
  return `${config.url.replace(/\/+$/, '')}/${config.remoteFile.replace(/^\/+/, '')}`
}

export async function fetchBookmarksFromWebDav(config) {
  const response = await axios.get(normalizeWebDavUrl(config), {
    headers: {
      Authorization: `Basic ${btoa(`${config.username}:${config.password}`)}`,
    },
    responseType: 'text',
  })

  return {
    html: response.data,
    tree: parseBookmarks(response.data),
  }
}
