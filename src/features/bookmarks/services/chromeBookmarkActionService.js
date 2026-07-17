async function getBookmarkById(bookmark) {
  if (!bookmark?.id) {
    return null
  }

  try {
    const [candidate] = await chrome.bookmarks.get(bookmark.id)
    if (bookmark.url) {
      return candidate?.url === bookmark.url ? candidate : null
    }
    return candidate && !candidate.url ? candidate : null
  } catch {
    return null
  }
}

async function getChromeRootFolder(bookmark) {
  if (!['所有书签', '其他书签', 'Other bookmarks', 'Other Bookmarks', '书签栏', 'Bookmarks bar'].includes(bookmark?.name)) {
    return null
  }
  const [root] = await chrome.bookmarks.getTree()
  return (root?.children || []).find((item) => {
    if (bookmark.name === '书签栏' || bookmark.name === 'Bookmarks bar') {
      return item.id === '1'
    }
    return item.id === '2'
      || ['其他书签', 'Other bookmarks', 'Other Bookmarks'].includes(item.title)
  }) || null
}

export async function resolveChromeBookmark(bookmark) {
  if (!bookmark) {
    throw new Error('未找到目标书签')
  }

  const directMatch = await getBookmarkById(bookmark)
  if (directMatch) {
    return directMatch
  }

  if (!bookmark.url) {
    const rootMatch = await getChromeRootFolder(bookmark)
    if (rootMatch) {
      return rootMatch
    }
  }

  const candidates = await chrome.bookmarks.search(bookmark.url
    ? { url: bookmark.url }
    : { title: bookmark.name })
  const folderCandidates = bookmark.url ? candidates : candidates.filter((item) => !item.url)
  const matches = bookmark.url ? candidates : folderCandidates
  if (matches.length === 1) {
    return matches[0]
  }

  const exactMatches = matches.filter((item) => item.title === bookmark.name)
  if (exactMatches.length === 1) {
    return exactMatches[0]
  }
  if (matches.length > 1) {
    throw new Error(bookmark.url
      ? '浏览器中存在多个相同网址的书签，请在书签管理器中操作'
      : '浏览器中存在多个同名文件夹，请在书签管理器中操作')
  }
  throw new Error('未在当前浏览器中找到目标书签，请先同步当前浏览器书签')
}

export async function updateChromeBookmark(bookmark, changes) {
  const target = await resolveChromeBookmark(bookmark)
  return chrome.bookmarks.update(target.id, changes)
}

export async function removeChromeBookmark(bookmark) {
  const target = await resolveChromeBookmark(bookmark)
  if (target.url) {
    await chrome.bookmarks.remove(target.id)
  } else {
    await chrome.bookmarks.removeTree(target.id)
  }
}

export async function createChromeBookmarkFolder(parentBookmark, title) {
  const parent = await resolveChromeBookmark(parentBookmark)
  if (parent.url) {
    throw new Error('只能在文件夹中创建子文件夹')
  }
  return chrome.bookmarks.create({ parentId: parent.id, title })
}

export async function openChromeBookmarkManager() {
  await chrome.tabs.create({ url: 'chrome://bookmarks/' })
}

export async function openBookmarkInNewTab(url) {
  await chrome.tabs.create({ url })
}
