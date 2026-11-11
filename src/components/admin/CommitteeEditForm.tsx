
'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { updateCommittee } from '@/app/(frontend)/[locale]/admin-portal/actions'
import { Dialog, DialogCloseButton } from '@/components/ui/Dialog'
import type { Locale } from '@/i18n/routing'

type Committee = {
  id: number
  name: string
  code: string
  description: string
  shortDescription: string
  email: string
  chairName: string
  chairEmail: string
  chairTitle: string
  rapporteurName: string
  rapporteurTitle: string
  members: { name: string; title: string }[]
  responsibilities: { text: string }[]
  suggestionsPrompt: string
  suggestionsText: string
}

type Props = {
  committee: Committee
  locale: Locale
  onClose: () => void
  onSaved: () => void
}

export function CommitteeEditForm({
  committee,
  locale,
  onClose,
  onSaved,
}: Props) {
  const ar = locale === 'ar'
  const router = useRouter()

  const [form, setForm] = useState({
    description: committee.description,
    shortDescription: committee.shortDescription,
    email: committee.email,
    chairName: committee.chairName,
    chairEmail: committee.chairEmail,
    chairTitle: committee.chairTitle,
    rapporteurName: committee.rapporteurName,
    rapporteurTitle: committee.rapporteurTitle,
    members: committee.members.map((member) => ({ ...member })),
    responsibilities: committee.responsibilities.map((item) => ({ ...item })),
    suggestionsPrompt: committee.suggestionsPrompt,
    suggestionsText: committee.suggestionsText,
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const labels = {
    title: ar ? 'تعديل بيانات اللجنة' : 'Edit committee',
    description: ar ? 'الوصف' : 'Description',
    shortDescription: ar ? 'نبذة مختصرة' : 'Short description',
    email: ar ? 'البريد الإلكتروني للجنة' : 'Committee email',
    chair: ar ? 'بيانات رئيس اللجنة' : 'Chair details',
    chairName: ar ? 'اسم الرئيس' : 'Chair name',
    chairEmail: ar ? 'البريد الإلكتروني للرئيس' : 'Chair email',
    chairTitle: ar ? 'المسمى الوظيفي للرئيس' : 'Chair title',
    rapporteur: ar ? 'بيانات مقرر اللجنة' : 'Rapporteur details',
    rapporteurName: ar ? 'اسم المقرر' : 'Rapporteur name',
    rapporteurTitle: ar ? 'المسمى الوظيفي للمقرر' : 'Rapporteur title',
    members: ar ? 'أعضاء اللجنة' : 'Public members',
    memberName: ar ? 'اسم العضو' : 'Member name',
    memberTitle: ar ? 'المسمى الوظيفي' : 'Member title',
    addMember: ar ? 'إضافة عضو' : 'Add member',
    responsibilities: ar ? 'المهام والمسؤوليات' : 'Responsibilities',
    responsibility: ar ? 'المسؤولية' : 'Responsibility',
    addResponsibility: ar ? 'إضافة مسؤولية' : 'Add responsibility',
    suggestions: ar ? 'المقترحات' : 'Suggestions',
    suggestionsPrompt: ar ? 'عنوان قسم المقترحات' : 'Suggestions prompt',
    suggestionsText: ar ? 'نص المقترحات' : 'Suggestions text',
    save: ar ? 'حفظ التغييرات' : 'Save changes',
    cancel: ar ? 'إلغاء' : 'Cancel',
    saving: ar ? 'جارٍ الحفظ...' : 'Saving...',
    remove: ar ? 'حذف' : 'Remove',
    required: ar ? 'يرجى تعبئة الحقول المطلوبة.' : 'Please complete the required fields.',
    invalidEmail: ar ? 'البريد الإلكتروني غير صحيح.' : 'Please enter a valid email address.',
    saveError: ar ? 'تعذر حفظ التغييرات. حاول مرة أخرى.' : 'Could not save changes. Please try again.',
    auth: ar ? 'انتهت صلاحية الجلسة أو ليس لديك صلاحية التعديل.' : 'Your session expired or you do not have permission to edit.',
    notFound: ar ? 'اللجنة غير موجودة.' : 'Committee not found.',
    invalid: ar ? 'يرجى مراجعة البيانات المدخلة.' : 'Please check the entered information.',
  }

  function updateField(
    field: keyof typeof form,
    value: string,
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateMember(
    index: number,
    field: 'name' | 'title',
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      members: current.members.map((member, i) =>
        i === index ? { ...member, [field]: value } : member,
      ),
    }))
  }

  function updateResponsibility(index: number, value: string) {
    setForm((current) => ({
      ...current,
      responsibilities: current.responsibilities.map((item, i) =>
        i === index ? { text: value } : item,
      ),
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!form.chairName.trim() || !form.rapporteurName.trim()) {
      setError(labels.required)
      return
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (
      (form.email && !emailPattern.test(form.email)) ||
      (form.chairEmail && !emailPattern.test(form.chairEmail))
    ) {
      setError(labels.invalidEmail)
      return
    }

    if (
      form.members.some((member) => !member.name.trim()) ||
      form.responsibilities.some((item) => !item.text.trim())
    ) {
      setError(labels.required)
      return
    }

    setSaving(true)

    try {
      const result = await updateCommittee({
        id: committee.id,
        ...form,
      })

      if (!result.ok) {
        setError(
          result.error === 'auth'
            ? labels.auth
            : result.error === 'notFound'
              ? labels.notFound
              : result.error === 'invalid'
                ? labels.invalid
                : labels.saveError,
        )
        return
      }

      router.refresh()
      onSaved()
    } catch {
      setError(labels.saveError)
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'mt-2 w-full rounded-lg border border-outline-variant bg-white px-3 py-3 text-body-md text-on-surface outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15'

  const sectionClass =
    'border-b border-outline-variant/50 pb-6 last:border-0'

  return (
    <Dialog
      open
      onClose={onClose}
      labelledBy="committee-edit-title"
      className="max-w-3xl rounded-xl bg-white shadow-xl"
    >
      <div className="relative p-5 sm:p-8" dir={ar ? 'rtl' : 'ltr'}>
        <DialogCloseButton onClick={onClose} label={labels.cancel} />

        <div className="mb-7 pe-10">
          <h2
            id="committee-edit-title"
            className="text-headline-lg text-primary"
          >
            {labels.title}
          </h2>
          <p className="mt-2 text-body-sm text-on-surface-variant">
            {committee.name} · {committee.code}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          <section className={sectionClass}>
            <h3 className="mb-4 text-headline-md text-primary">
              {labels.description}
            </h3>

            <label className="block text-label-md text-on-surface">
              {labels.description}
              <textarea
                className={inputClass}
                rows={4}
                maxLength={300}
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </label>

            <label className="mt-4 block text-label-md text-on-surface">
              {labels.shortDescription}
              <textarea
                className={inputClass}
                rows={2}
                maxLength={160}
                value={form.shortDescription}
                onChange={(e) => updateField('shortDescription', e.target.value)}
              />
            </label>

            <label className="mt-4 block text-label-md text-on-surface">
              {labels.email}
              <input
                type="email"
                className={inputClass}
                dir="ltr"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
            </label>
          </section>

          <section className={sectionClass}>
            <h3 className="mb-4 text-headline-md text-primary">
              {labels.chair}
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-label-md text-on-surface">
                {labels.chairName}
                <input
                  required
                  className={inputClass}
                  value={form.chairName}
                  onChange={(e) => updateField('chairName', e.target.value)}
                />
              </label>

              <label className="block text-label-md text-on-surface">
                {labels.chairTitle}
                <input
                  className={inputClass}
                  value={form.chairTitle}
                  onChange={(e) => updateField('chairTitle', e.target.value)}
                />
              </label>

              <label className="block text-label-md text-on-surface sm:col-span-2">
                {labels.chairEmail}
                <input
                  type="email"
                  dir="ltr"
                  className={inputClass}
                  value={form.chairEmail}
                  onChange={(e) => updateField('chairEmail', e.target.value)}
                />
              </label>
            </div>
          </section>

          <section className={sectionClass}>
            <h3 className="mb-4 text-headline-md text-primary">
              {labels.rapporteur}
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-label-md text-on-surface">
                {labels.rapporteurName}
                <input
                  required
                  className={inputClass}
                  value={form.rapporteurName}
                  onChange={(e) => updateField('rapporteurName', e.target.value)}
                />
              </label>

              <label className="block text-label-md text-on-surface">
                {labels.rapporteurTitle}
                <input
                  className={inputClass}
                  value={form.rapporteurTitle}
                  onChange={(e) => updateField('rapporteurTitle', e.target.value)}
                />
              </label>
            </div>
          </section>

          <section className={sectionClass}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-headline-md text-primary">{labels.members}</h3>
              <button
                type="button"
                disabled={form.members.length >= 60}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    members: [...current.members, { name: '', title: '' }],
                  }))
                }
                className="rounded-lg bg-mint px-3 py-2 text-label-sm text-secondary disabled:opacity-50"
              >
                + {labels.addMember}
              </button>
            </div>

            <div className="space-y-3">
              {form.members.map((member, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-lg bg-surface-container-low p-3 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <input
                    aria-label={labels.memberName}
                    placeholder={labels.memberName}
                    className={inputClass}
                    value={member.name}
                    onChange={(e) => updateMember(index, 'name', e.target.value)}
                  />
                  <input
                    aria-label={labels.memberTitle}
                    placeholder={labels.memberTitle}
                    className={inputClass}
                    value={member.title}
                    onChange={(e) => updateMember(index, 'title', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        members: current.members.filter((_, i) => i !== index),
                      }))
                    }
                    className="rounded-lg px-3 py-2 text-label-sm text-error hover:bg-error/10"
                  >
                    {labels.remove}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className={sectionClass}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-headline-md text-primary">
                {labels.responsibilities}
              </h3>
              <button
                type="button"
                disabled={form.responsibilities.length >= 40}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    responsibilities: [...current.responsibilities, { text: '' }],
                  }))
                }
                className="rounded-lg bg-mint px-3 py-2 text-label-sm text-secondary disabled:opacity-50"
              >
                + {labels.addResponsibility}
              </button>
            </div>

            <div className="space-y-3">
              {form.responsibilities.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <textarea
                    aria-label={`${labels.responsibility} ${index + 1}`}
                    placeholder={labels.responsibility}
                    rows={2}
                    maxLength={600}
                    className={inputClass}
                    value={item.text}
                    onChange={(e) => updateResponsibility(index, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        responsibilities: current.responsibilities.filter(
                          (_, i) => i !== index,
                        ),
                      }))
                    }
                    className="mt-2 rounded-lg px-3 py-2 text-label-sm text-error hover:bg-error/10"
                  >
                    {labels.remove}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className={sectionClass}>
            <h3 className="mb-4 text-headline-md text-primary">
              {labels.suggestions}
            </h3>

            <label className="block text-label-md text-on-surface">
              {labels.suggestionsPrompt}
              <input
                className={inputClass}
                maxLength={2000}
                value={form.suggestionsPrompt}
                onChange={(e) => updateField('suggestionsPrompt', e.target.value)}
              />
            </label>

            <label className="mt-4 block text-label-md text-on-surface">
              {labels.suggestionsText}
              <textarea
                className={inputClass}
                rows={4}
                maxLength={10000}
                value={form.suggestionsText}
                onChange={(e) => updateField('suggestionsText', e.target.value)}
              />
            </label>
          </section>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-error/10 p-3 text-body-sm text-error"
            >
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-outline-variant/50 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg bg-surface-container px-6 py-3 text-label-md text-primary hover:bg-surface-container-high disabled:opacity-50"
            >
              {labels.cancel}
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-6 py-3 text-label-md text-white transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? labels.saving : labels.save}
            </button>
          </div>
        </form>
      </div>
    </Dialog>
  )
}
