import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  CaptureToCard,
  type CaptureToCardPresentation,
} from '../components/capture-to-card/CaptureToCard'
import type { CaptureToCardItem } from '../components/capture-to-card/captureToCardItem'
import {
  defaultCaptureToCardItem,
  demoCaptureSrc,
} from './demoDefaultItem'
import { DemoImport } from './DemoImport'
import {
  importLocalImageFile,
  revokeObjectUrlIfNeeded,
} from './localImageImport'
import './Demo.css'

export function Demo() {
  const fileInputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)
  const importSequenceRef = useRef(0)

  const [item, setItem] = useState<CaptureToCardItem>(defaultCaptureToCardItem)
  const [presentation, setPresentation] =
    useState<CaptureToCardPresentation>('source')
  const [sourceSelected, setSourceSelected] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importBusy, setImportBusy] = useState(false)

  const revokeCurrentObjectUrl = useCallback(() => {
    revokeObjectUrlIfNeeded(objectUrlRef.current, demoCaptureSrc)
    objectUrlRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      importSequenceRef.current += 1
      revokeCurrentObjectUrl()
    }
  }, [revokeCurrentObjectUrl])

  const togglePresentation = () => {
    setPresentation((current) => (current === 'source' ? 'card' : 'source'))
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const importId = importSequenceRef.current + 1
    importSequenceRef.current = importId
    setImportError(null)
    setImportBusy(true)

    const result = await importLocalImageFile(file)

    if (importSequenceRef.current !== importId) {
      if ('objectUrl' in result) {
        revokeObjectUrlIfNeeded(result.objectUrl, demoCaptureSrc)
      }
      return
    }

    setImportBusy(false)

    if ('error' in result) {
      setImportError(result.error)
      return
    }

    revokeCurrentObjectUrl()
    objectUrlRef.current = result.objectUrl
    setItem(result.item)
    setSourceSelected(true)
    setPresentation('source')
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  return (
    <main className="demo">
      <CaptureToCard
        presentation={presentation}
        item={item}
        sourceSelected={sourceSelected}
        onSourceSelect={() => setSourceSelected(true)}
        onPrimaryAction={togglePresentation}
        explorerAccessory={
          <DemoImport
            fileInputId={fileInputId}
            fileInputRef={fileInputRef}
            importBusy={importBusy}
            importError={importError}
            onFileChange={handleFileChange}
            onRetry={openFilePicker}
          />
        }
      />
    </main>
  )
}
