const SVG_NS = 'http://www.w3.org/2000/svg'
export const MAX_LOGO_SVG_BYTES = 1024 * 1024
const SHAPES = new Set([
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
])
const ELEMENTS = new Set([
  ...SHAPES,
  'svg',
  'g',
  'defs',
  'linearGradient',
  'radialGradient',
  'stop',
  'clipPath',
  'mask',
])
const ATTRIBUTES = new Set([
  'd',
  'points',
  'x',
  'y',
  'x1',
  'x2',
  'y1',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'width',
  'height',
  'viewBox',
  'preserveAspectRatio',
  'transform',
  'gradientTransform',
  'gradientUnits',
  'spreadMethod',
  'fx',
  'fy',
  'fr',
  'offset',
  'stop-color',
  'stop-opacity',
  'clipPathUnits',
  'maskUnits',
  'maskContentUnits',
])
const PRESENTATION = new Set([
  'fill',
  'stroke',
  'color',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'fill-rule',
  'clip-rule',
  'opacity',
  'fill-opacity',
  'stroke-opacity',
  'vector-effect',
  'clip-path',
  'mask',
  'stop-color',
  'stop-opacity',
  'display',
  'visibility',
])
const INHERITED = [
  'fill',
  'stroke',
  'color',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'fill-rule',
  'clip-rule',
  'fill-opacity',
  'stroke-opacity',
  'visibility',
]
let importId = 0

type Paint = Record<string, string>
export type ImportedLogo = { markup: string; label: string }

/** Rebuild a bounded vector-only tree. Never insert the uploaded XML directly. */
export function prepareLogoSvg(source: string, label: string): ImportedLogo {
  if (new TextEncoder().encode(source).length > MAX_LOGO_SVG_BYTES)
    throw new Error('Choose an SVG smaller than 1 MB.')
  if (/<!DOCTYPE|<!ENTITY/i.test(source))
    throw new Error('This SVG cannot be used. Export a plain SVG and try again.')
  const parsed = new DOMParser().parseFromString(source, 'image/svg+xml')
  const original = parsed.documentElement
  if (
    parsed.querySelector('parsererror') ||
    original.localName !== 'svg' ||
    (original.namespaceURI && original.namespaceURI !== SVG_NS)
  ) {
    throw new Error('This file is not a valid SVG.')
  }
  if (original.querySelectorAll('*').length > 2000)
    throw new Error('This SVG is too complex. Export a simpler logo.')
  if (original.querySelector('text, image, use, foreignObject')) {
    throw new Error(
      'Export your logo as vector paths, without text, linked shapes or embedded images.',
    )
  }
  const viewBox = original
    .getAttribute('viewBox')
    ?.trim()
    .split(/[\s,]+/)
    .map(Number)
  const size = (value: string | null) =>
    value && /^\d+(?:\.\d+)?(?:px)?$/.test(value.trim())
      ? Number.parseFloat(value)
      : NaN
  const bounds = viewBox ?? [
    0,
    0,
    size(original.getAttribute('width')),
    size(original.getAttribute('height')),
  ]
  if (
    bounds.length !== 4 ||
    !bounds.every(Number.isFinite) ||
    bounds[2] <= 0 ||
    bounds[3] <= 0
  ) {
    throw new Error('Your SVG needs a valid viewBox or width and height.')
  }
  const prefix = `cm-import-${++importId}-`
  const ids = new Map<string, string>()
  for (const node of original.querySelectorAll('[id]')) {
    const id = node.getAttribute('id')!
    if (!ids.has(id)) ids.set(id, `${prefix}${ids.size}`)
  }
  const localReference = (value: string) => {
    const match = /^url\(\s*['"]?#([^'"\s)]+)['"]?\s*\)$/.exec(value)
    return match && ids.has(match[1]) ? `url(#${ids.get(match[1])})` : null
  }
  const safeValue = (name: string, value: string): string | null => {
    value = value.trim()
    if (value.includes('url(')) return localReference(value)
    if (['fill', 'stroke', 'color', 'stop-color'].includes(name)) {
      return /^(?:#[\da-f]{3,8}|[a-z]+|(?:rgb|rgba|hsl|hsla)\([\d\s.,%+\-/]+\))$/i.test(
        value,
      )
        ? value
        : null
    }
    return /^[-+\w.\s%,]+$/.test(value) ? value : null
  }
  const declarations = (text: string): Paint => {
    const paint: Paint = {}
    for (const entry of text.split(';')) {
      const colon = entry.indexOf(':')
      const name = entry.slice(0, colon).trim().toLowerCase()
      if (colon < 0 || !PRESENTATION.has(name)) continue
      const value = safeValue(
        name,
        entry.slice(colon + 1).replace(/\s*!important\s*$/, ''),
      )
      if (value !== null) paint[name] = value
    }
    return paint
  }
  // Resolve common exported class rules without mounting a stylesheet or allowing CSS URLs.
  const rules = Array.from(original.querySelectorAll('style')).flatMap((style) =>
    Array.from(
      (style.textContent ?? '').matchAll(/([^{}]+)\{([^{}]*)\}/g),
      (match) => ({
        selector: match[1].trim(),
        values: declarations(match[2]),
      }),
    ),
  )
  if (rules.length > 200)
    throw new Error('This SVG has too many styles. Export a simpler logo.')
  const output = document.implementation.createDocument(SVG_NS, 'svg')
  const root = output.documentElement
  let count = 0
  const parts: SVGElement[] = []
  function copy(
    node: Element,
    target: Element,
    inherited: Paint,
    drawing: boolean,
    depth: number,
  ) {
    if (depth > 32) throw new Error('This SVG is too complex. Export a simpler logo.')
    if (
      !ELEMENTS.has(node.localName) ||
      (node.namespaceURI && node.namespaceURI !== SVG_NS)
    )
      return
    const next =
      node === original ? root : output.createElementNS(SVG_NS, node.localName)
    if (node !== original) target.append(next)
    const local: Paint = {}
    for (const attr of node.attributes) {
      if (ATTRIBUTES.has(attr.name) && !PRESENTATION.has(attr.name))
        next.setAttribute(attr.name, attr.value)
      if (PRESENTATION.has(attr.name)) {
        const value = safeValue(attr.name, attr.value)
        if (value !== null) local[attr.name] = value
      }
    }
    for (const rule of rules) {
      try {
        if (node.matches(rule.selector)) Object.assign(local, rule.values)
      } catch {
        /* Unsupported selectors are ignored. */
      }
    }
    Object.assign(local, declarations(node.getAttribute('style') ?? ''))
    for (const [name, value] of Object.entries(local)) next.setAttribute(name, value)
    const id = node.getAttribute('id')
    if (id && ids.has(id)) next.setAttribute('id', ids.get(id)!)
    const paint = {
      ...inherited,
      ...Object.fromEntries(
        INHERITED.filter((name) => local[name] !== undefined).map((name) => [
          name,
          local[name],
        ]),
      ),
    }
    const visibleShape = drawing && SHAPES.has(node.localName)
    if (visibleShape) {
      if (++count > 300)
        throw new Error('Choose a logo with fewer than 300 vector shapes.')
      // Materialize inherited paint so the animation has a matching outline on every shape.
      const fill = paint.fill ?? '#000000'
      const stroke = paint.stroke ?? 'none'
      const hasStroke = stroke !== 'none'
      next.setAttribute('fill', fill)
      next.setAttribute('stroke', hasStroke ? stroke : fill)
      next.setAttribute('pathLength', '1')
      next.setAttribute('class', 'cm-logo-reveal__part')
      parts.push(next as SVGElement)
      const width = hasStroke ? (paint['stroke-width'] ?? '1') : '1.5'
      if (!hasStroke) next.setAttribute('vector-effect', 'non-scaling-stroke')
      next.setAttribute(
        'style',
        `--logo-reveal-stroke-width: ${width}; --logo-reveal-final-stroke: ${hasStroke ? (paint['stroke-opacity'] ?? '1') : '0'}; --logo-reveal-final-fill: ${paint['fill-opacity'] ?? '1'}; --logo-reveal-linecap: ${paint['stroke-linecap'] ?? (hasStroke ? 'butt' : 'round')}; --logo-reveal-linejoin: ${paint['stroke-linejoin'] ?? (hasStroke ? 'miter' : 'round')}`,
      )
    }
    const childrenDraw =
      drawing && !['defs', 'clipPath', 'mask'].includes(node.localName)
    for (const child of node.children) copy(child, next, paint, childrenDraw, depth + 1)
  }
  copy(original, root, {}, true, 0)
  if (!count) throw new Error('Your SVG needs vector paths or basic shapes to animate.')
  parts.forEach((part, index) =>
    part.style.setProperty(
      '--part',
      String((index * 3) / Math.max(3, parts.length - 1)),
    ),
  )
  root.setAttribute('viewBox', bounds.join(' '))
  root.setAttribute('width', '240')
  root.setAttribute('height', String((240 * bounds[3]) / bounds[2]))
  root.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  root.setAttribute('class', 'cm-logo-reveal')
  root.setAttribute('role', 'img')
  root.setAttribute('aria-label', label || 'Custom logo')
  return { markup: new XMLSerializer().serializeToString(root), label }
}

export async function importLogoSvg(file: File): Promise<ImportedLogo> {
  if (!/\.svg$/i.test(file.name) && file.type !== 'image/svg+xml')
    throw new Error('Choose an SVG file.')
  if (file.size > MAX_LOGO_SVG_BYTES)
    throw new Error('Choose an SVG smaller than 1 MB.')
  const source = await file.text()
  return prepareLogoSvg(source, file.name.replace(/\.svg$/i, ''))
}
