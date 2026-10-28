import { useLayoutEffect, useRef, type CSSProperties, type RefObject } from 'react'
import type { CaptureToCardItem } from './captureToCardItem'
import { itemMorphKey } from './morph/itemMorphKey'
import { layoutMediaDotField, mountMatrixLoader } from './morph/mountMatrixDots'
import type {
  CollectionInsertConfig,
  MorphPresentation,
  MorphStudyScene,
} from './morph/useFileToCardMorph'
import { useFileToCardMorph } from './morph/useFileToCardMorph'
import { useImageDropZone } from './useImageDropZone'
import './cell-build.css'
import './CaptureToCard.css'

export type { CaptureToCardItem } from './captureToCardItem'

export type CollectionCard = CaptureToCardItem & { id: string }

export type CaptureToCardProps = {
  item: CaptureToCardItem
  presentation: MorphPresentation
  onPresentationChange: (next: MorphPresentation) => void
  collectionItems: CollectionCard[]
  createCardSessionLocked: boolean
  collectionInsert?: CollectionInsertConfig
  onCellBuildComplete?: () => void
  showCollection?: boolean
  studyScene?: MorphStudyScene
  sceneAriaLabel?: string
  onDemoReset?: () => void
  importBusy?: boolean
  importError?: string | null
  fileInputId: string
  fileInputRef: RefObject<HTMLInputElement | null>
  onFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onFilesDropped: (files: FileList) => void
  onImportRetry?: () => void
  importStatusMessage?: string | null
}

function MatrixSkeleton({
  className,
  dotCols = 4,
  dotRows = 4,
  children,
}: {
  className?: string
  dotCols?: number
  dotRows?: number
  children: React.ReactNode
}) {
  const matrixRef = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const node = matrixRef.current
    if (node) mountMatrixLoader(node, dotCols, dotRows)
  }, [dotCols, dotRows])

  return (
    <span className={['ctc-build', className].filter(Boolean).join(' ')}>
      <span className="ctc-build__dots" aria-hidden="true">
        <span ref={matrixRef} className="ctc-dot-grid" />
      </span>
      <span className="ctc-build__text">{children}</span>
    </span>
  )
}

export function CaptureToCard({
  item,
  presentation,
  onPresentationChange,
  collectionItems,
  createCardSessionLocked,
  collectionInsert,
  onCellBuildComplete,
  showCollection = true,
  studyScene = 'file-to-card',
  sceneAriaLabel = 'Interactive motion study scene',
  onDemoReset,
  importBusy = false,
  importError = null,
  fileInputId,
  fileInputRef,
  onFileInputChange,
  onFilesDropped,
  onImportRetry,
  importStatusMessage = null,
}: CaptureToCardProps) {
  const isCellRevealStudy = studyScene === 'file-to-card'

  const {
    morphRefs,
    morphPhase,
    isMorphing,
    showDestinationLayer,
    showEmptyBuildSlot,
    showCardSurface,
    destinationLayerInert,
    collectionLayerInert,
    requestForwardMorph,
    requestCollectionInsertOnly,
    requestResetDemo,
  } = useFileToCardMorph({
    presentation,
    imageSrc: item.imageSrc,
    morphItemKey: itemMorphKey(item),
    onPresentationChange,
    createCardSessionLocked,
    studyScene,
    collectionInsert,
    onCellBuildComplete,
  })

  const {
    stageRef,
    previewRowRef,
    destinationLayerRef,
    collectionGridRef,
    cardShellRef,
    cardMediaRef,
    cardImageRef,
    cardTitleRef,
    cardDetailsRef,
  } = morphRefs

  const mediaDotsRef = useRef<HTMLDivElement>(null)

  const cardItem = item
  const useMatrixBuildSlots = isCellRevealStudy

  useLayoutEffect(() => {
    if (!useMatrixBuildSlots) return
    const dots = mediaDotsRef.current
    const media = cardMediaRef.current
    const image = cardImageRef.current
    if (!dots || !media || !image) return

    const sync = () => layoutMediaDotField(media, dots, image)
    sync()

    const onLoad = () => sync()
    if (!image.complete) {
      image.addEventListener('load', onLoad, { once: true })
    }

    const observer = new ResizeObserver(sync)
    observer.observe(media)

    return () => {
      observer.disconnect()
      image.removeEventListener('load', onLoad)
    }
  }, [cardItem.width, cardItem.height, cardItem.imageSrc, useMatrixBuildSlots])

  const dropZone = useImageDropZone(
    previewRowRef,
    isCellRevealStudy ? onFilesDropped : () => {},
  )

  const aspectStyle = {
    '--ctc-item-aspect': `${cardItem.width} / ${cardItem.height}`,
  } as CSSProperties

  const liveStatus = importError
    ? null
    : importBusy
      ? 'Reading your image…'
      : importStatusMessage

  const showAnimate =
    isCellRevealStudy &&
    presentation === 'preview' &&
    !isMorphing &&
    !importBusy &&
    !createCardSessionLocked
  const showInsertIntoCollection =
    studyScene === 'collection-insert' &&
    presentation === 'card' &&
    !isMorphing &&
    !importBusy &&
    !createCardSessionLocked &&
    collectionInsert != null
  const showResetDemo = createCardSessionLocked && !isMorphing

  const cardHiddenForMeasure = showEmptyBuildSlot

  const handleResetDemo = () => {
    requestResetDemo()
    onDemoReset?.()
  }

  return (
    <section
      className="capture-to-card"
      aria-label={sceneAriaLabel}
      data-morphing={isMorphing || undefined}
      data-presentation={presentation}
      data-study-scene={studyScene}
      data-morph-phase={morphPhase !== 'idle' ? morphPhase : undefined}
      style={aspectStyle}
    >
      <div ref={stageRef} className="capture-to-card__stage">
        <div className="capture-to-card__stage-stack">
          <div className="capture-to-card__right-column">
            {showDestinationLayer ? (
              <div
                ref={destinationLayerRef}
                className="capture-to-card__destination"
                aria-hidden={destinationLayerInert}
                inert={destinationLayerInert}
              >
                <p
                  className={[
                    'capture-to-card__zone-label',
                    isCellRevealStudy ? 'capture-to-card__sr-only' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  Build
                </p>

                <div
                  ref={isCellRevealStudy ? previewRowRef : undefined}
                  className={[
                    'capture-to-card__build-frame',
                    isCellRevealStudy ? 'capture-to-card__build-frame--in-place' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  data-image-drop-zone={isCellRevealStudy ? '' : undefined}
                  data-drag-over={
                    isCellRevealStudy && dropZone.dragOver ? true : undefined
                  }
                  data-busy={isCellRevealStudy && importBusy ? true : undefined}
                  onDragEnter={isCellRevealStudy ? dropZone.onDragEnter : undefined}
                  onDragLeave={isCellRevealStudy ? dropZone.onDragLeave : undefined}
                  onDragOver={isCellRevealStudy ? dropZone.onDragOver : undefined}
                  onDrop={isCellRevealStudy ? dropZone.onDrop : undefined}
                >
                  {showEmptyBuildSlot ? (
                    <div className="capture-to-card__build-empty" aria-hidden="true">
                      <span className="capture-to-card__build-empty-label">
                        Card will build here
                      </span>
                    </div>
                  ) : null}

                  <article
                    ref={cardShellRef}
                    className={[
                      'capture-to-card__card',
                      cardHiddenForMeasure ? 'capture-to-card__card--prebuild' : '',
                      showCardSurface ? 'capture-to-card__card--visible' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-hidden={cardHiddenForMeasure ? true : undefined}
                  >
                    <div ref={cardMediaRef} className="capture-to-card__card-media">
                      {useMatrixBuildSlots ? (
                        <div
                          ref={mediaDotsRef}
                          className="capture-to-card__media-dot-field"
                          aria-hidden="true"
                        />
                      ) : null}
                      <img
                        ref={cardImageRef}
                        className="capture-to-card__card-image"
                        src={cardItem.imageSrc}
                        alt=""
                        width={cardItem.width}
                        height={cardItem.height}
                        decoding="async"
                      />
                    </div>
                    <div className="capture-to-card__card-body">
                      <h2
                        ref={cardTitleRef}
                        className="capture-to-card__card-title"
                        title={cardItem.title}
                      >
                        {useMatrixBuildSlots ? (
                          <MatrixSkeleton
                            className="ctc-build--title"
                            dotCols={18}
                            dotRows={3}
                          >
                            <span className="capture-to-card__card-title-text">
                              {cardItem.title}
                            </span>
                          </MatrixSkeleton>
                        ) : (
                          <span className="capture-to-card__card-title-text">
                            {cardItem.title}
                          </span>
                        )}
                      </h2>
                      <dl
                        ref={cardDetailsRef}
                        className="capture-to-card__card-details"
                      >
                        <div className="capture-to-card__card-detail">
                          <dt>Dimensions</dt>
                          <dd>
                            {useMatrixBuildSlots ? (
                              <MatrixSkeleton
                                className="ctc-build--detail"
                                dotCols={14}
                                dotRows={2}
                              >
                                {cardItem.dimensionsLabel}
                              </MatrixSkeleton>
                            ) : (
                              cardItem.dimensionsLabel
                            )}
                          </dd>
                        </div>
                        <div className="capture-to-card__card-detail">
                          <dt>Format · size</dt>
                          <dd>
                            {useMatrixBuildSlots ? (
                              <MatrixSkeleton
                                className="ctc-build--detail"
                                dotCols={14}
                                dotRows={2}
                              >
                                {cardItem.formatSizeLabel}
                              </MatrixSkeleton>
                            ) : (
                              cardItem.formatSizeLabel
                            )}
                          </dd>
                        </div>
                        <div className="capture-to-card__card-detail">
                          <dt>Last modified</dt>
                          <dd>
                            {useMatrixBuildSlots ? (
                              <MatrixSkeleton
                                className="ctc-build--detail"
                                dotCols={14}
                                dotRows={2}
                              >
                                {cardItem.modifiedLabel}
                              </MatrixSkeleton>
                            ) : (
                              cardItem.modifiedLabel
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </article>
                </div>

                {isCellRevealStudy ? (
                  <>
                    {liveStatus ? (
                      <p className="capture-to-card__import-status" role="status">
                        {liveStatus}
                      </p>
                    ) : null}
                    {importError ? (
                      <div className="capture-to-card__import-error-block" role="alert">
                        <p className="capture-to-card__import-error">{importError}</p>
                        {onImportRetry ? (
                          <button
                            type="button"
                            className="capture-to-card__import-retry"
                            onClick={onImportRetry}
                          >
                            Try again
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                    <label
                      className="capture-to-card__file-preview-change capture-to-card__in-place-change"
                      htmlFor={fileInputId}
                    >
                      Change image
                    </label>
                    <input
                      ref={fileInputRef}
                      id={fileInputId}
                      className="capture-to-card__file-input"
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,.png,.jpg,.jpeg,.gif,.webp,.svg"
                      onChange={onFileInputChange}
                      disabled={importBusy || isMorphing}
                    />
                  </>
                ) : null}

                {showAnimate || (isCellRevealStudy && showResetDemo) ? (
                  <div className="capture-to-card__actions capture-to-card__actions--in-place">
                    {showAnimate ? (
                      <button
                        type="button"
                        className="capture-to-card__primary-button"
                        onClick={requestForwardMorph}
                      >
                        Animate
                      </button>
                    ) : null}
                    {isCellRevealStudy && showResetDemo ? (
                      <button
                        type="button"
                        className="capture-to-card__secondary-button"
                        onClick={handleResetDemo}
                      >
                        Reset demo
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {showInsertIntoCollection || (!isCellRevealStudy && showResetDemo) ? (
                  <div className="capture-to-card__actions capture-to-card__actions--card">
                    {showInsertIntoCollection ? (
                      <button
                        type="button"
                        className="capture-to-card__primary-button"
                        onClick={requestCollectionInsertOnly}
                      >
                        Insert into collection
                      </button>
                    ) : null}
                    {!isCellRevealStudy && showResetDemo ? (
                      <button
                        type="button"
                        className="capture-to-card__secondary-button"
                        onClick={handleResetDemo}
                      >
                        Reset demo
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {showCollection ? (
              <div
                ref={collectionGridRef}
                className="capture-to-card__collection"
                aria-hidden={collectionLayerInert}
                inert={collectionLayerInert}
              >
                <p className="capture-to-card__zone-label">Collection</p>
                <ul className="capture-to-card__collection-grid" role="list">
                  {collectionItems.map((entry) => (
                    <li key={entry.id} className="capture-to-card__collection-item">
                      <article
                        data-collection-tile
                        data-collection-id={entry.id}
                        className="capture-to-card__card"
                        style={
                          {
                            '--ctc-item-aspect': `${entry.width} / ${entry.height}`,
                          } as CSSProperties
                        }
                      >
                        <div className="capture-to-card__card-media">
                          <img
                            data-collection-image={entry.id}
                            className="capture-to-card__card-image"
                            src={entry.imageSrc}
                            alt=""
                            width={entry.width}
                            height={entry.height}
                            decoding="async"
                          />
                        </div>
                        <div className="capture-to-card__card-body">
                          <h2
                            className="capture-to-card__card-title"
                            title={entry.title}
                          >
                            <span className="capture-to-card__card-title-text">
                              {entry.title}
                            </span>
                          </h2>
                          <dl className="capture-to-card__card-details">
                            <div className="capture-to-card__card-detail">
                              <dt>Dimensions</dt>
                              <dd>{entry.dimensionsLabel}</dd>
                            </div>
                            <div className="capture-to-card__card-detail">
                              <dt>Format · size</dt>
                              <dd>{entry.formatSizeLabel}</dd>
                            </div>
                            <div className="capture-to-card__card-detail">
                              <dt>Last modified</dt>
                              <dd>{entry.modifiedLabel}</dd>
                            </div>
                          </dl>
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div
                ref={collectionGridRef}
                className="capture-to-card__sr-only"
                hidden
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
