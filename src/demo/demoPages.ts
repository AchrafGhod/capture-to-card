export type DemoStudyId = 'file-to-card' | 'collection-insert'

export const demoCategories = [
  { id: 'all', title: 'All' },
  { id: 'animations', title: 'Animations' },
  { id: 'transition', title: 'Transition' },
  { id: 'card', title: 'Card' },
  { id: 'button', title: 'Button' },
] as const

export type DemoCategoryId = (typeof demoCategories)[number]['id']

export type DemoStudyMeta = {
  id: DemoStudyId
  slug: string
  title: string
  tagline: string
  status: 'live' | 'soon'
  categories: Exclude<DemoCategoryId, 'all'>[]
}

export type DemoRootPageId = 'library' | 'docs'
export type DemoPageId = DemoRootPageId | DemoStudyId

export const demoProductName = 'CompoMotion'

export const demoHeaderNav: { id: DemoRootPageId; title: string }[] = [
  { id: 'library', title: 'Library' },
  { id: 'docs', title: 'Docs' },
]

/** Catalog entries — one slug, one mission each. */
export const demoStudies: DemoStudyMeta[] = [
  {
    id: 'file-to-card',
    slug: 'file-to-card',
    title: 'Cell reveal',
    tagline:
      'Use your own image or keep the sample, then press Animate and watch the card build one cell at a time.',
    status: 'live',
    categories: ['animations', 'card'],
  },
  {
    id: 'collection-insert',
    slug: 'collection-insert',
    title: 'Grid insert',
    tagline:
      'Press insert and the finished card moves into the first spot in your collection.',
    status: 'live',
    categories: ['transition', 'card'],
  },
]

export const demoDocsCopy = {
  title: 'Docs',
  sections: [
    {
      heading: 'Introduction',
      paragraphs: [
        'CompoMotion is a small library of motion studies you can run in the browser. Each one keeps the same image, filename, and metadata from start to finish.',
        'Start from the Library, open a study, and try the motion. Export tabs for CSS and React are shown on each page but are not wired up yet.',
      ],
    },
    {
      heading: 'Documentation',
      paragraphs: [
        'Run the demo with pnpm dev (http://127.0.0.1:5174/). Nothing leaves your machine—images stay as local files or temporary browser URLs.',
        'Cell reveal: Drop a file on the card or choose Change image, then Animate. The picture and details appear gradually, with no sliding motion. Reset demo starts the run again with the same file.',
        'Grid insert: When the card is ready, choose Insert into collection. It lands in the first slot and the rest of the grid makes room. Reset demo puts the collection back how it started.',
        'If you prefer reduced motion, travel is skipped but you still reach the same end state. Each run adds at most one new card until you reset. Back returns to the Library from a study or from this page.',
      ],
    },
  ],
}

export function getDemoStudy(id: DemoStudyId): DemoStudyMeta {
  const study = demoStudies.find((entry) => entry.id === id)
  if (!study) {
    throw new Error(`Unknown demo study: ${id}`)
  }
  return study
}

export function isStudyPage(id: DemoPageId): id is DemoStudyId {
  return id === 'file-to-card' || id === 'collection-insert'
}

export function headerPageFor(id: DemoPageId): DemoRootPageId {
  return id === 'docs' ? 'docs' : 'library'
}
