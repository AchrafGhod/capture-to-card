import { useLayoutEffect, useId, useRef, useState } from 'react'
import { pixelRevealGrid, type PixelRevealDirection } from './pixelRevealGrid'
import './PixelReveal.css'

export type PixelRevealProps = {
  src: string
  alt: string
  width?: number
  height?: number
  pixelSize?: number
  duration?: number
  direction?: PixelRevealDirection
  /** Color of the pixel wave that precedes the image. */
  layerColor?: string
  /** Change this value to replay; the component never loops on its own. */
  replayKey?: number
}

export function PixelReveal({
  src,
  alt,
  width,
  height,
  pixelSize = 24,
  duration = 1200,
  direction = 'left-to-right',
  layerColor = '#111111',
  replayKey = 0,
}: PixelRevealProps) {
  const maskId = `pixel-reveal-${useId().replace(/:/g, '')}`
  const imageRef = useRef<HTMLImageElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const maskRef = useRef<SVGMaskElement>(null)
  const layerRef = useRef<SVGSVGElement>(null)
  const [failedSource, setFailedSource] = useState<string | null>(null)

  useLayoutEffect(() => {
    const image = imageRef.current!
    const viewport = viewportRef.current!
    const mask = maskRef.current!
    const layer = layerRef.current!
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let disposed = false
    let generation = 0
    let animations: Animation[] = []
    let lastWidth = viewport.getBoundingClientRect().width
    const originalMask = viewport.style.maskImage

    const clear = () => {
      generation += 1
      viewport.style.maskImage = originalMask
      image.style.visibility = 'visible'
      for (const animation of animations) animation.cancel()
      animations = []
      mask.replaceChildren()
      layer.replaceChildren()
    }

    const reveal = async () => {
      clear()
      image.style.visibility = 'hidden'
      const run = generation
      try {
        await image.decode()
      } catch {
        if (!disposed && run === generation) image.style.visibility = 'visible'
        return // A failed source keeps the native alt text and error message.
      }
      if (disposed || run !== generation) return
      image.style.visibility = 'visible'
      if (preference.matches || !image.animate) return
      const bounds = viewport.getBoundingClientRect()
      if (!bounds.width || !bounds.height) return
      lastWidth = bounds.width
      const cells = pixelRevealGrid(
        bounds.width,
        bounds.height,
        pixelSize,
        direction,
        Math.floor(Math.random() * 0x7fffffff),
      )
      const total = Number.isFinite(duration) ? Math.max(100, duration) : 1200
      const step = Math.min(55, total * 0.1)
      const lead = total * 0.11
      const travel = total - lead - step
      const fragment = document.createDocumentFragment()
      const rects = cells.map((cell) => {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        rect.setAttribute('x', String(cell.x))
        rect.setAttribute('y', String(cell.y))
        // Tiny overlap avoids anti-alias seams; the mask is removed at completion.
        rect.setAttribute('width', String(cell.width + 0.0001))
        rect.setAttribute('height', String(cell.height + 0.0001))
        rect.setAttribute('fill', 'white')
        rect.setAttribute('shape-rendering', 'crispEdges')
        rect.style.opacity = '0'
        fragment.append(rect)
        return rect
      })
      mask.append(fragment)
      const layerRects = rects.map((rect) => {
        const colorRect = rect.cloneNode() as SVGRectElement
        colorRect.setAttribute('fill', layerColor)
        layer.append(colorRect)
        return colorRect
      })
      viewport.style.maskImage = `url("#${maskId}")`
      try {
        rects.forEach((rect, index) => {
          const delay = cells[index]!.delay * travel
          const fade = cells[index]!.fade
          const animation = layerRects[index]!.animate(
            [
              { opacity: 0, offset: 0 },
              { opacity: 0.35 + fade * 0.3, offset: 0.25 + fade * 0.35 },
              { opacity: 1, offset: 0.6 + fade * 0.3 },
              { opacity: 1, offset: 1 },
            ],
            {
              duration: lead + step,
              delay,
              easing: 'ease-out',
              fill: 'none',
            },
          )
          animations.push(animation)
          // Explicitly invalidate the viewport mask when its colored cell ends.
          // Composited SVG opacity animations can leave a cached mask paint behind.
          void animation.finished.then(
            () => {
              if (!disposed && run === generation) rect.style.opacity = '1'
            },
            () => {},
          )
        })
        // Keep the pixel mask fixed while the image gently settles inside it.
        animations.push(
          image.animate([{ transform: 'scale(1.06)' }, { transform: 'scale(1)' }], {
            duration: total,
            easing: 'cubic-bezier(0.2, 0.65, 0.3, 1)',
            fill: 'both',
          }),
        )
        await Promise.all(animations.map((animation) => animation.finished))
      } catch {
        // Cancellation is expected on replay, source changes and unmount.
      } finally {
        if (!disposed && run === generation) clear()
      }
    }

    const onLoad = () => {
      void reveal()
    }
    const onPreferenceChange = () => {
      if (preference.matches) clear()
    }
    image.style.visibility = 'hidden'
    image.addEventListener('load', onLoad)
    preference.addEventListener('change', onPreferenceChange)
    // Resize completes the current reveal instead of replaying during layout changes.
    const observer = new ResizeObserver(() => {
      const nextWidth = viewport.getBoundingClientRect().width
      if (Math.abs(nextWidth - lastWidth) > 1) {
        lastWidth = nextWidth
        clear()
      }
    })
    observer.observe(viewport)
    if (image.complete && image.naturalWidth > 0) void reveal()
    return () => {
      disposed = true
      clear()
      observer.disconnect()
      image.removeEventListener('load', onLoad)
      preference.removeEventListener('change', onPreferenceChange)
    }
  }, [src, pixelSize, duration, direction, layerColor, replayKey, maskId])

  return (
    <div className="pixel-reveal">
      <svg className="pixel-reveal__defs" aria-hidden="true" width="0" height="0">
        <defs>
          <mask
            ref={maskRef}
            id={maskId}
            maskUnits="objectBoundingBox"
            maskContentUnits="objectBoundingBox"
            x="0"
            y="0"
            width="1"
            height="1"
            style={{ maskType: 'luminance' }}
          />
        </defs>
      </svg>
      <div ref={viewportRef} className="pixel-reveal__viewport">
        <img
          ref={imageRef}
          className="pixel-reveal__image"
          src={src}
          alt={alt}
          width={width}
          height={height}
          onError={() => setFailedSource(src)}
          onLoad={() => setFailedSource(null)}
        />
      </div>
      <svg
        ref={layerRef}
        className="pixel-reveal__layer"
        aria-hidden="true"
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
      />
      {failedSource === src && <p role="alert">This image could not be loaded.</p>}
    </div>
  )
}
