import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from 'react'
import type { CaptureToCardItem } from './captureToCardItem'
import { itemMorphKey } from './morph/itemMorphKey'
import { useFileToCardMorph } from './morph/useFileToCardMorph'
import './CaptureToCard.css'

export type { CaptureToCardItem } from './captureToCardItem'

export type CaptureToCardPresentation = 'source' | 'card'

export type CaptureToCardProps = {
  presentation: CaptureToCardPresentation
  item: CaptureToCardItem
  sourceSelected?: boolean
  onSourceSelect?: () => void
  /**
   * Called when the user commits to card or back to the file list. Apply `next` to
   * `presentation` promptly so destination layout can be measured for the morph.
   */
  onPresentationChange: (next: CaptureToCardPresentation) => void
  primaryActionLabel?: string
  backActionLabel?: string
  /** Optional demo-only block (e.g. local file import) above the file list. */
  explorerAccessory?: ReactNode
}

export function CaptureToCard({
  presentation,
  item,
  sourceSelected = false,
  onSourceSelect,
  onPresentationChange,
  primaryActionLabel = 'Create card',
  backActionLabel = 'Back to file list',
  explorerAccessory,
}: CaptureToCardProps) {
  const primaryActionHintId = `${useId()}-primary-hint`
  const fileRowRef = useRef<HTMLButtonElement>(null)
  const backButtonRef = useRef<HTMLButtonElement>(null)
  const previousPresentation = useRef(presentation)

  const {
    morphRefs,
    isMorphing,
    showSourceLayer,
    showDestinationLayer,
    sourceLayerInert,
    destinationLayerInert,
    requestForwardMorph,
    requestBackMorph,
    morphPhase,
  } = useFileToCardMorph({
    presentation,
    imageSrc: item.imageSrc,
    title: item.title,
    morphItemKey: itemMorphKey(item),
    onPresentationChange,
  })

  const {
    stageRef,
    sourceLayerRef,
    destinationLayerRef,
    sourceThumbImageRef,
    sourceNameRef,
    cardShellRef,
    cardImageRef,
    cardTitleRef,
    cardDetailsRef,
  } = morphRefs

  useEffect(() => {
    if (morphPhase !== 'idle') return
    if (previousPresentation.current === presentation) return
    previousPresentation.current = presentation
    if (presentation === 'card') {
      backButtonRef.current?.focus({ preventScroll: true })
    } else {
      fileRowRef.current?.focus({ preventScroll: true })
    }
  }, [morphPhase, presentation])

  const aspectStyle = {
    '--ctc-item-aspect': `${item.width} / ${item.height}`,
  } as CSSProperties

  const handleCreateCard = () => {
    if (!sourceSelected || isMorphing) return
    requestForwardMorph()
  }

  const handleBack = () => {
    if (isMorphing) return
    requestBackMorph()
  }

  return (
    <section
      className="capture-to-card"
      aria-labelledby="capture-to-card-heading"
      data-presentation={presentation}
      data-morphing={isMorphing || undefined}
      style={aspectStyle}
    >
      <header className="capture-to-card__intro">
        <h1 id="capture-to-card-heading" className="capture-to-card__title">
          File to card
        </h1>
        <p className="capture-to-card__lede">
          Import an image or pick the file in the demo folder.
        </p>
      </header>

      {explorerAccessory ? (
        <div className="capture-to-card__import">{explorerAccessory}</div>
      ) : null}

      <div ref={stageRef} className="capture-to-card__stage">
        <div className="capture-to-card__stage-layers">
          {showSourceLayer ? (
            <div
              ref={sourceLayerRef}
              className="capture-to-card__source capture-to-card__stage-layer"
              data-active={presentation === 'source' || undefined}
              aria-hidden={sourceLayerInert}
              inert={sourceLayerInert}
            >
              <p className="capture-to-card__zone-label">File list</p>
              <div className="capture-to-card__source-panel">
                <div className="capture-to-card__explorer">
                  <div className="capture-to-card__explorer-chrome">
                    <span className="capture-to-card__explorer-path">Demo folder</span>
                  </div>
                  <ul className="capture-to-card__explorer-list" role="list">
                    <li>
                      <button
                        ref={fileRowRef}
                        type="button"
                        className="capture-to-card__explorer-item"
                        data-selected={sourceSelected || undefined}
                        aria-pressed={sourceSelected}
                        onClick={onSourceSelect}
                      >
                        <span className="capture-to-card__explorer-thumb">
                          <img
                            ref={sourceThumbImageRef}
                            className="capture-to-card__explorer-thumb-image"
                            src={item.imageSrc}
                            alt=""
                            width={item.width}
                            height={item.height}
                            decoding="async"
                          />
                        </span>
                        <span
                          ref={sourceNameRef}
                          className="capture-to-card__explorer-name"
                          title={item.title}
                        >
                          {item.title}
                        </span>
                      </button>
                    </li>
                  </ul>
                </div>
                <div className="capture-to-card__actions">
                  <button
                    type="button"
                    className="capture-to-card__button capture-to-card__button--primary"
                    onClick={handleCreateCard}
                    disabled={!sourceSelected || isMorphing}
                    aria-describedby={sourceSelected ? undefined : primaryActionHintId}
                  >
                    {primaryActionLabel}
                  </button>
                  {!sourceSelected ? (
                    <p
                      id={primaryActionHintId}
                      className="capture-to-card__action-hint"
                    >
                      Select an image to continue.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {showDestinationLayer ? (
            <div
              ref={destinationLayerRef}
              className="capture-to-card__destination capture-to-card__stage-layer"
              data-active={presentation === 'card' || undefined}
              aria-hidden={destinationLayerInert}
              inert={destinationLayerInert}
            >
              <p className="capture-to-card__zone-label">Card</p>
              <article ref={cardShellRef} className="capture-to-card__card">
                <div className="capture-to-card__card-media">
                  <img
                    ref={cardImageRef}
                    className="capture-to-card__card-image"
                    src={item.imageSrc}
                    alt=""
                    width={item.width}
                    height={item.height}
                    decoding="async"
                  />
                </div>
                <div className="capture-to-card__card-body">
                  <h2
                    ref={cardTitleRef}
                    className="capture-to-card__card-title"
                    title={item.title}
                  >
                    {item.title}
                  </h2>
                  <dl ref={cardDetailsRef} className="capture-to-card__card-details">
                    <div className="capture-to-card__card-detail">
                      <dt>Dimensions</dt>
                      <dd>{item.dimensionsLabel}</dd>
                    </div>
                    <div className="capture-to-card__card-detail">
                      <dt>Format · size</dt>
                      <dd>{item.formatSizeLabel}</dd>
                    </div>
                    <div className="capture-to-card__card-detail">
                      <dt>Last modified</dt>
                      <dd>{item.modifiedLabel}</dd>
                    </div>
                  </dl>
                </div>
              </article>
              <div className="capture-to-card__actions capture-to-card__actions--card">
                <button
                  ref={backButtonRef}
                  type="button"
                  className="capture-to-card__button capture-to-card__button--secondary"
                  onClick={handleBack}
                  disabled={isMorphing}
                >
                  {backActionLabel}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
