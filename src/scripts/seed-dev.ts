/**
 * Fills a LOCAL development database with the content of the UI/UX prototypes:
 * test accounts, the 7 committees (members, responsibilities), their posts,
 * map places and sample requests. Never run this against production.
 *
 *   npm run seed:dev
 *
 * Test accounts (same as the prototype):
 *   Admin: admin@seebhealthy.om / Admin@2026
 *   Staff: test@seebhealthy.om  / Seeb@2026  (chair of the Health Committee)
 *
 * Photos and PDFs are generated placeholders (the prototype's photos are not part of the project).
 */
import config from '@payload-config'
import { getPayload } from 'payload'
import sharp from 'sharp'

import type { Committee, Media, Post, User } from '@/payload-types'

import seed from './seed-data.json'

if (process.env.NODE_ENV === 'production') {
  throw new Error('seed-dev must not run in production.')
}

const payload = await getPayload({ config })

const existing = await payload.find({
  collection: 'users',
  where: { email: { equals: 'admin@seebhealthy.om' } },
  limit: 1,
  overrideAccess: true,
})
if (existing.docs.length > 0) {
  payload.logger.info(
    'Seed data already exists (admin@seebhealthy.om found). To start again, empty the database first.',
  )
  process.exit(0)
}

// ---------- helpers ----------

const richText = (text: string) => ({
  root: {
    type: 'root',
    version: 1,
    direction: 'rtl' as const,
    format: '' as const,
    indent: 0,
    children: text
      .split('\n')
      .filter(Boolean)
      .map((paragraph) => ({
        type: 'paragraph',
        version: 1,
        direction: 'rtl' as const,
        format: '' as const,
        indent: 0,
        textFormat: 0,
        children: [
          {
            type: 'text',
            version: 1,
            text: paragraph,
            format: 0,
            detail: 0,
            mode: 'normal',
            style: '',
          },
        ],
      })),
  },
})

const PALETTE = [
  ['#014260', '#116e68'],
  ['#116e68', '#85d4cd'],
  ['#b79f7d', '#014260'],
  ['#1d5c7a', '#b79f7d'],
  ['#0e4a46', '#e2efe7'],
]
let imageCount = 0

/** A soft brand-coloured placeholder photo. */
async function placeholderImage(alt: string): Promise<Media> {
  const [from, to] = PALETTE[imageCount++ % PALETTE.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
    <rect width="1200" height="675" fill="url(#g)"/>
    <path d="M0,520 C200,440 420,600 640,520 C860,440 1040,560 1200,500 L1200,675 L0,675 Z" fill="#ffffff" fill-opacity="0.18"/>
    <path d="M0,580 C260,520 480,650 760,580 C960,530 1100,610 1200,590 L1200,675 L0,675 Z" fill="#ffffff" fill-opacity="0.15"/>
  </svg>`
  const data = await sharp(Buffer.from(svg)).jpeg({ quality: 80 }).toBuffer()
  return payload.create({
    collection: 'media',
    data: { alt },
    file: {
      data,
      mimetype: 'image/jpeg',
      name: `placeholder-${imageCount}.jpg`,
      size: data.length,
    },
    overrideAccess: true,
  })
}

/** A one-page PDF placeholder. */
async function placeholderPdf(name: string): Promise<Media> {
  // A minimal valid PDF, with the cross-reference table Payload checks for.
  const objects = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>',
  ]
  let body = '%PDF-1.4\n'
  const offsets = objects.map((object, index) => {
    const offset = body.length
    body += `${index + 1} 0 obj${object}endobj\n`
    return offset
  })
  const xref = body.length
  body +=
    `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` +
    offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('') +
    `trailer<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`
  const pdf = Buffer.from(body, 'latin1')
  return payload.create({
    collection: 'media',
    data: { alt: name },
    file: { data: pdf, mimetype: 'application/pdf', name, size: pdf.length },
    overrideAccess: true,
  })
}

// ---------- users ----------

const admin: User = await payload.create({
  collection: 'users',
  data: {
    email: 'admin@seebhealthy.om',
    password: 'Admin@2026',
    name: 'الدكتورة علياء بنت علي الحسني',
    globalRole: 'administrator',
    isActive: true,
  },
  overrideAccess: true,
})

const staff: User = await payload.create({
  collection: 'users',
  data: {
    email: 'test@seebhealthy.om',
    password: 'Seeb@2026',
    name: 'الدكتورة فتحية بنت سليمان القصابي',
    globalRole: 'staff',
    isActive: true,
  },
  overrideAccess: true,
})

// ---------- committees and their posts ----------

const committees: Record<string, Committee> = {}
let postCount = 0

for (const item of seed.committees) {
  const committee = await payload.create({
    collection: 'committees',
    data: {
      name: item.name,
      code: item.code,
      description: item.description,
      shortDescription: item.shortDescription,
      icon: item.icon as Committee['icon'],
      sortOrder: item.sortOrder,
      isActive: true,
      chairName: item.chairName,
      chairTitle: item.chairTitle,
      chairEmail: item.chairEmail,
      email: `${item.code}.committee@seebhealthy.om`,
      rapporteurName: item.rapporteurName,
      rapporteurTitle: item.rapporteurTitle,
      members: item.members,
      responsibilities: item.responsibilities.map((text) => ({ text })),
      suggestionsPrompt: item.suggestionsPrompt,
      suggestionsText: item.suggestionsText,
      _status: 'published',
    },
    overrideAccess: true,
  })
  committees[item.code] = committee

  for (const post of item.posts) {
    const cover = post.hasImage ? await placeholderImage(post.title) : null
    const gallery = []
    for (let i = 0; i < Math.min(post.galleryCount, 3); i++) {
      gallery.push({ image: (await placeholderImage(`${post.title} ${i + 1}`)).id })
    }
    const attachment = post.pdfName ? await placeholderPdf(post.pdfName) : null

    await payload.create({
      collection: 'posts',
      data: {
        title: post.title,
        slug: `${item.code}-${++postCount}`,
        summary: post.summary ? post.summary.slice(0, 500) : undefined,
        content: richText(post.summary || post.title),
        type: post.type as Post['type'],
        status: 'approved',
        committee: committee.id,
        author: item.code === 'health' ? staff.id : admin.id,
        eventDate: post.eventDate ?? undefined,
        location: post.location ?? undefined,
        coverImage: cover?.id,
        gallery,
        attachment: attachment?.id,
      },
      // The Posts hooks need a signed-in user; the admin "approves" the seeded posts.
      user: admin,
      overrideAccess: true,
    })
  }
}

// Staff member: chair of the Health Committee.
await payload.create({
  collection: 'committee-memberships',
  data: { user: staff.id, committee: committees.health.id, role: 'chair', isActive: true },
  overrideAccess: true,
})

// A draft and a rejected post, so the staff portal shows every status.
for (const [status, title] of [
  ['draft', 'دعوة للمشاركة في استبانة رصد الاحتياجات الصحية لذوي الإعاقة بولاية السيب'],
  ['rejected', 'تقرير الربع الأول ٢٠٢٦ – مؤشرات الأداء الصحي'],
] as const) {
  await payload.create({
    collection: 'posts',
    data: {
      title,
      slug: `health-${++postCount}`,
      content: richText(title),
      type: status === 'draft' ? 'announcement' : 'report',
      status,
      committee: committees.health.id,
      author: staff.id,
      rejectionReason: status === 'rejected' ? 'يرجى إرفاق ملف التقرير قبل الإرسال.' : undefined,
    },
    user: admin,
    overrideAccess: true,
  })
}

// ---------- map places ----------

for (const place of seed.places) {
  await payload.create({
    collection: 'places',
    data: {
      name: place.name,
      category: place.category as never,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      googleMapsUrl: place.googleMapsUrl,
      committees: place.committees.map((code) => committees[code].id),
      showOnHomeMap: place.showOnHomeMap,
      isActive: true,
    },
    overrideAccess: true,
  })
}

// ---------- sample requests (from the referrals / inbox prototypes) ----------

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString()

const requests = [
  {
    kind: 'contribution',
    type: 'partnership',
    submitterType: 'organization',
    name: 'عيادة الأمل الطبية',
    email: 'info@example.com',
    message:
      'شراكة لتنظيم فحوصات مجانية للسكري وضغط الدم\nتقترح العيادة توفير فريق طبي وأجهزة فحص لإقامة يوم صحي مفتوح بالتعاون مع اللجنة الصحية، دون أي تكلفة على المبادرة.',
    reviewStatus: 'referred',
    followUpStatus: 'new',
    referralNote: 'تمت الموافقة من الإدارة، يرجى التنسيق مع العيادة لتحديد الموعد والمكان.',
    referredAt: daysAgo(2),
    notes: [],
  },
  {
    kind: 'contribution',
    type: 'volunteering',
    submitterType: 'individual',
    name: 'ريم بنت علي البوسعيدية',
    email: 'reem.b@example.com',
    message:
      'التطوع في حملات التوعية الصحية\nممرضة متقاعدة أرغب في المشاركة في حملات التوعية بالأمراض المزمنة وقياس ضغط الدم في الفعاليات المجتمعية.',
    reviewStatus: 'referred',
    followUpStatus: 'in-progress',
    referredAt: daysAgo(4),
    notes: [{ note: 'تم التواصل مع المتطوعة وإضافتها لفريق الملتقى التوعوي.', date: daysAgo(3) }],
  },
  {
    kind: 'message',
    type: 'suggestion',
    submitterType: 'visitor',
    name: 'سعاد بنت ناصر الحبسية',
    email: 'suad.h@example.com',
    message: 'تخصيص مسار آمن للمشي حول مركز السيب الصحي مع لوحات توعوية.',
    reviewStatus: 'referred',
    followUpStatus: 'contacted',
    referredAt: daysAgo(6),
    notes: [{ note: 'تم الرد على صاحبة المقترح ودراسته مع البلدية.', date: daysAgo(4) }],
  },
  {
    kind: 'message',
    type: 'complaint',
    submitterType: 'visitor',
    name: '',
    email: 'visitor.seeb@example.com',
    message: 'طول فترة الانتظار في مركز السيب الصحي خلال الفترة المسائية.',
    reviewStatus: 'referred',
    followUpStatus: 'completed',
    referredAt: daysAgo(14),
    notes: [
      { note: 'رُفعت الشكوى لإدارة المركز.', date: daysAgo(12) },
      { note: 'أُضيف طبيب في الفترة المسائية، وتم إبلاغ صاحب الشكوى.', date: daysAgo(8) },
    ],
  },
  {
    kind: 'message',
    type: 'suggestion',
    submitterType: 'visitor',
    name: 'خالد بن سعيد الهنائي',
    email: 'khalid.h@example.com',
    message: 'إضافة حاويات لإعادة التدوير في الحدائق العامة.',
    reviewStatus: 'new',
    notes: [],
  },
] as const

for (const { notes, ...request } of requests) {
  await payload.create({
    collection: 'requests',
    data: {
      ...request,
      followUpNotes: notes.map((note) => ({ ...note, author: staff.id })),
      committee: committees.health.id,
      agreedToTerms: true,
      sourcePage: '/ar/committees/health',
    },
    user: admin,
    overrideAccess: true,
  })
}

payload.logger.info(
  `Seed complete: 2 users, ${seed.committees.length} committees, ${postCount} posts, ${seed.places.length} places, ${requests.length} requests.`,
)
process.exit(0)
