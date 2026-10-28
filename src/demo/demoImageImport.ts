import type { CaptureToCardItem } from '../components/capture-to-card/captureToCardItem'

const SUPPORTED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
])

const EXTENSION_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
}

export const MULTIPLE_FILES_MESSAGE = 'Choose one image at a time.'

export const UNSUPPORTED_IMAGE_MESSAGE =
  'That file is not a supported image. Use PNG, JPEG, GIF, WebP, or SVG.'

export const DECODE_FAILED_MESSAGE = 'This image could not be read. Try another file.'

export type LocalImageImportSuccess = {
  item: CaptureToCardItem
  objectUrl: string
}

export type LocalImageImportResult = LocalImageImportSuccess | { error: string }

export type ImageDecodePort = {
  readDimensions: (objectUrl: string) => Promise<{ width: number; height: number }>
  decode: (objectUrl: string) => Promise<void>
}

function resolveMimeType(file: File): string | null {
  if (SUPPORTED_MIME.has(file.type)) {
    return file.type
  }
  if (file.type && file.type !== 'application/octet-stream') {
    return null
  }
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext) return null
  const fromExt = EXTENSION_MIME[ext]
  return fromExt && SUPPORTED_MIME.has(fromExt) ? fromExt : null
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toLocaleString('en-US', { maximumFractionDigits: 1 })} KB`
  }
  return `${(bytes / (1024 * 1024)).toLocaleString('en-US', { maximumFractionDigits: 1 })} MB`
}

function formatLabelFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'image/webp': 'WebP',
    'image/svg+xml': 'SVG',
  }
  return map[mime] ?? mime.replace('image/', '').toUpperCase()
}

export function formatLastModified(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp))
}

export function buildCaptureToCardItemFromFile(
  file: File,
  objectUrl: string,
  mime: string,
  width: number,
  height: number,
): CaptureToCardItem {
  return {
    imageSrc: objectUrl,
    title: file.name,
    width,
    height,
    dimensionsLabel: `${width.toLocaleString('en-US')} × ${height.toLocaleString('en-US')}`,
    formatSizeLabel: `${formatLabelFromMime(mime)} · ${formatFileSize(file.size)}`,
    modifiedLabel: formatLastModified(file.lastModified),
  }
}

function decodeImageDimensions(
  objectUrl: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
    }
    img.onerror = () => reject(new Error('decode_failed'))
    img.src = objectUrl
  })
}

function imgDecode(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      if (typeof img.decode === 'function') {
        img
          .decode()
          .then(() => resolve())
          .catch(() => resolve())
      } else {
        resolve()
      }
    }
    img.onerror = () => reject(new Error('decode_failed'))
    img.src = src
  })
}

const browserImageDecode: ImageDecodePort = {
  readDimensions: decodeImageDimensions,
  decode: imgDecode,
}

export async function importLocalImageFile(
  file: File,
  decodePort: ImageDecodePort = browserImageDecode,
): Promise<LocalImageImportResult> {
  const mime = resolveMimeType(file)
  if (!mime) {
    return { error: UNSUPPORTED_IMAGE_MESSAGE }
  }

  const objectUrl = URL.createObjectURL(file)

  try {
    const { width, height } = await decodePort.readDimensions(objectUrl)
    if (width === 0 || height === 0) {
      URL.revokeObjectURL(objectUrl)
      return { error: UNSUPPORTED_IMAGE_MESSAGE }
    }

    await decodePort.decode(objectUrl)

    const item = buildCaptureToCardItemFromFile(file, objectUrl, mime, width, height)

    return { item, objectUrl }
  } catch {
    URL.revokeObjectURL(objectUrl)
    return { error: DECODE_FAILED_MESSAGE }
  }
}

export function revokeObjectUrlIfNeeded(url: string | null, bundledSrc: string) {
  if (url && url.startsWith('blob:') && url !== bundledSrc) {
    URL.revokeObjectURL(url)
  }
}
