import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DECODE_FAILED_MESSAGE,
  UNSUPPORTED_IMAGE_MESSAGE,
  buildCaptureToCardItemFromFile,
  formatLastModified,
  importLocalImageFile,
  revokeObjectUrlIfNeeded,
  type ImageDecodePort,
} from './localImageImport'

describe('buildCaptureToCardItemFromFile', () => {
  it('maps file fields onto the card item', () => {
    const lastModified = Date.UTC(2024, 5, 15, 14, 30)
    const file = new File(['pixels'], 'holiday-photo.jpg', {
      type: 'image/jpeg',
      lastModified,
    })

    const item = buildCaptureToCardItemFromFile(
      file,
      'blob:preview',
      'image/jpeg',
      800,
      1200,
    )

    expect(item.title).toBe('holiday-photo.jpg')
    expect(item.imageSrc).toBe('blob:preview')
    expect(item.dimensionsLabel).toBe('800 × 1,200')
    expect(item.formatSizeLabel).toContain('JPEG')
    expect(item.modifiedLabel).toBe(formatLastModified(lastModified))
  })

  it('uses lastModified, not an invented creation date', () => {
    const modified = Date.UTC(2023, 0, 2, 9, 0)
    const file = new File(['x'], 'a.png', { type: 'image/png', lastModified: modified })
    const item = buildCaptureToCardItemFromFile(file, 'blob:x', 'image/png', 10, 10)
    expect(item.modifiedLabel).toBe(formatLastModified(modified))
    expect(item.modifiedLabel).not.toBe(formatLastModified(Date.now()))
  })
})

describe('revokeObjectUrlIfNeeded', () => {
  it('revokes blob URLs but not bundled asset paths', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    revokeObjectUrlIfNeeded('blob:abc', '/demo.svg')
    revokeObjectUrlIfNeeded('/demo.svg', '/demo.svg')
    revokeObjectUrlIfNeeded(null, '/demo.svg')

    expect(revoke).toHaveBeenCalledTimes(1)
    expect(revoke).toHaveBeenCalledWith('blob:abc')
    revoke.mockRestore()
  })
})

describe('importLocalImageFile', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('rejects unsupported file types', async () => {
    const file = new File(['text'], 'notes.txt', { type: 'text/plain' })
    const result = await importLocalImageFile(file)
    expect(result).toEqual({ error: UNSUPPORTED_IMAGE_MESSAGE })
  })

  it('does not treat a .png name as valid when the MIME type is not an image', async () => {
    const file = new File(['text'], 'photo.png', { type: 'text/plain' })
    const result = await importLocalImageFile(file)
    expect(result).toEqual({ error: UNSUPPORTED_IMAGE_MESSAGE })
  })

  it('decodes a missing MIME type from a known image extension', async () => {
    const passingPort: ImageDecodePort = {
      readDimensions: () => Promise.resolve({ width: 12, height: 8 }),
      decode: () => Promise.resolve(),
    }
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:empty-type')

    const file = new File(['pixels'], 'shot.png', { type: '' })
    const result = await importLocalImageFile(file, passingPort)

    expect(result).toMatchObject({
      objectUrl: 'blob:empty-type',
      item: { title: 'shot.png', width: 12, height: 8 },
    })
  })

  it('rejects a zero-dimension decode and revokes the object URL', async () => {
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:empty')
    const revokeObjectURL = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {})
    const emptyPort: ImageDecodePort = {
      readDimensions: () => Promise.resolve({ width: 0, height: 0 }),
      decode: () => Promise.resolve(),
    }

    const file = new File(['x'], 'empty.png', { type: 'image/png' })
    const result = await importLocalImageFile(file, emptyPort)

    expect(result).toEqual({ error: UNSUPPORTED_IMAGE_MESSAGE })
    expect(createObjectURL).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:empty')
  })

  it('surfaces decode failures and revokes the object URL', async () => {
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:broken')
    const revokeObjectURL = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {})

    const failingPort: ImageDecodePort = {
      readDimensions: () => Promise.reject(new Error('decode_failed')),
      decode: () => Promise.resolve(),
    }

    const file = new File(['bad'], 'broken.png', { type: 'image/png' })
    const result = await importLocalImageFile(file, failingPort)

    expect(result).toEqual({ error: DECODE_FAILED_MESSAGE })
    expect(createObjectURL).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:broken')

    createObjectURL.mockRestore()
    revokeObjectURL.mockRestore()
  })
})
