import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { importLogoSvg, type ImportedLogo } from './logoSvgImport'
import logoMarkup from '../components/logo-reveal/logo-reveal.html?raw'
import wordmarkSrc from '../assets/brand/compomotion.svg'
import '../components/logo-reveal/LogoReveal.css'
import './LogoRevealDemo.css'

export function LogoRevealDemo({
  onMarkupChange,
}: {
  onMarkupChange?: (markup: string | null) => void
}) {
  const [replayKey, setReplayKey] = useState(0)
  const [duration, setDuration] = useState(1600)
  const [stagger, setStagger] = useState(120)
  const [customLogo, setCustomLogo] = useState<ImportedLogo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const sequence = useRef(0)
  useEffect(
    () => () => {
      sequence.current += 1
    },
    [],
  )
  async function changeLogo(file: File) {
    const request = ++sequence.current
    setError(null)
    setBusy(true)
    try {
      const result = await importLogoSvg(file)
      if (request !== sequence.current) return
      setCustomLogo(result)
      onMarkupChange?.(result.markup)
      setReplayKey((value) => value + 1)
    } catch (reason) {
      if (request === sequence.current)
        setError(
          reason instanceof Error
            ? reason.message
            : 'Couldn’t read this SVG. Try another file.',
        )
    } finally {
      if (request === sequence.current) setBusy(false)
    }
  }
  function resetLogo() {
    sequence.current += 1
    setBusy(false)
    setCustomLogo(null)
    onMarkupChange?.(null)
    setError(null)
    setReplayKey((value) => value + 1)
  }
  const timing = {
    '--logo-reveal-duration': `${duration}ms`,
    '--logo-reveal-stagger': `${stagger}ms`,
  } as CSSProperties

  return (
    <div className="logo-reveal-demo">
      <div className="logo-reveal-demo__canvas" style={timing}>
        {/* Local uploads are rebuilt by prepareLogoSvg before they reach this sink. */}
        <div
          key={`${replayKey}-${duration}-${stagger}`}
          className={`logo-reveal-demo__mark${customLogo ? ' logo-reveal-demo__mark--custom' : ''}`}
          dangerouslySetInnerHTML={{ __html: customLogo?.markup ?? logoMarkup }}
        />
        {!customLogo && <img src={wordmarkSrc} width="132" height="20" alt="" />}
      </div>
      <div className="logo-reveal-demo__import">
        <input
          ref={input}
          type="file"
          accept="image/svg+xml,.svg"
          className="demo__sr-only"
          tabIndex={-1}
          aria-label="Choose SVG file"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) void changeLogo(file)
          }}
        />
        <button type="button" onClick={() => input.current?.click()}>
          Change SVG
        </button>
        <span role="status">
          {busy ? 'Reading SVG…' : customLogo ? customLogo.label : ''}
        </span>
        {(customLogo || busy) && (
          <button type="button" onClick={resetLogo}>
            Use sample
          </button>
        )}
      </div>
      {error && (
        <p className="logo-reveal-demo__error" role="alert">
          {error}
        </p>
      )}
      <div className="logo-reveal-demo__controls">
        <label>
          Draw duration
          <select
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
          >
            <option value={1000}>1 s</option>
            <option value={1600}>1.6 s</option>
            <option value={2400}>2.4 s</option>
          </select>
        </label>
        <label>
          Stagger
          <select
            value={stagger}
            onChange={(event) => setStagger(Number(event.target.value))}
          >
            <option value={0}>Together</option>
            <option value={120}>Subtle</option>
            <option value={240}>Staggered</option>
          </select>
        </label>
        <button type="button" onClick={() => setReplayKey((value) => value + 1)}>
          Replay
        </button>
      </div>
    </div>
  )
}
