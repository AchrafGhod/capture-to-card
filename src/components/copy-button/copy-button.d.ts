export type CopyButtonOptions = {
  text?: string | (() => string)
  label?: string
  resetAfter?: number
  disabled?: boolean
}

export function mountCopyButton(
  root: HTMLElement,
  options?: CopyButtonOptions,
): () => void
