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

function normalizeChromeRootTitle(node) {
  const titleMap = {
    1: '书签栏',
    2: '其他书签',
    3: '移动设备书签',
  }
  return titleMap[node.id] || node.title || '未命名文件夹'
}

function convertChromeBookmarkNode(node, isRootChild = false) {
  if (node.url) {
    return {
      id: node.id,
      type: 'link',
      name: node.title || node.url,
      url: node.url,
      icon: '',
      meta: {
        add_date: node.dateAdded ? String(Math.floor(node.dateAdded / 1000)) : '',
      },
    }
  }

  return {
    id: node.id,
    type: 'folder',
    name: isRootChild ? normalizeChromeRootTitle(node) : node.title || '未命名文件夹',
    children: (node.children || []).map((child) => convertChromeBookmarkNode(child)),
    meta: {
      add_date: node.dateAdded ? String(Math.floor(node.dateAdded / 1000)) : '',
      last_modified: node.dateGroupModified
        ? String(Math.floor(node.dateGroupModified / 1000))
        : '',
    },
  }
}

export function chromeBookmarksToTree(chromeTree = []) {
  const browserRoot = chromeTree[0]
  return {
    id: browserRoot?.id || '0',
    type: 'folder',
    name: '公司书签',
    children: (browserRoot?.children || []).map((node) => convertChromeBookmarkNode(node, true)),
  }
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function serializeChromeBookmarkNode(node, depth) {
  const indent = '    '.repeat(depth)
  if (node.url) {
    const addDate = node.dateAdded ? ` ADD_DATE="${Math.floor(node.dateAdded / 1000)}"` : ''
    return `${indent}<DT><A HREF="${escapeHtml(node.url)}"${addDate}>${escapeHtml(node.title || node.url)}</A>`
  }

  const addDate = node.dateAdded ? ` ADD_DATE="${Math.floor(node.dateAdded / 1000)}"` : ''
  const lastModified = node.dateGroupModified
    ? ` LAST_MODIFIED="${Math.floor(node.dateGroupModified / 1000)}"`
    : ''
  const toolbarFlag = node.id === '1' ? ' PERSONAL_TOOLBAR_FOLDER="true"' : ''
  const title = normalizeChromeRootTitle(node)
  const children = (node.children || [])
    .map((child) => serializeChromeBookmarkNode(child, depth + 1))
    .join('\n')

  return [
    `${indent}<DT><H3${addDate}${lastModified}${toolbarFlag}>${escapeHtml(title)}</H3>`,
    `${indent}<DL><p>`,
    children,
    `${indent}</DL><p>`,
  ].filter(Boolean).join('\n')
}

export function serializeChromeBookmarks(chromeTree = []) {
  const children = (chromeTree[0]?.children || [])
    .map((node) => serializeChromeBookmarkNode(node, 1))
    .join('\n')

  return [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    '<TITLE>Bookmarks</TITLE>',
    '<H1>Bookmarks</H1>',
    '<DL><p>',
    children,
    '</DL><p>',
    '',
  ].join('\n')
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
  const names = ['其他书签', '所有书签', 'Other bookmarks', 'Other Bookmarks']
  const directOther = tree.children.find(
    (item) => item.type === 'folder' && names.includes(item.name),
  )
  if (directOther) {
    return {
      ...directOther,
      name: '所有书签',
    }
  }

  const bookmarkBarIndex = tree.children.findIndex(
    (item) => item.type === 'folder' && item.name === '书签栏',
  )
  if (bookmarkBarIndex === -1 || bookmarkBarIndex >= tree.children.length - 1) {
    return null
  }

  return {
    id: `other-${tree.children[bookmarkBarIndex].id}`,
    type: 'folder',
    name: '所有书签',
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
