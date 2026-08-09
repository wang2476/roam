'use client'

import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { Screen } from '@/components/screen'
import { MediaFrame } from '@/components/media-frame'
import { CITY_IMAGE } from '@/lib/data'
import { useTrip } from '@/lib/trip-context'

export default function SplashPage() {
  const router = useRouter()
  const { loadDemoProfile } = useTrip()

  return (
    <Screen bg="void">
      <div className="media-scrim relative flex h-full min-h-[100dvh] flex-col justify-end lg:min-h-0">
        <div className="absolute inset-0">
          <MediaFrame
            posterUrl={CITY_IMAGE.Tokyo}
            videoUrl="/video/tokyo-dusk.mp4"
            alt="A Tokyo street at dusk"
            active
            className="h-full w-full"
          />
          <div className="absolute inset-0 bg-void/40" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col gap-5 px-6 pb-[max(40px,env(safe-area-inset-bottom))]"
        >
          <div>
            <h1
              className="text-cream"
              style={{ fontSize: 56, lineHeight: '58px', fontWeight: 300, letterSpacing: '-0.03em' }}
            >
              Ikou
            </h1>
            <p className="text-body mt-2 text-cream-70">Swipe now, plan later.</p>
          </div>

          <button
            onClick={() => router.push('/onboarding')}
            className="text-body w-full rounded-full bg-cream py-4 font-medium text-void transition active:scale-[0.98]"
          >
            Start
          </button>

          <button
            onClick={() => {
              loadDemoProfile()
              router.push('/explore')
            }}
            className="text-meta text-cream/70 transition active:text-cream"
          >
            I already have a trip
          </button>
        </motion.div>
      </div>
    </Screen>
  )
}
