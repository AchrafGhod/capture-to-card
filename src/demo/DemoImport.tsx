import type { RefObject } from 'react'

type DemoImportProps = {
  fileInputId: string
  fileInputRef: RefObject<HTMLInputElement | null>
  importBusy: boolean
  importError: string | null
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRetry: () => void
}

export function DemoImport({
  fileInputId,
  fileInputRef,
  importBusy,
  importError,
  onFileChange,
  onRetry,
}: DemoImportProps) {
  return (
    <div className="demo__import">
      <p className="demo__import-label">Import from your device</p>
      <label className="demo__file-label" htmlFor={fileInputId}>
        Choose an image file
      </label>
      <input
        ref={fileInputRef}
        id={fileInputId}
        className="demo__file-input"
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,.png,.jpg,.jpeg,.gif,.webp,.svg"
        onChange={onFileChange}
      />
      {importBusy ? (
        <p className="demo__import-status" role="status">
          Reading file…
        </p>
      ) : null}
      {importError ? (
        <div className="demo__import-error-block" role="alert">
          <p className="demo__import-error">{importError}</p>
          <button type="button" className="demo__import-retry" onClick={onRetry}>
            Choose another file
          </button>
        </div>
      ) : null}
    </div>
  )
}
