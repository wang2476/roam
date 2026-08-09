'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react'

type Toast = {
  id: number
  message: string
  action?: { label: string; href?: string; onClick?: () => void }
}

type ToastContextValue = {
  toast: (message: string, action?: Toast['action']) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)
  const router = useRouter()

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const toast = useCallback<ToastContextValue['toast']>(
    (message, action) => {
      const id = counter.current++
      setToasts((t) => [...t, { id, message, action }])
      setTimeout(() => remove(id), 4200)
    },
    [remove],
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[80] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="glass pointer-events-auto flex w-full max-w-[360px] items-center gap-3 rounded-full py-2.5 pr-2 pl-5 text-cream shadow-lg"
            >
              <span className="text-meta flex-1 truncate">{t.message}</span>
              {t.action && (
                <button
                  onClick={() => {
                    t.action?.onClick?.()
                    if (t.action?.href) router.push(t.action.href)
                    remove(t.id)
                  }}
                  className="text-label shrink-0 rounded-full bg-cream px-4 py-1.5 text-void transition active:scale-95"
                >
                  {t.action.label}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
