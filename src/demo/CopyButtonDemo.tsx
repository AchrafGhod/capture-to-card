import { useId, useState } from 'react'
import { CopyButton } from '../components/copy-button/CopyButton'
import './CopyButtonDemo.css'

export function CopyButtonDemo() {
  const inputId = useId()
  const [text, setText] = useState('https://compomotion.dev/components')
  return (
    <div className="copy-button-demo">
      <div className="copy-button-demo__example">
        <div className="copy-button-demo__heading">
          <span className="copy-button-demo__symbol" aria-hidden="true">
            ↗
          </span>
          <div>
            <h2>Share a link</h2>
            <p>A small action. A clear confirmation.</p>
          </div>
        </div>
        <label htmlFor={inputId}>Link to copy</label>
        <div className="copy-button-demo__row">
          <input
            id={inputId}
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
          <CopyButton text={text} disabled={!text.trim()} />
        </div>
      </div>
      <p className="copy-button-demo__hint">
        Edit the text, copy it, then paste it anywhere to try it out.
      </p>
    </div>
  )
}
