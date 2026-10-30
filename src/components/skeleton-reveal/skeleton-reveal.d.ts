export function mountSkeletonReveal(
  root: HTMLElement,
  options?: { auto?: boolean },
): {
  reveal(): Promise<void>
  reset(): number
  destroy(): void
}
