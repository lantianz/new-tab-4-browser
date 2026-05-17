import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')

const version = process.argv[2]

if (!version) {
  console.error('缺少版本号参数，例如: node scripts/extract-release-notes.js 1.0.1')
  process.exit(1)
}

const changelogPath = resolve(rootDir, 'CHANGELOG.md')
const content = readFileSync(changelogPath, 'utf-8')
const normalized = content.replace(/\r\n/g, '\n')

const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const sectionPattern = new RegExp(`^##\\s+${escapedVersion}\\s+-.*$`, 'm')
const sectionMatch = normalized.match(sectionPattern)

if (!sectionMatch || sectionMatch.index == null) {
  console.error(`在 CHANGELOG.md 中未找到版本 ${version} 的发布说明`)
  process.exit(1)
}

const startIndex = sectionMatch.index
const rest = normalized.slice(startIndex)
const nextSectionMatch = rest.slice(sectionMatch[0].length).match(/\n##\s+\d+\.\d+\.\d+\s+-/m)
const endIndex = nextSectionMatch ? startIndex + sectionMatch[0].length + nextSectionMatch.index + 1 : normalized.length
const notes = normalized.slice(startIndex, endIndex).trim()

process.stdout.write(notes)
