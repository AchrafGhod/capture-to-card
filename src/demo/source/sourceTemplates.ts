import type { DemoStudyId } from '../demoPages'

export function reactExample(id: DemoStudyId): string {
  if (id === 'pixel-reveal')
    return `import { useState } from 'react'
import { PixelReveal } from './components/pixel-reveal/PixelReveal'
import sample from './assets/sample.svg'
import './example.css'

export function Example() {
  const [replayKey, setReplayKey] = useState(0)
  return <main>
    <PixelReveal src={sample} alt="Fictional sample page" width={1200} height={720} replayKey={replayKey} />
    <button type="button" onClick={() => setReplayKey(value => value + 1)}>Replay</button>
  </main>
}
`
  const grid = id === 'collection-insert'
  return `import { useEffect, useId, useRef, useState } from 'react'
import { CaptureToCard, type CaptureToCardItem, type CollectionCard } from './components/capture-to-card/CaptureToCard'
import type { MorphPresentation } from './components/capture-to-card/morph/useFileToCardMorph'
import { importLocalImageFile } from './integration/importImage'
import sample from './assets/sample.svg'
import './styles/tokens.css'
import './example.css'

const initial: CaptureToCardItem = {
  imageSrc: sample, title: 'sample.svg', width: 1200, height: 720,
  dimensionsLabel: '1,200 × 720', formatSizeLabel: 'SVG', modifiedLabel: 'Sample image',
}
const seed = [{ ...initial, id: 'seed' }]

export function Example() {
  const [item, setItem] = useState(initial)
  const [presentation, setPresentation] = useState<MorphPresentation>('${grid ? 'card' : 'preview'}')
  const [collection, setCollection] = useState<CollectionCard[]>(seed)
  const [locked, setLocked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const sequence = useRef(0)
  useEffect(() => {
    const url = item.imageSrc
    return () => { if (url.startsWith('blob:')) URL.revokeObjectURL(url) }
  }, [item.imageSrc])
  useEffect(() => () => { sequence.current += 1 }, [])

  async function changeImage(files: FileList) {
    if (files.length !== 1) { setError('Choose one image at a time.'); return }
    const request = ++sequence.current
    setBusy(true)
    setError(null)
    const result = await importLocalImageFile(files[0])
    if (request !== sequence.current) {
      if ('objectUrl' in result) URL.revokeObjectURL(result.objectUrl)
      return
    }
    setBusy(false)
    if ('error' in result) { setError(result.error); return }
    setItem(result.item)
    setPresentation('${grid ? 'card' : 'preview'}')
    setLocked(false)
  }

  function reset() {
    setPresentation('${grid ? 'card' : 'preview'}')
    setCollection(seed)
    setLocked(false)
  }

  return <main><CaptureToCard
    item={item} presentation={presentation} onPresentationChange={setPresentation}
    collectionItems={collection} createCardSessionLocked={locked}
    studyScene="${id}" showCollection={${grid}}
    onCellBuildComplete={() => setLocked(true)} onDemoReset={reset}
    ${
      grid
        ? `collectionInsert={{
      createItem: () => ({ ...item, id: 'inserted-card' }),
      onCommit: added => setCollection(previous => [added, ...previous]),
      onComplete: () => setLocked(true),
    }}`
        : ''
    }
    fileInputId={inputId} fileInputRef={input}
    onFileInputChange={event => {
      if (event.target.files?.length) void changeImage(event.target.files)
      event.target.value = ''
    }}
    onFilesDropped={files => void changeImage(files)}
    onImportRetry={() => input.current?.click()}
    importBusy={busy} importError={error}
  /></main>
}
`
}
