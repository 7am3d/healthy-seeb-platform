import { ICON_PATHS, type IconName } from './icon-paths'

type Props = {
  name: IconName
  className?: string
  /** Accessible label. Without it the icon is decorative and hidden from screen readers. */
  label?: string
}

/**
 * Material Symbols icon as inline SVG (no 3 MB icon font to download).
 * Size it like text: the prototype's `text-[32px]` / `text-base` classes work as-is,
 * because the icon is 1em × 1em and uses the current text colour.
 */
export function Icon({ name, className = '', label }: Props) {
  return (
    <svg
      viewBox="0 -960 960 960"
      width="1em"
      height="1em"
      fill="currentColor"
      className={`inline-block shrink-0 ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  )
}

export type { IconName }
