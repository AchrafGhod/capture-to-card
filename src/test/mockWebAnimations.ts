import { vi } from 'vitest'

export type AnimHandle = {
  finished: Promise<void>
  cancel: () => void
  playState: 'running' | 'finished' | 'idle'
  finish: () => void
}

type MockOptions = {
  autoFinish?: boolean
}

export function installMockWebAnimations(options: MockOptions = {}) {
  const { autoFinish = true } = options
  const handles: AnimHandle[] = []
  const proto = Element.prototype as Element & {
    animate?: typeof Element.prototype.animate
  }

  if (!proto.animate) {
    proto.animate = function animateStub() {
      return {
        finished: Promise.resolve(),
        cancel: () => undefined,
        playState: 'finished',
      } as unknown as Animation
    }
  }

  const animate = vi.spyOn(proto, 'animate').mockImplementation(function animateMock(
    this: Element,
    _keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
    _options?: number | KeyframeAnimationOptions,
  ) {
    let settled = false
    let resolveFinished: () => void
    const finished = new Promise<void>((resolve) => {
      resolveFinished = () => {
        if (settled) return
        settled = true
        handle.playState = 'finished'
        resolve()
      }
    })

    const handle: AnimHandle = {
      finished,
      playState: 'running',
      finish: () => resolveFinished(),
      cancel: () => {
        if (settled) return
        settled = true
        handle.playState = 'idle'
        resolveFinished()
      },
    }
    handles.push(handle)

    if (autoFinish) {
      queueMicrotask(() => {
        if (handle.playState === 'running') {
          resolveFinished()
        }
      })
    }

    return handle as unknown as Animation
  })

  return {
    handles,
    finishAll: () => {
      for (const handle of handles) {
        if (handle.playState === 'running') {
          handle.finish()
        }
      }
    },
    restore: () => animate.mockRestore(),
  }
}
