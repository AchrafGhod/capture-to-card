import { useId, useState, type ReactNode, type KeyboardEvent } from 'react'
import { getDemoStudy, type DemoStudyId, type SourceTechnology } from './demoPages'
import { StudySourcePanel } from './StudySourcePanel'

export function StudyWorkspace({
  studyId,
  children,
  logoMarkup,
}: {
  studyId: DemoStudyId
  children: ReactNode
  logoMarkup?: string | null
}) {
  const [view, setView] = useState<'preview' | SourceTechnology>('preview')
  const tabs = ['preview', ...getDemoStudy(studyId).technologies] as const
  const labels = {
    preview: 'Preview',
    html: 'HTML',
    css: 'CSS',
    javascript: 'JavaScript',
    react: 'React',
  }
  const id = useId()
  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const index = tabs.indexOf(view)
    const next =
      event.key === 'Home'
        ? tabs[0]
        : event.key === 'End'
          ? tabs[tabs.length - 1]
          : tabs[
              (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) %
                tabs.length
            ]
    setView(next)
    document.getElementById(`${id}-${next}-tab`)?.focus()
  }
  return (
    <>
      <div className="demo__toolbar">
        <div
          className="demo__view-switch"
          role="tablist"
          aria-label="Study view"
          onKeyDown={navigate}
        >
          {tabs.map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              id={`${id}-${value}-tab`}
              className={`demo__view-tab${view === value ? ' demo__view-tab--active' : ''}`}
              aria-selected={view === value}
              aria-controls={`${id}-${value}-panel`}
              tabIndex={view === value ? 0 : -1}
              onClick={() => setView(value)}
            >
              {labels[value]}
            </button>
          ))}
        </div>
      </div>
      <div
        id={`${id}-preview-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-preview-tab`}
        hidden={view !== 'preview'}
      >
        {children}
      </div>
      {getDemoStudy(studyId).technologies.map((technology) => (
        <div
          key={technology}
          id={`${id}-${technology}-panel`}
          role="tabpanel"
          aria-labelledby={`${id}-${technology}-tab`}
          hidden={view !== technology}
        >
          {view === technology && (
            <StudySourcePanel
              studyId={studyId}
              technology={technology}
              logoMarkup={logoMarkup}
            />
          )}
        </div>
      ))}
    </>
  )
}
