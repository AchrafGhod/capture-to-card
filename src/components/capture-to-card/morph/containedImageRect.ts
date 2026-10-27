/** Pixel rect in viewport coordinates. */
export type ViewRect = {
  left: number
  top: number
  width: number
  height: number
}

/**
 * Painted bounds of an `object-fit: contain` image inside its layout box.
 * Falls back to the element box when natural dimensions are not available.
 */
export function getContainedImageRect(img: HTMLImageElement): ViewRect {
  const box = img.getBoundingClientRect()
  const naturalWidth = img.naturalWidth
  const naturalHeight = img.naturalHeight

  if (!naturalWidth || !naturalHeight || box.width <= 0 || box.height <= 0) {
    return {
      left: box.left,
      top: box.top,
      width: box.width,
      height: box.height,
    }
  }

  const boxAspect = box.width / box.height
  const imageAspect = naturalWidth / naturalHeight

  let width = box.width
  let height = box.height

  if (imageAspect > boxAspect) {
    height = box.width / imageAspect
  } else {
    width = box.height * imageAspect
  }

  const left = box.left + (box.width - width) / 2
  const top = box.top + (box.height - height) / 2

  return { left, top, width, height }
}
