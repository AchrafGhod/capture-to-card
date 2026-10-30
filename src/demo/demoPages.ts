export type CaptureStudyId = 'file-to-card' | 'collection-insert'
export type DemoStudyId =
  | CaptureStudyId
  | 'pixel-reveal'
  | 'copy-button'
  | 'logo-reveal'
  | 'skeleton-reveal'
  | 'animated-checklist'

export const demoCategories = [
  { id: 'all', title: 'All' },
  { id: 'animations', title: 'Animations' },
  { id: 'transition', title: 'Transition' },
  { id: 'card', title: 'Card' },
  { id: 'button', title: 'Button' },
] as const

export type DemoCategoryId = (typeof demoCategories)[number]['id']
export type SourceTechnology = 'html' | 'css' | 'javascript' | 'react'

export type DemoStudyMeta = {
  id: DemoStudyId
  slug: string
  title: string
  tagline: string
  status: 'live' | 'soon'
  categories: Exclude<DemoCategoryId, 'all'>[]
  technologies: SourceTechnology[]
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
    id: 'animated-checklist',
    slug: 'animated-checklist',
    title: 'Animated Checklist',
    tagline: 'Check a task and watch its text cross out with a gentle confirmation.',
    status: 'live',
    categories: ['animations'],
    technologies: ['html', 'css'],
  },
  {
    id: 'skeleton-reveal',
    slug: 'skeleton-reveal',
    title: 'Skeleton Reveal',
    tagline:
      'A quiet loading state that gives way to your content, one element at a time.',
    status: 'live',
    categories: ['animations', 'card'],
    technologies: ['html', 'css', 'javascript'],
  },
  {
    id: 'logo-reveal',
    slug: 'logo-reveal',
    title: 'SVG Logo Reveal',
    tagline: 'Trace a logo one path at a time, then ease into its original colors.',
    status: 'live',
    categories: ['animations'],
    technologies: ['html', 'css'],
  },
  {
    id: 'copy-button',
    slug: 'copy-button',
    title: 'Copy Button',
    tagline:
      'Copy text with a quiet animated confirmation, then return to the initial state.',
    status: 'live',
    categories: ['button'],
    technologies: ['html', 'css', 'javascript'],
  },
  {
    id: 'pixel-reveal',
    slug: 'pixel-reveal',
    title: 'Pixel Reveal',
    tagline:
      'An image that reveals itself through a sweep of pixels. Adjust the sweep, then replay it.',
    status: 'live',
    categories: ['animations'],
    technologies: ['react', 'css'],
  },
  {
    id: 'file-to-card',
    slug: 'file-to-card',
    title: 'Cell reveal',
    tagline:
      'Use your own image or keep the sample, then press Animate and watch the card build one cell at a time.',
    status: 'live',
    categories: ['animations', 'card'],
    technologies: ['react', 'css'],
  },
  {
    id: 'collection-insert',
    slug: 'collection-insert',
    title: 'Grid insert',
    tagline:
      'Press insert and the finished card moves into the first spot in your collection.',
    status: 'live',
    categories: ['transition', 'card'],
    technologies: ['react', 'css'],
  },
]

export const demoDocsCopy = {
  title: 'Docs',
  sections: [
    {
      heading: 'Introduction',
      paragraphs: [
        'CompoMotion is a small library of reusable motion components you can try in the browser.',
        'Start from the Library, open a component, and try the motion. Choose HTML, CSS, JavaScript or React to view and copy its source code.',
      ],
    },
    {
      heading: 'Documentation',
      paragraphs: [
        'Reuse: SVG Logo Reveal is HTML/CSS; Copy Button is HTML/CSS/JavaScript. Pixel Reveal, Cell reveal and Grid insert currently require React 19/TypeScript. Choose a technology tab and copy the files you need, keeping their paths. usage.html or src/Example.tsx shows how to connect them. Keep the project MIT license when redistributing its code.',
        'Run the demo with pnpm dev (http://127.0.0.1:5174/). Nothing leaves your machine—images stay as local files or temporary browser URLs.',
        'Cell reveal: Drop a file on the card or choose Change image, then Animate. The picture and details appear gradually, with no sliding motion. Reset demo starts the run again with the same file.',
        'Grid insert: When the card is ready, choose Insert into collection. It lands in the first slot and the rest of the grid makes room. Reset demo puts the collection back how it started.',
        'Pixel Reveal: An image appears through a sweep of square pixels. Choose a pixel size, duration, and direction, or press Replay to run it again. Reduced motion shows the image immediately.',
        'Copy Button: Edit the sample text and choose Copy. A checkmark confirms the clipboard write, then the button resets. Paste anywhere to check the result. If copying is blocked, retry or copy the text manually.',
        'SVG Logo Reveal: The logo’s outlines draw in sequence, then fill with their original colors. Adjust draw duration and stagger, or Replay. Reduced motion shows the finished logo immediately.',
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
  return demoStudies.some((study) => study.id === id)
}

export function headerPageFor(id: DemoPageId): DemoRootPageId {
  return id === 'docs' ? 'docs' : 'library'
}
