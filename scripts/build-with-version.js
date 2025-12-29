import {
  readFileSync,
  writeFileSync,
  renameSync,
  existsSync,
  rmSync,
  mkdirSync,
  createWriteStream,
} from 'fs'
import { execSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createInterface } from 'readline'
import archiver from 'archiver'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')

// 项目名称（根据需要修改）
const PROJECT_NAME = 'chrome-plugin-vue3'

/**
 * 从 package.json 中读取当前版本号
 */
function getCurrentVersion() {
  try {
    const packageJsonPath = resolve(rootDir, 'package.json')
    const content = readFileSync(packageJsonPath, 'utf-8')
    const json = JSON.parse(content)
    return json.version
  } catch (error) {
    console.error('✗ 读取当前版本号失败:', error.message)
    return null
  }
}

/**
 * 验证版本号格式 (语义化版本号: major.minor.patch)
 */
function validateVersion(version) {
  const versionRegex = /^\d+\.\d+\.\d+$/
  return versionRegex.test(version)
}

/**
 * 解析命令行参数，返回版本号、是否创建 ZIP 和是否为开发模式
 */
function parseArgs() {
  const args = process.argv.slice(2)
  let version = null
  let createZip = false
  let devMode = false

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    // 检查 --dev 参数
    if (arg === '--dev' || arg === '-dev') {
      devMode = true
      continue
    }

    // 检查 --zip 或 -zip 参数
    if (arg === '--zip' || arg === '-zip') {
      createZip = true
      continue
    }

    // 格式: 1.0.1 (直接传递版本号,最简洁)
    if (/^\d+\.\d+\.\d+$/.test(arg)) {
      version = arg
      continue
    }

    // 格式: --1.0.1 (兼容旧格式)
    if (arg.startsWith('--') && /^\d+\.\d+\.\d+/.test(arg.substring(2))) {
      version = arg.substring(2)
      continue
    }

    // 格式: -v 1.0.1 (兼容旧格式)
    if ((arg === '-v' || arg === '--version') && args[i + 1]) {
      version = args[i + 1]
      i++ // 跳过下一个参数
      continue
    }
  }

  return { version, createZip, devMode }
}

/**
 * 通过命令行交互获取版本号
 */
function promptForVersion(currentVersion) {
  return new Promise((resolvePromise) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    const promptText = `请输入版本号 (当前版本: ${currentVersion}，直接回车使用当前版本): `

    const askVersion = () => {
      rl.question(promptText, (answer) => {
        const trimmedAnswer = answer.trim()

        // 用户直接回车，使用当前版本号
        if (trimmedAnswer === '') {
          rl.close()
          resolvePromise(currentVersion)
          return
        }

        // 验证用户输入的版本号格式
        if (validateVersion(trimmedAnswer)) {
          rl.close()
          resolvePromise(trimmedAnswer)
        } else {
          console.log(
            '❌ 版本号格式无效，请使用语义化版本格式: major.minor.patch (例如: 1.0.1)'
          )
          askVersion() // 重新询问
        }
      })
    }

    askVersion()
  })
}

/**
 * 更新 JSON 文件中的版本号
 */
function updateJsonVersion(filePath, version) {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const json = JSON.parse(content)

    const oldVersion = json.version
    json.version = version

    // 保持原有的格式(2空格缩进)
    writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf-8')

    console.log(`✓ ${filePath}: ${oldVersion} → ${version}`)
    return true
  } catch (error) {
    console.error(`✗ 更新 ${filePath} 失败:`, error.message)
    return false
  }
}

/**
 * 执行 Vite 构建
 */
function runBuild() {
  try {
    console.log('\n📦 开始构建...')
    execSync('npm run build', { stdio: 'inherit', cwd: rootDir })
    console.log('✓ 构建完成\n')
    return true
  } catch (error) {
    console.error('✗ 构建失败:', error.message)
    return false
  }
}

/**
 * 重命名输出目录并移动到 output/ 目录下
 */
function renameOutputDir(version, devMode = false) {
  const viteBuildDir = resolve(rootDir, 'dist')
  const finalOutputDir = resolve(rootDir, 'output')
  const dirName = devMode ? `${PROJECT_NAME}_dev` : `${PROJECT_NAME}_v${version}`
  const targetDir = resolve(finalOutputDir, dirName)

  try {
    // 临时目录名（避免与 dist 冲突）
    const tempDir = resolve(rootDir, `${dirName}_temp`)

    // 如果临时目录已存在,先删除
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }

    // 先将 Vite 构建的 dist 目录重命名为临时目录
    renameSync(viteBuildDir, tempDir)

    // 确保最终的 output 目录存在
    if (!existsSync(finalOutputDir)) {
      mkdirSync(finalOutputDir, { recursive: true })
    }

    // 如果目标目录已存在,先删除
    if (existsSync(targetDir)) {
      console.log(`⚠ 目录 output/${dirName} 已存在,正在删除...`)
      rmSync(targetDir, { recursive: true, force: true })
    }

    // 移动临时目录到最终位置
    renameSync(tempDir, targetDir)
    console.log(`✓ 输出目录: output/${dirName}`)
    return targetDir
  } catch (error) {
    console.error('✗ 重命名目录失败:', error.message)
    return null
  }
}

/**
 * 直接从 dist 目录创建 ZIP 压缩包（用于 --zip 模式）
 */
function createZipArchiveFromDist(sourceDir, zipPath, version) {
  return new Promise((resolvePromise, reject) => {
    const output = createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', () => {
      const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2)
      console.log(
        `✓ ZIP 压缩包已创建: output/${PROJECT_NAME}_v${version}.zip (${sizeMB} MB)`
      )
      resolvePromise(zipPath)
    })

    archive.on('error', (err) => {
      console.error('✗ 创建 ZIP 失败:', err.message)
      reject(err)
    })

    archive.pipe(output)
    archive.directory(sourceDir, `${PROJECT_NAME}_v${version}`)
    archive.finalize()
  })
}

/**
 * 主函数
 */
async function main() {
  // 1. 解析命令行参数
  const { version: argVersion, createZip, devMode } = parseArgs()
  const currentVersion = getCurrentVersion()

  // 开发模式：跳过版本号更新，直接构建
  if (devMode) {
    console.log('🚀 开始开发模式构建流程\n')
    console.log(`📌 输出名称: ${PROJECT_NAME}_dev (固定名称，方便开发)\n`)

    // 执行构建
    if (!runBuild()) {
      console.error('❌ 构建失败,流程终止')
      process.exit(1)
    }

    // 重命名输出目录
    console.log('📁 重命名输出目录...')
    const targetDir = renameOutputDir('dev', true)
    if (!targetDir) {
      console.error('❌ 重命名失败,但构建文件仍在 dist 目录中')
      process.exit(1)
    }

    // 完成
    console.log('\n✅ 开发模式构建完成!')
    console.log(`📦 输出目录: output/${PROJECT_NAME}_dev`)
    console.log(`🎉 可以直接将 output/${PROJECT_NAME}_dev 文件夹加载到 Chrome 扩展中\n`)
    return
  }

  if (createZip) {
    console.log('🚀 开始版本化构建流程(含 ZIP 打包)\n')
  } else {
    console.log('🚀 开始版本化构建流程\n')
  }

  // 2. 获取版本号
  let version = argVersion

  if (!version) {
    // 没有提供命令行版本号参数，进入交互模式
    if (!currentVersion) {
      console.error('❌ 错误: 无法获取当前版本号')
      process.exit(1)
    }
    version = await promptForVersion(currentVersion)
  }

  if (!version) {
    console.error('❌ 错误: 无法获取版本号')
    console.log('\n使用方法:')
    console.log('  npm run bv              # 交互式输入版本号或使用当前版本号')
    console.log('  npm run bv -- 1.0.1     # 使用指定版本号构建')
    console.log('  npm run bv -- --zip     # 交互式输入版本号并创建 ZIP')
    console.log('  npm run bv -- 1.0.1 --zip  # 使用指定版本号构建并创建 ZIP')
    console.log(`  npm run bv:dev          # 开发模式构建，输出固定名称 ${PROJECT_NAME}_dev`)
    process.exit(1)
  }

  // 3. 验证版本号格式（命令行直接传入的版本号需要验证）
  if (!validateVersion(version)) {
    console.error(`❌ 错误: 版本号格式无效: ${version}`)
    console.log('版本号必须符合语义化版本格式: major.minor.patch (例如: 1.0.1)')
    process.exit(1)
  }

  console.log(`📌 目标版本: ${version}`)
  if (createZip) {
    console.log(`📦 创建 ZIP: 是\n`)
  } else {
    console.log('')
  }

  // 4. 更新版本号
  console.log('📝 更新版本号...')
  const packageJsonPath = resolve(rootDir, 'package.json')
  const manifestJsonPath = resolve(rootDir, 'manifest.json')

  const packageUpdated = updateJsonVersion(packageJsonPath, version)
  const manifestUpdated = updateJsonVersion(manifestJsonPath, version)

  if (!packageUpdated || !manifestUpdated) {
    console.error('\n❌ 版本号更新失败,构建终止')
    process.exit(1)
  }

  // 5. 执行构建
  if (!runBuild()) {
    console.error('❌ 构建失败,流程终止')
    process.exit(1)
  }

  // 6. 根据模式处理输出（互斥模式）
  if (createZip) {
    // --zip 模式：只生成 ZIP 压缩包，不创建目录
    console.log('\n🗜️  创建 ZIP 压缩包...')
    const viteBuildDir = resolve(rootDir, 'dist')
    const finalOutputDir = resolve(rootDir, 'output')

    // 确保 output 目录存在
    if (!existsSync(finalOutputDir)) {
      mkdirSync(finalOutputDir, { recursive: true })
    }

    const zipPath = resolve(finalOutputDir, `${PROJECT_NAME}_v${version}.zip`)

    // 如果 ZIP 文件已存在，先删除
    if (existsSync(zipPath)) {
      console.log(`⚠ ZIP 文件 ${PROJECT_NAME}_v${version}.zip 已存在,正在删除...`)
      rmSync(zipPath, { force: true })
    }

    try {
      await createZipArchiveFromDist(viteBuildDir, zipPath, version)
      // 清理 dist 目录
      rmSync(viteBuildDir, { recursive: true, force: true })
    } catch (error) {
      console.error('❌ ZIP 创建失败,但构建文件仍在 dist 目录中')
      process.exit(1)
    }

    // 完成
    console.log('\n✅ 版本化构建完成!')
    console.log(`📦 ZIP 文件: output/${PROJECT_NAME}_v${version}.zip`)
  } else {
    // 普通模式：只生成目录
    console.log('📁 重命名输出目录...')
    const targetDir = renameOutputDir(version, false)
    if (!targetDir) {
      console.error('❌ 重命名失败,但构建文件仍在 dist 目录中')
      process.exit(1)
    }

    // 完成
    console.log('\n✅ 版本化构建完成!')
    console.log(`📦 输出目录: output/${PROJECT_NAME}_v${version}`)
    console.log(
      `🎉 可以直接将 output/${PROJECT_NAME}_v${version} 文件夹加载到 Chrome 扩展中\n`
    )
  }
}

main()
