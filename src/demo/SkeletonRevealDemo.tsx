import { useLayoutEffect, useRef, useState } from 'react'
import markup from '../components/skeleton-reveal/skeleton-reveal.html?raw'
import { mountSkeletonReveal } from '../components/skeleton-reveal/skeleton-reveal.js'
import imageSrc from '../assets/pixel-reveal-lake.webp'
import '../components/skeleton-reveal/SkeletonReveal.css'
import './SkeletonRevealDemo.css'

export function SkeletonRevealDemo() {
  const host = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [replay, setReplay] = useState(0)
  useLayoutEffect(() => {
    const root = host.current!.querySelector<HTMLElement>('.cm-skeleton')!
    const image = root.querySelector('img')!
    image.src = imageSrc
    image.alt = 'Alpine mountains reflected in a lake'
    const skeleton = mountSkeletonReveal(root, { auto: !loading })
    return () => skeleton.destroy()
  }, [loading, replay])
  return (
    <div className="skeleton-reveal-demo">
      <div
        ref={host}
        dangerouslySetInnerHTML={{
          __html: markup.replace('src="./image.svg"', `src="${imageSrc}"`),
        }}
      />
      <div className="skeleton-reveal-demo__controls">
        <button type="button" onClick={() => setLoading((value) => !value)}>
          {loading ? 'Reveal content' : 'Show skeleton'}
        </button>
        <button
          type="button"
          onClick={() => {
            setLoading(false)
            setReplay((value) => value + 1)
          }}
        >
          Replay
        </button>
      </div>
    </div>
  )
}
