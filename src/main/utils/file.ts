import * as fs from 'node:fs'
import { open, readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { loggerService } from '@logger'
import { MB } from '@shared/config/constant'
import { FileTypes } from '@shared/schema'
import { app } from 'electron'
import iconv from 'iconv-lite'
import * as jschardet from 'jschardet'

const logger = loggerService.withContext('Utils:File')

// 创建文件类型映射表，提高查找效率
const fileTypeMap = new Map<string, FileTypes>()

/**
 * Synchronously checks whether the current process has write permission for the given path.
 *
 * Attempts to access the path with write permission and returns true if accessible, false otherwise.
 *
 * @param path - Filesystem path to test for write access
 * @returns `true` if the path is writable by the current process; otherwise `false`
 */
export function hasWritePermission(path: string) {
  try {
    fs.accessSync(path, fs.constants.W_OK)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Map a file extension to a FileTypes value.
 *
 * The provided `ext` is normalized to lowercase before lookup (leading dot is accepted).
 *
 * @param ext - File extension to look up (e.g., '.txt' or 'txt')
 * @returns The matching FileTypes entry from the internal cache, or `'other'` if no mapping exists
 */
export function getFileType(ext: string): FileTypes {
  ext = ext.toLowerCase()
  return fileTypeMap.get(ext) || 'other'
}

/**
 * Returns the directory portion of a file system path.
 *
 * @param filePath - A file or directory path
 * @returns The parent directory path for `filePath`
 */
export function getFileDir(filePath: string) {
  return path.dirname(filePath)
}

export function getFileName(filePath: string) {
  return path.basename(filePath)
}

/**
 * Returns the extension of a file path.
 *
 * @param filePath - The path or filename to inspect.
 * @returns The file extension including the leading `.` (e.g. `.txt`), or an empty string if the path has no extension.
 */
export function getFileExt(filePath: string) {
  return path.extname(filePath)
}

/**
 * Returns the path to the CherryStudio temporary directory.
 *
 * The path is constructed by joining the Electron system temporary directory with "CherryStudio".
 *
 * @returns The full filesystem path for CherryStudio's temporary directory.
 */
export function getTempDir() {
  return path.join(app.getPath('temp'), 'CherryStudio')
}

export function getFilesDir() {
  return path.join(app.getPath('userData'), 'Data', 'Files')
}

export function getConfigDir() {
  return path.join(os.homedir(), '.cherrystudio', 'config')
}

export function getCacheDir() {
  return path.join(app.getPath('userData'), 'Cache')
}

export function getAppConfigDir(name: string) {
  return path.join(getConfigDir(), name)
}

export function getMcpDir() {
  return path.join(os.homedir(), '.cherrystudio', 'mcp')
}

/**
 * 读取文件内容并自动检测编码格式进行解码
 * @param filePath - 文件路径
 * @returns 解码后的文件内容
 */
export async function readTextFileWithAutoEncoding(filePath: string): Promise<string> {
  // 读取前1MB以检测编码
  const buffer = Buffer.alloc(1 * MB)
  const fh = await open(filePath, 'r')
  const { buffer: bufferRead } = await fh.read(buffer, 0, 1 * MB, 0)
  await fh.close()

  // 获取文件编码格式，最多取前两个可能的编码
  const encodings = jschardet
    .detectAll(bufferRead)
    .map((item) => ({
      ...item,
      encoding: item.encoding === 'ascii' ? 'UTF-8' : item.encoding
    }))
    .filter(
      (item, index, array) =>
        array.findIndex((prevItem) => prevItem.encoding === item.encoding) === index
    )
    .slice(0, 2)

  if (encodings.length === 0) {
    logger.error('Failed to detect encoding. Use utf-8 to decode.')
    const data = await readFile(filePath)
    return iconv.decode(data, 'UTF-8')
  }

  const data = await readFile(filePath)

  for (const item of encodings) {
    const encoding = item.encoding
    const content = iconv.decode(data, encoding)
    if (content.includes('\uFFFD')) {
      logger.error(
        `File ${filePath} was auto-detected as ${encoding} encoding, but contains invalid characters. Trying other encodings`
      )
    } else {
      return content
    }
  }

  logger.error(
    `File ${filePath} failed to decode with all possible encodings, trying UTF-8 encoding`
  )
  return iconv.decode(data, 'UTF-8')
}
