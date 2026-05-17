export async function getChromeLocal(keys) {
  return chrome.storage.local.get(keys)
}

export async function setChromeLocal(payload) {
  return chrome.storage.local.set(payload)
}

export async function sendChromeMessage(message) {
  return chrome.runtime.sendMessage(message)
}
