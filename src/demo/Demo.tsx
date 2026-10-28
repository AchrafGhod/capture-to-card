import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { CaptureToCard } from '../components/capture-to-card/CaptureToCard'
import type { CaptureToCardItem } from '../components/capture-to-card/captureToCardItem'
import type { MorphPresentation } from '../components/capture-to-card/morph/useFileToCardMorph'
import { itemMorphKey } from '../components/capture-to-card/morph/itemMorphKey'
import {
  cloneDemoCollectionSeed,
  createSessionCollectionItem,
  type DemoCollectionItem,
} from './demoCollection'
import { defaultCaptureToCardItem, demoCaptureSrc } from './demoDefaultItem'
import {
  demoDocsCopy,
  demoHeaderNav,
  demoProductName,
  demoStudies,
  getDemoStudy,
  headerPageFor,
  isStudyPage,
  type DemoPageId,
  type DemoStudyId,
} from './demoPages'
import {
  importLocalImageFile,
  MULTIPLE_FILES_MESSAGE,
  revokeObjectUrlIfNeeded,
} from './demoImageImport'
import './Demo.css'

function collectReferencedBlobUrls(
  sourceItem: CaptureToCardItem,
  collection: DemoCollectionItem[],
): Set<string> {
  const urls = new Set<string>()
  if (sourceItem.imageSrc.startsWith('blob:')) {
    urls.add(sourceItem.imageSrc)
  }
  for (const entry of collection) {
    if (entry.imageSrc.startsWith('blob:')) {
      urls.add(entry.imageSrc)
    }
  }
  return urls
}

function revokeUnreferencedBlobs(
  previousUrls: Set<string>,
  nextReferenced: Set<string>,
) {
  for (const url of previousUrls) {
    if (!nextReferenced.has(url)) {
      revokeObjectUrlIfNeeded(url, demoCaptureSrc)
    }
  }
}

function presentationForStudy(studyId: DemoStudyId): MorphPresentation {
  return studyId === 'collection-insert' ? 'card' : 'preview'
}

export function Demo() {
  const fileInputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)
  const importSequenceRef = useRef(0)
  const sessionInsertKeyRef = useRef(0)

  const [activePageId, setActivePageId] = useState<DemoPageId>('library')
  const activeStudyId: DemoStudyId = isStudyPage(activePageId)
    ? activePageId
    : 'file-to-card'
  const activeStudy = getDemoStudy(activeStudyId)
  const isCellReveal = activeStudyId === 'file-to-card'

  const [item, setItem] = useState<CaptureToCardItem>(defaultCaptureToCardItem)
  const [collectionItems, setCollectionItems] = useState(cloneDemoCollectionSeed)
  const [presentation, setPresentation] = useState<MorphPresentation>('preview')
  const [createCardSessionLocked, setCreateCardSessionLocked] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importBusy, setImportBusy] = useState(false)
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null)

  const revokeCurrentObjectUrl = useCallback(() => {
    revokeObjectUrlIfNeeded(objectUrlRef.current, demoCaptureSrc)
    objectUrlRef.current = null
  }, [])

  const itemRef = useRef(item)
  const collectionItemsRef = useRef(collectionItems)
  itemRef.current = item
  collectionItemsRef.current = collectionItems

  useEffect(() => {
    return () => {
      importSequenceRef.current += 1
      revokeObjectUrlIfNeeded(objectUrlRef.current, demoCaptureSrc)
      objectUrlRef.current = null
      const blobs = collectReferencedBlobUrls(
        itemRef.current,
        collectionItemsRef.current,
      )
      for (const url of blobs) {
        revokeObjectUrlIfNeeded(url, demoCaptureSrc)
      }
    }
  }, [])

  const resetStudyRun = useCallback(
    (studyId: DemoStudyId = activeStudyId) => {
      const previousReferenced = collectReferencedBlobUrls(item, collectionItems)
      const nextCollection = cloneDemoCollectionSeed()
      const nextReferenced = collectReferencedBlobUrls(item, nextCollection)
      revokeUnreferencedBlobs(previousReferenced, nextReferenced)
      setCollectionItems(nextCollection)
      setCreateCardSessionLocked(false)
      setPresentation(presentationForStudy(studyId))
      setImportStatusMessage(null)
      sessionInsertKeyRef.current += 1
    },
    [activeStudyId, collectionItems, item],
  )

  const handlePageChange = (nextPageId: DemoPageId) => {
    if (nextPageId === activePageId) return
    if (isStudyPage(nextPageId)) {
      resetStudyRun(nextPageId)
    }
    setActivePageId(nextPageId)
  }

  const beginImport = async (file: File) => {
    const importId = importSequenceRef.current + 1
    importSequenceRef.current = importId
    setImportError(null)
    setImportStatusMessage(null)
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

    const previousReferenced = collectReferencedBlobUrls(item, collectionItems)
    revokeCurrentObjectUrl()
    objectUrlRef.current = result.objectUrl

    const nextItem = result.item
    const nextReferenced = collectReferencedBlobUrls(nextItem, collectionItems)
    revokeUnreferencedBlobs(previousReferenced, nextReferenced)

    setItem(nextItem)
    setPresentation(presentationForStudy(activeStudyId))
    setImportStatusMessage('Image updated.')
  }

  const handleFiles = (files: FileList) => {
    if (files.length > 1) {
      setImportError(MULTIPLE_FILES_MESSAGE)
      setImportStatusMessage(null)
      return
    }
    void beginImport(files[0]!)
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    await beginImport(file)
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handlePresentationChange = useCallback((next: MorphPresentation) => {
    setPresentation(next)
  }, [])

  const handleDemoReset = useCallback(() => {
    resetStudyRun(activeStudyId)
  }, [activeStudyId, resetStudyRun])

  const collectionInsert = useMemo(
    () =>
      activeStudyId === 'collection-insert'
        ? {
            createItem: () => {
              const key = `${sessionInsertKeyRef.current}-${itemMorphKey(item)}`
              return createSessionCollectionItem(item, key)
            },
            onCommit: (insertItem: DemoCollectionItem) => {
              setCollectionItems((previous) => [insertItem, ...previous])
            },
            onComplete: () => {
              setCreateCardSessionLocked(true)
              setImportStatusMessage('Card added to collection.')
            },
          }
        : undefined,
    [activeStudyId, item],
  )

  const handleCellBuildComplete = useCallback(() => {
    if (activeStudyId !== 'file-to-card') return
    setCreateCardSessionLocked(true)
    setImportStatusMessage('Card built in the build frame.')
  }, [activeStudyId])

  const studySlug = activeStudy.slug.replace(/-/g, ' ')
  const headerCurrent = headerPageFor(activePageId)

  return (
    <div className="demo">
      <div className="demo__frame">
        <header className="demo__bar">
          <button
            type="button"
            className="demo__brand"
            onClick={() => handlePageChange('library')}
          >
            {demoProductName}
          </button>
          <nav className="demo__bar-nav" aria-label="Site">
            {demoHeaderNav.map((item) => {
              const isCurrent = item.id === headerCurrent
              return (
                <button
                  key={item.id}
                  type="button"
                  className={
                    isCurrent
                      ? 'demo__bar-link demo__bar-link--current'
                      : 'demo__bar-link'
                  }
                  aria-current={isCurrent ? 'page' : undefined}
                  onClick={() => handlePageChange(item.id)}
                >
                  {item.title}
                </button>
              )
            })}
          </nav>
        </header>

        {activePageId === 'library' ? (
          <LibraryPage onOpenStudy={handlePageChange} />
        ) : activePageId === 'docs' ? (
          <DocsPage onBack={() => handlePageChange('library')} />
        ) : (
          <main className="demo__main">
            <article
              className="demo__page demo__page--stage"
              aria-labelledby={`study-${activeStudy.slug}`}
            >
              <div className="demo__crumb">
                <BackButton onBack={() => handlePageChange('library')} />
                <StudyArrows studyId={activeStudyId} onOpenStudy={handlePageChange} />
              </div>
              <h1 id={`study-${activeStudy.slug}`} className="demo__title">
                {activeStudy.title}
              </h1>
              <p className="demo__lede">{activeStudy.tagline}</p>
              <div className="demo__toolbar">
                <StudyViewTabs />
              </div>
              <div
                className="demo__stage"
                role="region"
                aria-label="Interactive preview"
              >
                <CaptureToCard
                  key={activeStudyId}
                  item={item}
                  presentation={presentation}
                  onPresentationChange={handlePresentationChange}
                  collectionItems={collectionItems}
                  createCardSessionLocked={createCardSessionLocked}
                  studyScene={activeStudyId}
                  collectionInsert={collectionInsert}
                  onCellBuildComplete={
                    isCellReveal ? handleCellBuildComplete : undefined
                  }
                  showCollection={!isCellReveal}
                  sceneAriaLabel={`${activeStudy.title} — ${studySlug} interactive scene`}
                  onDemoReset={handleDemoReset}
                  importBusy={importBusy}
                  importError={importError}
                  importStatusMessage={importStatusMessage}
                  fileInputId={fileInputId}
                  fileInputRef={fileInputRef}
                  onFileInputChange={handleFileChange}
                  onFilesDropped={handleFiles}
                  onImportRetry={openFilePicker}
                />
              </div>
            </article>
          </main>
        )}
      </div>
    </div>
  )
}

function LibraryPage({ onOpenStudy }: { onOpenStudy: (id: DemoStudyId) => void }) {
  return (
    <main className="demo__catalog">
      <h1 className="demo__catalog-title">Library</h1>
      <div className="demo__chips">
        <span className="demo__chip demo__chip--current">All</span>
      </div>
      <ul className="demo__tiles">
        {demoStudies.map((study) => (
          <li key={study.id}>
            <button
              type="button"
              className="demo__tile"
              aria-label={study.title}
              onClick={() => onOpenStudy(study.id)}
            >
              <div
                className="demo__tile-preview"
                data-sketch={study.id}
                aria-hidden="true"
              >
                <span className="demo__sketch-a" />
                <span className="demo__sketch-b" />
              </div>
              <span className="demo__tile-title">{study.title}</span>
              <span className="demo__tile-copy">{study.tagline}</span>
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}

function DocsPage({ onBack }: { onBack: () => void }) {
  return (
    <main className="demo__docs">
      <article className="demo__page" aria-labelledby="demo-page-title">
        <BackButton onBack={onBack} />
        <h1 id="demo-page-title" className="demo__title">
          {demoDocsCopy.title}
        </h1>
        {demoDocsCopy.sections.map((section) => (
          <section key={section.heading} className="demo__report">
            <h2 className="demo__report-heading">{section.heading}</h2>
            <div className="demo__prose">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </article>
    </main>
  )
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button type="button" className="demo__back" onClick={onBack}>
      <Chevron direction="left" />
      Back
    </button>
  )
}

function StudyArrows({
  studyId,
  onOpenStudy,
}: {
  studyId: DemoStudyId
  onOpenStudy: (id: DemoStudyId) => void
}) {
  const index = demoStudies.findIndex((study) => study.id === studyId)
  const prev = index > 0 ? demoStudies[index - 1] : null
  const next =
    index >= 0 && index < demoStudies.length - 1 ? demoStudies[index + 1] : null

  return (
    <div className="demo__arrows">
      <button
        type="button"
        className="demo__arrow"
        disabled={!prev}
        aria-label={prev ? `Previous: ${prev.title}` : 'Previous study'}
        onClick={() => prev && onOpenStudy(prev.id)}
      >
        <Chevron direction="left" />
      </button>
      <button
        type="button"
        className="demo__arrow"
        disabled={!next}
        aria-label={next ? `Next: ${next.title}` : 'Next study'}
        onClick={() => next && onOpenStudy(next.id)}
      >
        <Chevron direction="right" />
      </button>
    </div>
  )
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      className="demo__chevron"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
    >
      {direction === 'left' ? (
        <path
          d="M10.5 3.5 6 8l4.5 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M5.5 3.5 10 8 5.5 12.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

function StudyViewTabs() {
  return (
    <div className="demo__view-switch" role="tablist" aria-label="Study view">
      <button
        type="button"
        className="demo__view-tab demo__view-tab--active"
        role="tab"
        aria-selected="true"
      >
        Preview
      </button>
      <button
        type="button"
        className="demo__view-tab"
        role="tab"
        aria-selected="false"
        disabled
        title="Not available yet"
      >
        CSS
      </button>
      <button
        type="button"
        className="demo__view-tab"
        role="tab"
        aria-selected="false"
        disabled
        title="Not available yet"
      >
        React
      </button>
    </div>
  )
}
