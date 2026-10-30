import { useEffect, useId, useState } from 'react'
import { CopyButton } from '../components/copy-button/CopyButton'
import type { DemoStudyId, SourceTechnology } from './demoPages'
import type { SourcePackage } from './source/sourcePackages'
import './StudySourcePanel.css'

export function StudySourcePanel({
  studyId,
  technology,
  logoMarkup,
}: {
  studyId: DemoStudyId
  technology: SourceTechnology
  logoMarkup?: string | null
}) {
  const [source, setSource] = useState<SourcePackage | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [selected, setSelected] = useState(0)
  const fileId = useId()
  useEffect(() => {
    let cancelled = false
    import('./source/sourcePackages')
      .then((module) => module.loadSourcePackage(studyId))
      .then((result) => {
        if (!cancelled) {
          setSource(result)
          setError(false)
        }
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [studyId, attempt])
  if (!source)
    return (
      <div className="study-source">
        <p role="status">
          {error ? 'Couldn’t load the source files.' : 'Loading source files…'}
        </p>
        {error && (
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>
            Try again
          </button>
        )}
      </div>
    )
  const extensions = {
    html: /\.(?:html|svg)$/,
    css: /\.css$/,
    javascript: /\.js$/,
    react: /\.[jt]sx?$|\.svg$/,
  }
  const originalLogo = source.files.find(
    (file) => file.name === 'logo-reveal.html',
  )?.content
  const files = source.files
    .filter((file) => extensions[technology].test(file.name))
    .map((file) => {
      if (studyId !== 'logo-reveal' || !logoMarkup || !originalLogo) return file
      if (file.name === 'logo-reveal.html') return { ...file, content: logoMarkup }
      if (file.name === 'usage.html')
        return { ...file, content: file.content.replace(originalLogo, logoMarkup) }
      return file
    })
  const file = files[selected] ?? files[0]
  if (!file) return <p role="status">No source file for this tab.</p>
  return (
    <section className="study-source" aria-label="Component source">
      <div className="study-source__filebar">
        <div>
          {files.length > 1 ? (
            <>
              <label className="demo__sr-only" htmlFor={fileId}>
                File
              </label>
              <select
                id={fileId}
                value={selected}
                onChange={(event) => setSelected(Number(event.target.value))}
              >
                {files.map((entry, index) => (
                  <option value={index} key={entry.name}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <span className="study-source__filename">{file.name}</span>
          )}
        </div>
        <CopyButton text={file.content} label="Copy code" />
      </div>
      <pre
        className="study-source__code"
        tabIndex={0}
        aria-label={`Source code: ${file.name}`}
      >
        <code>{file.content}</code>
      </pre>
    </section>
  )
}
