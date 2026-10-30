import { useLayoutEffect, useRef } from 'react'
import markup from './copy-button.html?raw'
import { mountCopyButton } from './copy-button.js'
import './CopyButton.css'

export type CopyButtonProps = {
  text: string
  label?: string
  resetAfter?: number
  disabled?: boolean
}

/** React adapter for the same standalone HTML/CSS/JS offered in the Library. */
export function CopyButton({ text, label, resetAfter, disabled }: CopyButtonProps) {
  const host = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const root = host.current!.querySelector<HTMLElement>('.copy-button')!
    return mountCopyButton(root, { text, label, resetAfter, disabled })
  }, [text, label, resetAfter, disabled])
  return (
    <span
      ref={host}
      className="copy-button-host"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  )
}
