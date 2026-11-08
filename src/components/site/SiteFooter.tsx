import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'

import { INFO_EMAIL, OpenContributeButton, OpenTermsButton } from './SiteModals'

const PHONE = '+96824420000'

export async function SiteFooter() {
  const t = await getTranslations('site')

  const linkClass = 'text-[#b5d0e2] hover:text-sand transition-colors'

  return (
    <footer id="footer-section" className="w-full bg-primary pt-space-xl pb-space-lg text-white">
      <div className="mx-auto w-full max-w-[1280px] px-margin">
        <div className="mb-space-xl grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-space-md">
            {/* TODO: replace with the white logo file from the UI/UX team */}
            <Image
              src="/brand/logo-horizontal.png"
              alt={t('logoAlt')}
              width={290}
              height={120}
              className="h-24 w-auto self-start object-contain brightness-0 invert"
            />
            <p className="text-body-sm leading-relaxed text-[#b5d0e2]">{t('footer.about')}</p>
          </div>

          <div className="flex flex-col gap-space-sm">
            <h3 className="mb-space-xs text-section-title text-white">{t('footer.quickLinks')}</h3>
            <ul className="flex flex-col gap-space-xs">
              <li className="text-body-sm">
                <Link className={linkClass} href="/">
                  {t('footer.links.home')}
                </Link>
              </li>
              <li className="text-body-sm">
                <Link className={linkClass} href="/about">
                  {t('footer.links.about')}
                </Link>
              </li>
              <li className="text-body-sm">
                <Link className={linkClass} href="/#committees-section">
                  {t('footer.links.committees')}
                </Link>
              </li>
              <li className="text-body-sm">
                <Link className={linkClass} href="/#map-section">
                  {t('footer.links.map')}
                </Link>
              </li>
              <li className="text-body-sm">
                <Link className={linkClass} href="/news">
                  {t('footer.links.media')}
                </Link>
              </li>
              <li className="text-body-sm">
                {/* The privacy terms are part of the terms dialog (personal data, item 4). */}
                <OpenTermsButton className={`${linkClass} cursor-pointer`}>
                  {t('footer.links.privacy')}
                </OpenTermsButton>
              </li>
              <li className="text-body-sm">
                <OpenTermsButton className={`${linkClass} cursor-pointer`}>
                  {t('footer.links.terms')}
                </OpenTermsButton>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-space-sm">
            <h3 className="mb-space-xs text-section-title text-white">
              {t('footer.contactTitle')}
            </h3>
            <div className="flex flex-col gap-space-xs text-body-sm text-[#b5d0e2]">
              <p>{t('footer.address')}</p>
              <p>
                {t('footer.email')}{' '}
                <a href={`mailto:${INFO_EMAIL}`} className="hover:text-sand" dir="ltr">
                  {INFO_EMAIL}
                </a>
              </p>
              <p>
                {t('footer.phone')}{' '}
                <a href={`tel:${PHONE}`} className="hover:text-sand" dir="ltr">
                  +968 2442 0000
                </a>
              </p>
            </div>
          </div>

          <div id="contact-us" className="flex flex-col gap-space-sm">
            <h3 className="mb-space-xs text-section-title text-white">
              {t('footer.partnershipTitle')}
            </h3>
            <p className="text-body-sm leading-relaxed text-[#b5d0e2]">
              {t('footer.partnershipText')}
            </p>
            <div className="mt-space-xs">
              <OpenContributeButton className="inline-block cursor-pointer rounded-sm bg-sand px-space-md py-space-xs text-label-md font-bold text-primary transition-all duration-200 hover:brightness-105">
                {t('footer.contribute')}
              </OpenContributeButton>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-space-sm border-t border-white/15 pt-space-md text-label-sm text-[#b5d0e2] sm:flex-row">
          <p>{t('footer.rights')}</p>
          <p>{t('footer.vision')}</p>
        </div>
      </div>
    </footer>
  )
}
