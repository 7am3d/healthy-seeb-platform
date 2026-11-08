'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/** The small confirmation message at the bottom corner of portal pages (UI/UX design). */
export function useToast(duration = 3500) {
  const [message, setMessage] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const show = useCallback(
    (text: string) => {
      clearTimeout(timer.current)
      setMessage(text)
      setVisible(true)
      timer.current = setTimeout(() => setVisible(false), duration)
    },
    [duration],
  )

  const toast = (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed end-6 bottom-6 z-[80] transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
      }`}
    >
      {message ? (
        <div className="flex items-center gap-space-md rounded-lg bg-primary px-space-lg py-space-md text-white shadow-xl">
          <div className="h-2 w-2 rounded-full bg-secondary-container" />
          <span className="text-label-md">{message}</span>
        </div>
      ) : null}
    </div>
  )

  return { toast, show }
}
