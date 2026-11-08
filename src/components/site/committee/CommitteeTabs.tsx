'use client'

import React, { useRef, useState } from 'react'

type Tab = { key: string; label: string; content: React.ReactNode }

/** Accessible tabs styled like the prototype's committee tabs (sand underline on the active tab). */
export function CommitteeTabs({ tabs, label }: { tabs: Tab[]; label: string }) {
  const [active, setActive] = useState(tabs[0]?.key)
  const buttons = useRef<Array<HTMLButtonElement | null>>([])

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const rtl = document.documentElement.dir === 'rtl'
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight'
    const back = rtl ? 'ArrowRight' : 'ArrowLeft'
    let next = index
    if (event.key === forward) next = (index + 1) % tabs.length
    else if (event.key === back) next = (index - 1 + tabs.length) % tabs.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = tabs.length - 1
    else return
    event.preventDefault()
    setActive(tabs[next].key)
    buttons.current[next]?.focus()
  }

  return (
    <>
      <div className="mb-space-xl border-b border-outline-variant/40">
        <div
          role="tablist"
          aria-label={label}
          className="flex items-center gap-space-lg overflow-x-auto"
        >
          {tabs.map((tab, index) => {
            const selected = tab.key === active
            return (
              <button
                key={tab.key}
                ref={(element) => {
                  buttons.current[index] = element
                }}
                id={`tab-${tab.key}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls={`panel-${tab.key}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(tab.key)}
                onKeyDown={(event) => onKeyDown(event, index)}
                className={`cursor-pointer border-b-4 pb-space-sm text-headline-md font-bold whitespace-nowrap transition-colors ${
                  selected
                    ? 'border-sand text-primary'
                    : 'border-transparent text-outline hover:text-primary'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.key}
          id={`panel-${tab.key}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.key}`}
          hidden={tab.key !== active}
          tabIndex={0}
          className="focus:outline-none"
        >
          {tab.content}
        </div>
      ))}
    </>
  )
}
