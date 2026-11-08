/**
 * Fills a LOCAL development database with test accounts, the 7 committees and sample posts,
 * matching the UI/UX prototype. Never run this against production.
 *
 *   npm run seed:dev
 *
 * Test accounts (same as the prototype):
 *   Admin: admin@seebhealthy.om / Admin@2026
 *   Staff: test@seebhealthy.om  / Seeb@2026  (chair of the Health Committee)
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import type { Post } from '@/payload-types'

if (process.env.NODE_ENV === 'production') {
  throw new Error('seed-dev must not run in production.')
}

const committees = [
  { code: 'health', name: 'اللجنة الصحية' },
  { code: 'education', name: 'لجنة التعليم' },
  { code: 'social', name: 'اللجنة الاجتماعية' },
  { code: 'environment', name: 'لجنة البيئة والسلامة المهنية' },
  { code: 'media', name: 'اللجنة الإعلامية' },
  { code: 'economy', name: 'اللجنة الاقتصادية' },
  { code: 'emergency', name: 'لجنة الطوارئ والأزمات' },
]

const posts: Array<{ title: string; type: Post['type']; status: Post['status']; summary: string }> =
  [
    {
      title: 'الملتقى التوعوي لصحة الأم والطفل والتغذية المدرسية',
      type: 'activity',
      status: 'submitted',
      summary:
        'جلسات حوارية تثقيفية تستهدف أولياء الأمور والكوادر التعليمية بالتعاون مع مدارس ولاية السيب.',
    },
    {
      title: 'حملة الكشف المبكر عن الأمراض غير المعدية بممشى السيب',
      type: 'activity',
      status: 'approved',
      summary:
        'حملة مجتمعية ميدانية للفحوصات الطبية المبكرة وقياس مؤشرات السكري وضغط الدم لمرتادي ممشى السيب.',
    },
    {
      title: 'بدء التسجيل في برنامج المتطوع الصحي المجتمعي لقرى ومناطق ولاية السيب',
      type: 'announcement',
      status: 'approved',
      summary: 'فتح باب التسجيل لبرنامج المتطوع الصحي المجتمعي لتدريب وتأهيل أبناء وبنات الولاية.',
    },
    {
      title: 'تحديث جدول مواعيد العيادات التخصصية المتنقلة لكبار السن في قرى الولاية',
      type: 'announcement',
      status: 'approved',
      summary: 'جدول الزيارات الدورية للعيادات التخصصية المتنقلة لكبار السن وذوي الإعاقة.',
    },
    {
      title: 'دعوة للمشاركة في استبانة رصد الاحتياجات الصحية لذوي الإعاقة بولاية السيب',
      type: 'announcement',
      status: 'draft',
      summary: 'استبانة إلكترونية لتحديد الأولويات الصحية والتأهيلية الموجهة لذوي الإعاقة.',
    },
    {
      title: 'التقرير السنوي لمؤشرات الأمراض المزمنة ونمط الحياة بولاية السيب ٢٠٢٥-٢٠٢٦',
      type: 'report',
      status: 'approved',
      summary:
        'مؤشرات الأمراض المزمنة ونمط الحياة والنتائج الإحصائية للفحوصات المبكرة والتوصيات المعتمدة.',
    },
    {
      title: 'تقرير الربع الأول ٢٠٢٦ – مؤشرات الأداء الصحي',
      type: 'report',
      status: 'rejected',
      summary: '',
    },
  ]

const richText = (text: string) => ({
  root: {
    type: 'root',
    version: 1,
    direction: 'rtl' as const,
    format: '' as const,
    indent: 0,
    children: [
      {
        type: 'paragraph',
        version: 1,
        direction: 'rtl' as const,
        format: '' as const,
        indent: 0,
        textFormat: 0,
        children: [
          { type: 'text', version: 1, text, format: 0, detail: 0, mode: 'normal', style: '' },
        ],
      },
    ],
  },
})

const payload = await getPayload({ config })

const existing = await payload.find({
  collection: 'users',
  where: { email: { equals: 'admin@seebhealthy.om' } },
  limit: 1,
  overrideAccess: true,
})

if (existing.docs.length > 0) {
  payload.logger.info('Seed data already exists (admin@seebhealthy.om found). Nothing to do.')
  process.exit(0)
}

const admin = await payload.create({
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

const staff = await payload.create({
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

const created = []
for (const committee of committees) {
  created.push(
    await payload.create({
      collection: 'committees',
      data: { ...committee, isActive: true },
      overrideAccess: true,
    }),
  )
}
const health = created[0]

await payload.create({
  collection: 'committee-memberships',
  data: { user: staff.id, committee: health.id, role: 'chair', isActive: true },
  overrideAccess: true,
})

// Created as the admin (the Posts hooks need a signed-in user), authored by the staff member.
for (const [index, post] of posts.entries()) {
  await payload.create({
    collection: 'posts',
    data: {
      title: post.title,
      slug: `health-${index + 1}`,
      summary: post.summary || undefined,
      content: richText(post.summary || post.title),
      type: post.type,
      status: post.status,
      committee: health.id,
      author: staff.id,
      rejectionReason:
        post.status === 'rejected' ? 'يرجى إرفاق ملف التقرير قبل الإرسال.' : undefined,
    },
    user: admin,
    overrideAccess: true,
  })
}

payload.logger.info('Seed complete: 2 users, 7 committees, 1 membership, 7 posts.')
process.exit(0)
