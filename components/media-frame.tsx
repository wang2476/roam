'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Renders a looping muted video when a real file is present; otherwise the
 * poster image. If the video 404s or errors, it silently falls back to the
 * poster. The user never sees a broken player or a black rectangle.
 */
export function MediaFrame({
  posterUrl,
  videoUrl,
  active = true,
  muted = true,
  alt,
  className,
  imgClassName,
}: {
  posterUrl: string
  videoUrl: string | null
  active?: boolean
  muted?: boolean
  alt: string
  className?: string
  imgClassName?: string
}) {
  const [videoOk, setVideoOk] = useState(Boolean(videoUrl))
  const [imgOk, setImgOk] = useState(true)
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = ref.current
    if (!v || !videoOk) return
    if (active) {
      v.play().catch(() => {})
    } else {
      v.pause()
    }
  }, [active, videoOk])

  const showVideo = videoUrl && videoOk

  return (
    <div className={cn('relative overflow-hidden bg-void', className)}>
      {showVideo ? (
        <video
          ref={ref}
          className="h-full w-full object-cover"
          poster={posterUrl}
          autoPlay={active}
          muted={muted}
          loop
          playsInline
          preload="metadata"
          onError={() => setVideoOk(false)}
          aria-label={alt}
        />
      ) : imgOk ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posterUrl || '/placeholder.svg'}
          alt={alt}
          className={cn('h-full w-full object-cover', imgClassName)}
          onError={() => setImgOk(false)}
          draggable={false}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-void to-[#2a2622]">
          <span className="text-label text-cream-55 px-6 text-center text-balance">
            {alt}
          </span>
        </div>
      )}
    </div>
  )
}
