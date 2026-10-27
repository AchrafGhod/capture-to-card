import demoCapture from '../assets/demo-capture.svg'
import type { CaptureToCardItem } from '../components/capture-to-card/captureToCardItem'

const DEMO_WIDTH = 1200
const DEMO_HEIGHT = 720

export const demoCaptureSrc = demoCapture

export const defaultCaptureToCardItem: CaptureToCardItem = {
  imageSrc: demoCapture,
  title: 'demo-capture.svg',
  width: DEMO_WIDTH,
  height: DEMO_HEIGHT,
  dimensionsLabel: '1,200 × 720',
  formatSizeLabel: 'SVG · 2.6 KB',
  modifiedLabel: 'Oct 27, 2026, 10:00 AM',
}
