import { useRef } from 'react'
import {
  demoCategories,
  demoStudies,
  type DemoCategoryId,
  type DemoStudyId,
} from './demoPages'

type LibraryPageProps = {
  category: DemoCategoryId
  onCategoryChange: (category: DemoCategoryId) => void
  onOpenStudy: (id: DemoStudyId) => void
}

export function LibraryPage({
  category,
  onCategoryChange,
  onOpenStudy,
}: LibraryPageProps) {
  const allCategoryRef = useRef<HTMLButtonElement>(null)
  const studies = demoStudies.filter(
    (study) => category === 'all' || study.categories.includes(category),
  )
  const categoryTitle = demoCategories.find((entry) => entry.id === category)!.title

  return (
    <main className="demo__catalog" aria-labelledby="library-title">
      <h1 id="library-title" className="demo__catalog-title">
        Library
      </h1>
      <div className="demo__chips" role="group" aria-label="Component categories">
        {demoCategories.map((entry) => (
          <button
            key={entry.id}
            ref={entry.id === 'all' ? allCategoryRef : undefined}
            type="button"
            className="demo__chip"
            aria-pressed={category === entry.id}
            aria-controls="library-results"
            onClick={() => onCategoryChange(entry.id)}
          >
            {entry.title}
          </button>
        ))}
      </div>
      <p className="demo__sr-only" role="status">
        {studies.length} {studies.length === 1 ? 'component' : 'components'} in{' '}
        {categoryTitle}.
      </p>
      <div id="library-results">
        {studies.length > 0 ? (
          <ul className="demo__tiles">
            {studies.map((study) => (
              <li key={study.id}>
                <button
                  type="button"
                  className="demo__tile"
                  aria-label={study.title}
                  aria-describedby={`${study.slug}-description`}
                  onClick={() => onOpenStudy(study.id)}
                >
                  <span
                    className="demo__tile-preview"
                    data-sketch={study.id}
                    aria-hidden="true"
                  >
                    <span className="demo__sketch-a" />
                    <span className="demo__sketch-b" />
                  </span>
                  <span className="demo__tile-title">{study.title}</span>
                  <span id={`${study.slug}-description`} className="demo__tile-copy">
                    {study.tagline}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="demo__empty">
            <h2>No components in {categoryTitle} yet.</h2>
            <p>Explore the other categories or view all components.</p>
            <button
              type="button"
              className="demo__empty-action"
              onClick={() => {
                onCategoryChange('all')
                allCategoryRef.current?.focus()
              }}
            >
              View all components
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
