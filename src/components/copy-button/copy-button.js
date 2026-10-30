/** Bind one HTML copy button. Call the returned function before removing it. */
export function mountCopyButton(root, options = {}) {
  const button = root.querySelector('.copy-button__control')
  const label = root.querySelector('.copy-button__label')
  const message = root.querySelector('.copy-button__message')
  const idleLabel = options.label ?? 'Copy'
  let disposed = false
  let pending = false
  let timeout

  function show(state) {
    root.dataset.state = state
    label.textContent =
      state === 'copied'
        ? 'Copied'
        : state === 'copying'
          ? 'Copying…'
          : state === 'error'
            ? 'Try again'
            : idleLabel
    button.setAttribute('aria-disabled', String(state === 'copying'))
    message.textContent =
      state === 'copied'
        ? 'Copied to clipboard.'
        : state === 'error'
          ? 'Couldn’t copy. Try again or copy the text manually.'
          : ''
  }

  async function copy() {
    if (disposed || pending || button.disabled) return
    pending = true
    window.clearTimeout(timeout)
    root.dataset.feedback = 'true'
    show('copying')
    try {
      const text =
        typeof options.text === 'function'
          ? options.text()
          : (options.text ?? root.dataset.copyText ?? '')
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(text)
      if (!disposed) {
        show('copied')
        timeout = window.setTimeout(
          () => show('idle'),
          Math.max(0, options.resetAfter ?? 1800),
        )
      }
    } catch {
      if (!disposed) show('error')
    } finally {
      pending = false
    }
  }

  button.disabled = options.disabled ?? false
  show('idle')
  button.addEventListener('click', copy)
  return () => {
    disposed = true
    window.clearTimeout(timeout)
    button.removeEventListener('click', copy)
    root
      .querySelectorAll('*')
      .forEach((node) =>
        node.getAnimations?.().forEach((animation) => animation.cancel()),
      )
  }
}
