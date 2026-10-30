import { useState } from 'react'
import { PixelReveal } from '../components/pixel-reveal/PixelReveal'
import type { PixelRevealDirection } from '../components/pixel-reveal/pixelRevealGrid'
import landscapeSrc from '../assets/pixel-reveal-lake.webp'
import './PixelRevealDemo.css'

export function PixelRevealDemo() {
  const [replayKey, setReplayKey] = useState(0)
  const [pixelSize, setPixelSize] = useState(24)
  const [duration, setDuration] = useState(1200)
  const [direction, setDirection] = useState<PixelRevealDirection>('left-to-right')
  const [layerColor, setLayerColor] = useState('#111111')
  return (
    <div className="pixel-reveal-demo">
      <div className="pixel-reveal-demo__image">
        <PixelReveal
          src={landscapeSrc}
          alt="Alpine peaks and pine trees reflected in a calm lake"
          width={1199}
          height={675}
          pixelSize={pixelSize}
          duration={duration}
          direction={direction}
          layerColor={layerColor}
          replayKey={replayKey}
        />
      </div>
      <div className="pixel-reveal-demo__controls">
        <label>
          Pixel size
          <select
            value={pixelSize}
            onChange={(event) => setPixelSize(Number(event.target.value))}
          >
            <option value={16}>Small</option>
            <option value={24}>Medium</option>
            <option value={40}>Large</option>
          </select>
        </label>
        <label>
          Duration
          <select
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
          >
            <option value={800}>0.8 s</option>
            <option value={1200}>1.2 s</option>
            <option value={1800}>1.8 s</option>
          </select>
        </label>
        <label>
          Direction
          <select
            value={direction}
            onChange={(event) =>
              setDirection(event.target.value as PixelRevealDirection)
            }
          >
            <option value="left-to-right">Left to right</option>
            <option value="right-to-left">Right to left</option>
            <option value="top-to-bottom">Top to bottom</option>
            <option value="bottom-to-top">Bottom to top</option>
          </select>
        </label>
        <label>
          Pixel layer
          <select
            value={layerColor}
            onChange={(event) => setLayerColor(event.target.value)}
          >
            <option value="#111111">Black</option>
            <option value="#253a33">Forest green</option>
          </select>
        </label>
        <button type="button" onClick={() => setReplayKey((value) => value + 1)}>
          Replay
        </button>
      </div>
    </div>
  )
}
