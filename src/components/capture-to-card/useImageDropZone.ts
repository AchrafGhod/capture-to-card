import { useCallback, useRef, useState, type DragEvent, type RefObject } from 'react'

function isFileDrag(event: DragEvent) {
  const types = event.dataTransfer?.types
  if (!types) return false
  return [...types].includes('Files')
}

export type ImageDropZoneHandlers = {
  dragOver: boolean
  onDragEnter: (event: DragEvent<HTMLElement>) => void
  onDragLeave: (event: DragEvent<HTMLElement>) => void
  onDragOver: (event: DragEvent<HTMLElement>) => void
  onDrop: (event: DragEvent<HTMLElement>) => void
}

export function useImageDropZone(
  _zoneRef: RefObject<HTMLElement | null>,
  onFilesDropped: (files: FileList) => void,
): ImageDropZoneHandlers {
  const [dragOver, setDragOver] = useState(false)
  const depthRef = useRef(0)

  const onDragEnter = useCallback((event: DragEvent<HTMLElement>) => {
    if (!isFileDrag(event)) return
    event.preventDefault()
    depthRef.current += 1
    setDragOver(true)
  }, [])

  const onDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    if (!isFileDrag(event)) return
    event.preventDefault()
    depthRef.current = Math.max(0, depthRef.current - 1)
    if (depthRef.current === 0) {
      setDragOver(false)
    }
  }, [])

  const onDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    if (!isFileDrag(event)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (!isFileDrag(event)) return
      event.preventDefault()
      depthRef.current = 0
      setDragOver(false)

      const files = event.dataTransfer.files
      if (!files?.length) return

      onFilesDropped(files)
    },
    [onFilesDropped],
  )

  return {
    dragOver,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
  }
}
