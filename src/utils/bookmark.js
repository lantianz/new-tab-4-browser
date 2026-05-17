export function uuid() {
  return Math.random().toString(36).slice(2, 10)
}

export function decodeHtml(value = '') {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

export function parseAttributes(raw = '') {
  const attrs = {}
  const attrPattern = /([A-Z_]+)="([^"]*)"/gi
  for (const match of raw.matchAll(attrPattern)) {
    attrs[match[1].toLowerCase()] = decodeHtml(match[2])
  }
  return attrs
}

export function stripTags(value = '') {
  return decodeHtml(value.replace(/<[^>]+>/g, '').trim())
}

export function createFolder(name) {
  return {
    id: uuid(),
    type: 'folder',
    name,
    children: [],
  }
}

export function parseBookmarks(html) {
  const root = createFolder('公司书签')
  const stack = [root]
  let pendingFolder = null

  const tokens = html.match(/<\/?DL><p>|<DT><H3[^>]*>.*?<\/H3>|<DT><A[^>]*>.*?<\/A>/gi) || []

  for (const token of tokens) {
    const line = token.trim()

    const folderMatch = line.match(/<DT><H3([^>]*)>(.*?)<\/H3>/i)
    if (folderMatch) {
      const name = stripTags(folderMatch[2]) || '未命名文件夹'
      pendingFolder = createFolder(name)
      pendingFolder.meta = parseAttributes(folderMatch[1])
      stack.at(-1).children.push(pendingFolder)
      continue
    }

    if (/^<DL><p>$/i.test(line)) {
      if (pendingFolder) {
        stack.push(pendingFolder)
        pendingFolder = null
      }
      continue
    }

    if (/^<\/DL><p>$/i.test(line)) {
      pendingFolder = null
      if (stack.length > 1) stack.pop()
      continue
    }

    const linkMatch = line.match(/<DT><A([^>]*)>(.*?)<\/A>/i)
    if (linkMatch) {
      const attrs = parseAttributes(linkMatch[1])
      stack.at(-1).children.push({
        id: uuid(),
        type: 'link',
        name: stripTags(linkMatch[2]) || attrs.href || '未命名链接',
        url: attrs.href || '',
        icon: attrs.icon || '',
        meta: attrs,
      })
    }
  }

  return root
}

export function flattenLinks(node, parents = []) {
  if (node.type === 'link') {
    return [{ ...node, path: parents }]
  }

  const nextParents = node.name === '公司书签' ? parents : [...parents, node.name]
  return node.children.flatMap((child) => flattenLinks(child, nextParents))
}

export function findToolbarItems(tree) {
  if (!tree || !Array.isArray(tree.children)) return []
  const bookmarkBarFolder = tree.children.find(
    (item) => item.type === 'folder' && item.name === '书签栏',
  )
  return bookmarkBarFolder ? bookmarkBarFolder.children : tree.children
}

export function findOtherBookmarksFolder(tree) {
  if (!tree || !Array.isArray(tree.children)) return null
  const names = ['其他书签', 'Other bookmarks', 'Other Bookmarks']
  const directOther = tree.children.find(
    (item) => item.type === 'folder' && names.includes(item.name),
  )
  if (directOther) return directOther

  const bookmarkBarIndex = tree.children.findIndex(
    (item) => item.type === 'folder' && item.name === '书签栏',
  )
  if (bookmarkBarIndex === -1 || bookmarkBarIndex >= tree.children.length - 1) {
    return null
  }

  return {
    id: `other-${tree.children[bookmarkBarIndex].id}`,
    type: 'folder',
    name: '其他书签',
    children: tree.children.slice(bookmarkBarIndex + 1),
    synthetic: true,
  }
}

export function buildTopBarItems(tree) {
  const items = [...findToolbarItems(tree)]
  const other = findOtherBookmarksFolder(tree)
  if (other) {
    items.push(other)
  }
  return items
}
