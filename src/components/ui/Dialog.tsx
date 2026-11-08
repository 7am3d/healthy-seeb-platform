'use client'

import React, { useEffect, useRef } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  /** id of the element that names the dialog (usually its heading). */
  labelledBy?: string
  /** Classes for the dialog panel (size, padding, background, rounding). */
  className?: string
  /** Classes for the dimmed backdrop. */
  backdropClassName?: string
  /** Default size/position classes; pass your own to replace them (e.g. a full-screen viewer). */
  baseClassName?: string
  children: React.ReactNode
}

// Page scrolling stays locked while any dialog is open (dialogs can be stacked).
let openDialogs = 0
function lockScroll(change: 1 | -1) {
  openDialogs = Math.max(0, openDialogs + change)
  document.documentElement.style.overflow = openDialogs > 0 ? 'hidden' : ''
}

/**
 * Modal dialog built on the native <dialog> element: it traps focus, closes with Esc,
 * and closes when the dimmed area outside the panel is clicked.
 */
export function Dialog({
  open,
  onClose,
  labelledBy,
  className = '',
  backdropClassName = 'backdrop:bg-black/60 backdrop:backdrop-blur-sm',
  baseClassName = 'm-auto max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto',
  children,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      lockScroll(1)
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  // Leaving the page with a dialog open must release the scroll lock.
  useEffect(() => {
    const dialog = ref.current
    return () => {
      if (dialog?.open) lockScroll(-1)
    }
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={() => {
        lockScroll(-1)
        onClose()
      }}
      onClick={(event) => {
        if (event.target === ref.current) ref.current?.close()
      }}
      className={`p-0 text-start ${baseClassName} ${backdropClassName} ${className}`}
    >
      {open ? children : null}
    </dialog>
  )
}

/** The round "×" close button used by every dialog in the design. */
export function DialogCloseButton({
  onClick,
  label,
  className = 'absolute top-4 end-4 h-9 w-9 rounded-xl bg-surface-container-low text-xl font-bold hover:bg-surface-container-high',
}: {
  onClick: () => void
  label: string
  className?: string
}) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className={className}>
      ×
    </button>
  )
}
