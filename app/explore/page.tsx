'use client'

import { useMemo } from 'react'
import { Screen } from '@/components/screen'
import { Deck } from '@/components/explore/deck'
import { EXPERIENCES } from '@/lib/data'
import { rankExperiences } from '@/lib/helpers'
import { useTrip } from '@/lib/trip-context'

export default function ExplorePage() {
  const { prefs, saved, passed } = useTrip()

  const ambient = useMemo(() => {
    const seen = new Set([...saved, ...passed])
    const next = rankExperiences(
      EXPERIENCES.filter((e) => !seen.has(e.id)),
      prefs,
    )[0]
    return (next ?? EXPERIENCES[0]).posterUrl
  }, [prefs, saved, passed])

  return (
    <Screen bg="void" ambientImage={ambient} showNav>
      <Deck />
    </Screen>
  )
}
