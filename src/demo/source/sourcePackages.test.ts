import { describe, expect, it } from 'vitest'
import { demoStudies } from '../demoPages'
import { loadSourcePackage } from './sourcePackages'

describe('Library source files', () => {
  it('provides every local dependency and example without tests, fonts or project scaffolding', async () => {
    for (const study of demoStudies) {
      const source = await loadSourcePackage(study.id)
      const names = new Set(source.files.map((file) => file.name))
      expect(names.size).toBe(source.files.length)
      expect(names.has('LICENSE')).toBe(true)
      expect(names.has('README.md')).toBe(true)
      expect([...names].some((name) => /test\.|\.woff|package\.json/.test(name))).toBe(
        false,
      )
      for (const file of source.files.filter((file) => /\.[jt]sx?$/.test(file.name))) {
        const imports = [
          ...file.content.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g),
        ]
        for (const [, specifier] of imports) {
          if (!specifier.startsWith('.')) continue
          const resolved = new URL(
            specifier,
            `https://component.local/${file.name}`,
          ).pathname.slice(1)
          expect(
            ['', '.ts', '.tsx', '.js'].some((extension) =>
              names.has(resolved + extension),
            ),
            `${study.id}: missing ${resolved}`,
          ).toBe(true)
        }
      }
      if (
        study.id === 'logo-reveal' ||
        study.id === 'copy-button' ||
        study.id === 'skeleton-reveal' ||
        study.id === 'animated-checklist'
      ) {
        expect([...names].some((name) => name.endsWith('.tsx'))).toBe(false)
        expect(names.has('usage.html')).toBe(true)
        if (study.id === 'skeleton-reveal') expect(names.has('image.svg')).toBe(true)
      }
    }
  })
})
