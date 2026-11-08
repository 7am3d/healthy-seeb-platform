import { notFound } from 'next/navigation'

// Any unknown URL under /ar or /en shows the translated 404 page.
export default function CatchAllPage() {
  notFound()
}
