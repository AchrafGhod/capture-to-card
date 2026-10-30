import { describe, expect, it } from 'vitest'
import { prepareLogoSvg, MAX_LOGO_SVG_BYTES } from './logoSvgImport'

describe('SVG logo import', () => {
  it('keeps vector geometry, inherited colors, transforms and stroke-only artwork', () => {
    const result = prepareLogoSvg(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><style>.mark { fill: #003cff }</style><g transform="translate(2 3)" fill="#d32f2f"><path class="mark" d="M0 0H40V40Z"/><circle cx="65" cy="30" r="20" fill="none" stroke="#123456" stroke-width="2" /></g></svg>`,
      'My logo',
    )
    const svg = new DOMParser().parseFromString(result.markup, 'image/svg+xml')
    expect(svg.documentElement.getAttribute('viewBox')).toBe('0 0 100 60')
    expect(svg.querySelector('path')?.getAttribute('fill')).toBe('#003cff')
    expect(svg.querySelector('g')?.getAttribute('transform')).toBe('translate(2 3)')
    expect(svg.querySelector('circle')?.getAttribute('style')).toContain(
      '--logo-reveal-final-stroke: 1',
    )
    expect(svg.querySelectorAll('[pathLength="1"]')).toHaveLength(2)
  })

  it('rebuilds safe markup, keeps only internal references and bounds the stagger', () => {
    const shapes = '<rect width="4" height="4" fill="url(#paint)"/>'.repeat(10)
    const result = prepareLogoSvg(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" onload="alert(1)"><script>alert(1)</script><defs><linearGradient id="paint"><stop stop-color="blue" /></linearGradient></defs><g style="position:fixed;fill:url(https://bad.invalid/image)">${shapes}<a href="https://bad.invalid"><path d="M0 0H5"/></a></g></svg>`,
      'My logo',
    )
    expect(result.markup).not.toMatch(/onload|<script|https:|position|<a[ >]/)
    const svg = new DOMParser().parseFromString(result.markup, 'image/svg+xml')
    expect(svg.querySelector('rect')?.getAttribute('fill')).toBe(
      `url(#${svg.querySelector('linearGradient')?.id})`,
    )
    expect(svg.querySelector('rect:last-child')?.getAttribute('style')).toContain(
      '--part: 3',
    )
    expect(svg.querySelectorAll('.cm-logo-reveal__part')).toHaveLength(10)
  })

  it('rejects malformed, oversized or unsupported files with useful errors', () => {
    expect(() => prepareLogoSvg('<svg>broken', 'Logo')).toThrow('valid SVG')
    expect(() => prepareLogoSvg('<!DOCTYPE svg><svg/>', 'Logo')).toThrow('plain SVG')
    expect(() =>
      prepareLogoSvg('<svg viewBox="0 0 10 10"><text>Logo</text></svg>', 'Logo'),
    ).toThrow('vector paths')
    expect(() => prepareLogoSvg('<svg viewBox="0 0 10 10"/>', 'Logo')).toThrow(
      'basic shapes',
    )
    expect(() => prepareLogoSvg(' '.repeat(MAX_LOGO_SVG_BYTES + 1), 'Logo')).toThrow(
      '1 MB',
    )
  })
})
