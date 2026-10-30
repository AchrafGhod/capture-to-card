import type { DemoStudyId } from '../demoPages'
import license from '../../../LICENSE?raw'
import { reactExample } from './sourceTemplates'

export type SourceFile = { name: string; content: string }
export type SourcePackage = {
  format: string
  instructions: string[]
  files: SourceFile[]
}

const sources = import.meta.glob<string>(
  [
    '../../components/**/*.{html,css,js,ts,tsx,md}',
    '!../../components/**/*.test.*',
    '!../../components/**/*.d.ts',
    '!../../components/copy-button/CopyButton.tsx',
    '../../styles/tokens.css',
    '../demoImageImport.ts',
    '../../assets/demo-capture.svg',
  ],
  { query: '?raw', import: 'default' },
)

export const sourceDefinitions: Record<
  DemoStudyId,
  { folder: string; format: string }
> = {
  'animated-checklist': { folder: 'animated-checklist', format: 'HTML + CSS' },
  'skeleton-reveal': { folder: 'skeleton-reveal', format: 'HTML + CSS + JavaScript' },
  'logo-reveal': { folder: 'logo-reveal', format: 'HTML + CSS' },
  'copy-button': { folder: 'copy-button', format: 'HTML + CSS + JavaScript' },
  'pixel-reveal': { folder: 'pixel-reveal', format: 'React + TypeScript' },
  'file-to-card': { folder: 'capture-to-card', format: 'React + TypeScript' },
  'collection-insert': { folder: 'capture-to-card', format: 'React + TypeScript' },
}

export async function loadSourcePackage(id: DemoStudyId): Promise<SourcePackage> {
  const { folder, format } = sourceDefinitions[id]
  const portable =
    id === 'logo-reveal' ||
    id === 'copy-button' ||
    id === 'skeleton-reveal' ||
    id === 'animated-checklist'
  const entries = Object.entries(sources).filter(([path]) => {
    if (!path.startsWith(`../../components/${folder}/`)) return false
    return !portable || !/\.tsx$|\.d\.ts$/.test(path)
  })
  const componentFiles = await Promise.all(
    entries.map(async ([path, load]) => ({
      name: portable ? path.split('/').pop()! : path.replace('../../', 'src/'),
      content: await load(),
    })),
  )
  const instructions =
    id === 'animated-checklist'
      ? [
          'Include AnimatedChecklist.css and paste animated-checklist.html into your page.',
          'Edit the five labels and task values; duplicate an li to add more tasks.',
          'Use native checkbox states or place the list in your own form. No JavaScript is required.',
        ]
      : id === 'skeleton-reveal'
        ? [
            'Include SkeletonReveal.css and paste skeleton-reveal.html into your page.',
            'Replace the image and content. Import mountSkeletonReveal from skeleton-reveal.js and bind the card as shown in usage.html.',
            'For asynchronous data, use auto: false and call reveal after the data arrives. Call destroy before removing the component.',
          ]
        : portable
          ? [
              'Choose a file below and copy its code into your project. Keep the displayed filenames together.',
              id === 'logo-reveal'
                ? 'Include LogoReveal.css and paste logo-reveal.html inline. usage.html shows the complete integration.'
                : 'Include CopyButton.css, paste copy-button.html and call mountCopyButton as shown in usage.html.',
              id === 'logo-reveal'
                ? 'Replace the inline paths with your own SVG and update its accessible label. Timing is controlled by CSS variables.'
                : 'Set data-copy-text, or pass a text getter to mountCopyButton. Clipboard access needs HTTPS or localhost. Call its cleanup function before removing the button.',
            ]
          : [
              'This version requires React and TypeScript. A plain HTML/CSS version is not included.',
              'Start with src/Example.tsx in an existing React 19 project that supports TypeScript and CSS imports.',
              'For an existing React project, copy the component folder and the files imported by src/Example.tsx. Keep the paths and CSS files together. Replace the included sample image with your own.',
            ]
  let files: SourceFile[]
  if (portable) {
    const snippetName = `${id}.html`
    const snippet = componentFiles.find((file) => file.name === snippetName)!.content
    const stylesheet =
      id === 'logo-reveal'
        ? 'LogoReveal.css'
        : id === 'animated-checklist'
          ? 'AnimatedChecklist.css'
          : id === 'skeleton-reveal'
            ? 'SkeletonReveal.css'
            : 'CopyButton.css'
    const script =
      id === 'copy-button'
        ? `
<script type="module">
  import { mountCopyButton } from './copy-button.js'
  mountCopyButton(document.querySelector('.copy-button'))
</script>`
        : id === 'skeleton-reveal'
          ? `
<script type="module">
  import { mountSkeletonReveal } from './skeleton-reveal.js'
  mountSkeletonReveal(document.querySelector('.cm-skeleton'))
</script>`
          : ''
    files = [
      componentFiles.find((file) => file.name === snippetName)!,
      ...componentFiles.filter((file) => file.name !== snippetName),
      {
        name: 'usage.html',
        content: `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CompoMotion — ${id}</title>
  <link rel="stylesheet" href="./${stylesheet}" />
  <style>body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, sans-serif; }</style>
</head>
<body>
${snippet}${script}
</body>
</html>
`,
      },
    ]
    if (id === 'skeleton-reveal')
      files.push({
        name: 'image.svg',
        content: await sources['../../assets/demo-capture.svg'](),
      })
  } else {
    const capture = folder === 'capture-to-card'
    files = [
      { name: 'src/Example.tsx', content: reactExample(id) },
      ...componentFiles,
      {
        name: 'src/assets/sample.svg',
        content: await sources['../../assets/demo-capture.svg'](),
      },
      {
        name: 'src/example.css',
        content: `* { box-sizing: border-box; }
body { margin: 0; padding: 24px; font: 14px/1.5 system-ui, sans-serif; color: #111827; }
main { max-width: 760px; margin: 0 auto; }
button { font: inherit; cursor: pointer; }
button:focus-visible { outline: 2px solid #003cff; outline-offset: 3px; }
`,
      },
    ]
    if (capture)
      files.push(
        {
          name: 'src/styles/tokens.css',
          content: await sources['../../styles/tokens.css'](),
        },
        {
          name: 'src/integration/importImage.ts',
          content: await sources['../demoImageImport.ts'](),
        },
      )
  }
  // README is first-class integration guidance, with the original component notes retained.
  const notes = files.find((file) => file.name.endsWith('README.md'))?.content ?? ''
  files = files.filter((file) => !file.name.endsWith('README.md'))
  files.push(
    {
      name: 'README.md',
      content: `# CompoMotion — ${id}\n\n${format}\n\n${instructions.map((step, index) => `${index + 1}. ${step}`).join('\n\n')}\n\nThe example uses system fonts; no font downloads or CDN are required. Keep LICENSE with redistributed code.\n\n${notes}`,
    },
    { name: 'LICENSE', content: license },
  )
  return { format, instructions, files }
}
