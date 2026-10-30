import markup from '../components/animated-checklist/animated-checklist.html?raw'
import '../components/animated-checklist/AnimatedChecklist.css'
import './AnimatedChecklistDemo.css'

export function AnimatedChecklistDemo() {
  return (
    <form className="animated-checklist-demo">
      <div dangerouslySetInnerHTML={{ __html: markup }} />
      <button type="reset">Reset list</button>
    </form>
  )
}
