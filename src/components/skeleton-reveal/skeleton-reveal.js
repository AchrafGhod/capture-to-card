/** Animations live in CSS. This module only coordinates actual image readiness. */
export function mountSkeletonReveal(root, { auto = true } = {}) {
  const body = root.querySelector('.cm-skeleton__body')
  const status = root.querySelector('.cm-skeleton__status')
  let generation = 0
  let controller
  let disposed = false
  let frame

  function reset() {
    if (disposed) return generation
    cancelAnimationFrame(frame)
    generation += 1
    controller?.abort()
    root.dataset.ready = 'false'
    delete root.dataset.error
    root.setAttribute('aria-busy', 'true')
    body.inert = true
    body.setAttribute('aria-hidden', 'true')
    status.textContent = 'Loading content…'
    return generation
  }

  async function reveal() {
    if (disposed) return
    const run = reset()
    controller = new AbortController()
    const signal = controller.signal
    try {
      await Promise.all(
        Array.from(body.querySelectorAll('img'), async (image) => {
          await new Promise((resolve, reject) => {
            if (image.complete) {
              if (image.naturalWidth) resolve()
              else reject(new Error('Image failed'))
              return
            }
            const cleanup = () => {
              image.removeEventListener('load', loaded)
              image.removeEventListener('error', failed)
              signal.removeEventListener('abort', failed)
            }
            const loaded = () => {
              cleanup()
              resolve()
            }
            const failed = () => {
              cleanup()
              reject(new Error('Image unavailable'))
            }
            image.addEventListener('load', loaded, { once: true })
            image.addEventListener('error', failed, { once: true })
            signal.addEventListener('abort', failed, { once: true })
          })
          if (image.decode) await image.decode()
        }),
      )
      if (disposed || generation !== run) return
      root.dataset.ready = 'true'
      root.setAttribute('aria-busy', 'false')
      body.inert = false
      body.removeAttribute('aria-hidden')
      status.textContent = 'Content ready.'
    } catch {
      if (disposed || generation !== run) return
      controller.abort()
      root.dataset.error = 'true'
      root.setAttribute('aria-busy', 'false')
      status.textContent = 'Couldn’t load the image. Try another image.'
    }
  }
  reset()
  // Two frames establish the skeleton's initial painted state, even for cached images.
  if (auto)
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => void reveal())
    })
  return {
    reveal,
    reset,
    destroy() {
      disposed = true
      generation += 1
      controller?.abort()
      cancelAnimationFrame(frame)
    },
  }
}
