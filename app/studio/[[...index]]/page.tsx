'use client'

import dynamic from 'next/dynamic'
import sanityConfig from '../../../sanity.config'

const NextStudio = dynamic(
  // import as a named export and render only on the client
  () => import('next-sanity/studio').then((mod) => mod.NextStudio),
  { ssr: false }
)

export default function StudioPage() {
  return <NextStudio config={sanityConfig} />
}
