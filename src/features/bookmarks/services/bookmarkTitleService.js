export function buildBookmarkTitle(item) {
  if (!item) return ''
  if (item.type === 'folder') {
    const childCount = Array.isArray(item.children) ? item.children.length : 0
    return `${item.name}\n包含 ${childCount} 项`
  }
  return `${item.name}\n${item.url || ''}`
}
