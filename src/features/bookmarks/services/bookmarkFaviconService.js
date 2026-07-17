export function getChromeFaviconUrl(pageUrl, size = 32) {
  if (!pageUrl || typeof chrome === 'undefined' || !chrome.runtime?.getURL) {
    return ''
  }

  const faviconUrl = new URL(chrome.runtime.getURL('/_favicon/'))
  faviconUrl.searchParams.set('pageUrl', pageUrl)
  faviconUrl.searchParams.set('size', String(size))
  return faviconUrl.toString()
}

export function getBookmarkFaviconUrl(bookmark, size = 32) {
  return bookmark?.icon || getChromeFaviconUrl(bookmark?.url, size)
}
