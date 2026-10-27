import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from 'react'
import type { CaptureToCardItem } from './captureToCardItem'
import './CaptureToCard.css'

export type { CaptureToCardItem } from './captureToCardItem'

export type CaptureToCardPresentation = 'source' | 'card'

export type CaptureToCardProps = {
  presentation: CaptureToCardPresentation
  item: CaptureToCardItem
  sourceSelected?: boolean
  onSourceSelect?: () => void
  onPrimaryAction?: () => void
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
  onPrimaryAction,
  primaryActionLabel = 'Create card',
  backActionLabel = 'Back to file list',
  explorerAccessory,
}: CaptureToCardProps) {
  const isSource = presentation === 'source'
  const primaryActionHintId = `${useId()}-primary-hint`
  const fileRowRef = useRef<HTMLButtonElement>(null)
  const backButtonRef = useRef<HTMLButtonElement>(null)
  const previousPresentation = useRef(presentation)

  useEffect(() => {
    if (previousPresentation.current === presentation) return
    previousPresentation.current = presentation
    if (presentation === 'card') {
      backButtonRef.current?.focus()
    } else {
      fileRowRef.current?.focus()
    }
  }, [presentation])

  const aspectStyle = {
    '--ctc-item-aspect': `${item.width} / ${item.height}`,
  } as CSSProperties

  return (
    <section
      className="capture-to-card"
      aria-labelledby="capture-to-card-heading"
      data-presentation={presentation}
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

      {isSource && explorerAccessory ? (
        <div className="capture-to-card__import">{explorerAccessory}</div>
      ) : null}

      <div className="capture-to-card__stage">
        {isSource ? (
          <div className="capture-to-card__source">
            <p className="capture-to-card__zone-label">File list</p>
            <div className="capture-to-card__source-panel">
              <div className="capture-to-card__explorer">
                <div className="capture-to-card__explorer-chrome">
                  <span className="capture-to-card__explorer-path">
                    Demo folder
                  </span>
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
                          className="capture-to-card__explorer-thumb-image"
                          src={item.imageSrc}
                          alt=""
                          width={item.width}
                          height={item.height}
                          decoding="async"
                        />
                      </span>
                      <span
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
                  onClick={onPrimaryAction}
                  disabled={!sourceSelected}
                  aria-describedby={
                    sourceSelected ? undefined : primaryActionHintId
                  }
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
        ) : (
          <div className="capture-to-card__destination">
            <p className="capture-to-card__zone-label">Card</p>
            <article className="capture-to-card__card">
              <div className="capture-to-card__card-media">
                <img
                  className="capture-to-card__card-image"
                  src={item.imageSrc}
                  alt=""
                  width={item.width}
                  height={item.height}
                  decoding="async"
                />
              </div>
              <div className="capture-to-card__card-body">
                <h2 className="capture-to-card__card-title" title={item.title}>
                  {item.title}
                </h2>
                <dl className="capture-to-card__card-details">
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
                onClick={onPrimaryAction}
              >
                {backActionLabel}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
