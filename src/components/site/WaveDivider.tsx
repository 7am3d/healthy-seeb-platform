/** The sand/green waves at the bottom of the hero banners (same as the login page). */
export function WaveDivider() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute start-0 end-0 bottom-0 z-0 w-full overflow-hidden leading-none select-none"
    >
      <svg
        className="relative block h-24 w-full md:h-36"
        preserveAspectRatio="none"
        viewBox="0 0 1200 120"
      >
        <path
          d="M0,0 C150,90 350,-40 500,60 C650,160 900,10 1200,40 L1200,120 L0,120 Z"
          fill="#b79f7d"
          fillOpacity="0.35"
        />
        <path
          d="M0,20 C200,100 450,10 650,70 C850,130 1050,40 1200,60 L1200,120 L0,120 Z"
          fill="#116e68"
          fillOpacity="0.15"
        />
      </svg>
    </div>
  )
}

export const HERO_BACKGROUND =
  'radial-gradient(ellipse at 50% 45%, #F3F9F5 0%, #E2EFE7 45%, #BFDDCB 100%)'
