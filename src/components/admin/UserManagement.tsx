
'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import type { Locale } from '@/i18n/routing'

type Membership = {
  id: number
  committeeId: number
  committeeName: string
  role: 'chair' | 'rapporteur' | 'member'
  startDate: string
  endDate: string
}

type StaffUser = {
  id: number
  name: string
  email: string
  phone: string
  isActive: boolean
  createdAt: string
  membership: Membership | null
}

type CommitteeOption = {
  id: number
  name: string
}

type Props = {
  users: StaffUser[]
  committees: CommitteeOption[]
  locale: Locale
}

export function UserManagement({ users, committees, locale }: Props) {
  const ar = locale === 'ar'
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [selected, setSelected] = useState<StaffUser | null>(null)
  const [committeeId, setCommitteeId] = useState('')
  const [role, setRole] = useState<Membership['role']>('member')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [messageError, setMessageError] = useState(false)

  const labels = {
    title: ar ? 'إدارة المستخدمين' : 'User Management',
    description: ar
      ? 'إدارة حسابات الموظفين واللجان المسندة إليهم.'
      : 'Manage staff accounts and their committee assignments.',
    total: ar ? 'إجمالي الموظفين' : 'Total staff',
    active: ar ? 'حسابات نشطة' : 'Active accounts',
    inactive: ar ? 'حسابات غير نشطة' : 'Inactive accounts',
    search: ar ? 'ابحث بالاسم أو البريد الإلكتروني أو الهاتف' : 'Search by name, email or phone',
    all: ar ? 'جميع الحسابات' : 'All accounts',
    activeFilter: ar ? 'نشطة' : 'Active',
    inactiveFilter: ar ? 'غير نشطة' : 'Inactive',
    name: ar ? 'الاسم' : 'Name',
    email: ar ? 'البريد الإلكتروني' : 'Email',
    phone: ar ? 'رقم الهاتف' : 'Phone',
    committee: ar ? 'اللجنة' : 'Committee',
    role: ar ? 'الدور' : 'Membership role',
    account: ar ? 'حالة الحساب' : 'Account status',
    actions: ar ? 'الإجراءات' : 'Actions',
    activeStatus: ar ? 'نشط' : 'Active',
    inactiveStatus: ar ? 'غير نشط' : 'Inactive',
    noCommittee: ar ? 'غير مسند إلى لجنة' : 'Not assigned',
    assign: ar ? 'إدارة العضوية' : 'Manage membership',
    activate: ar ? 'تفعيل' : 'Activate',
    deactivate: ar ? 'تعطيل' : 'Deactivate',
    noResults: ar ? 'لا توجد حسابات مطابقة.' : 'No matching staff accounts.',
    membershipTitle: ar ? 'إدارة عضوية اللجنة' : 'Manage committee membership',
    chooseCommittee: ar ? 'اختر اللجنة' : 'Select a committee',
    noAssignment: ar ? 'بدون لجنة' : 'No committee',
    chooseRole: ar ? 'دور العضوية' : 'Membership role',
    chair: ar ? 'رئيس اللجنة' : 'Chair',
    rapporteur: ar ? 'مقرر اللجنة' : 'Rapporteur',
    member: ar ? 'عضو' : 'Member',
    startDate: ar ? 'تاريخ بداية العضوية' : 'Membership start date',
    endDate: ar ? 'تاريخ نهاية العضوية' : 'Membership end date',
    save: ar ? 'حفظ العضوية' : 'Save membership',
    remove: ar ? 'إزالة العضوية' : 'Remove membership',
    cancel: ar ? 'إلغاء' : 'Cancel',
    saving: ar ? 'جارٍ الحفظ...' : 'Saving...',
    close: ar ? 'إغلاق' : 'Close',
    confirmDeactivate: ar
      ? 'هل تريد تعطيل هذا الحساب؟'
      : 'Are you sure you want to deactivate this account?',
    confirmActivate: ar
      ? 'هل تريد تفعيل هذا الحساب؟'
      : 'Are you sure you want to activate this account?',
  }

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.toLowerCase().includes(query)

      const matchesStatus =
        status === 'all' ||
        (status === 'active' && user.isActive) ||
        (status === 'inactive' && !user.isActive)

      return matchesSearch && matchesStatus
    })
  }, [users, search, status])

  const activeCount = users.filter((user) => user.isActive).length
  const inactiveCount = users.length - activeCount

  function openMembership(user: StaffUser) {
    setSelected(user)
    setCommitteeId(user.membership ? String(user.membership.committeeId) : '')
    setRole(user.membership?.role ?? 'member')
    setStartDate(user.membership?.startDate?.slice(0, 10) ?? '')
    setEndDate(user.membership?.endDate?.slice(0, 10) ?? '')
    setMessage('')
    setMessageError(false)
  }

  async function submitAction(
    action: 'activate' | 'deactivate' | 'assign' | 'remove',
    userId: number,
  ) {
    setBusy(true)
    setMessage('')
    setMessageError(false)

    try {
      const response = await fetch('/api/admin-portal/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userId,
          committeeId: committeeId ? Number(committeeId) : null,
          role,
          startDate,
          endDate,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        setMessage(
          result.error === 'alreadyAssigned'
            ? ar
              ? 'هذه اللجنة لديها عضو نشط بالفعل.'
              : 'This committee already has an active member.'
            : result.error === 'userAssigned'
              ? ar
                ? 'هذا الموظف مسند بالفعل إلى لجنة أخرى.'
                : 'This staff member already belongs to another committee.'
              : ar
                ? 'تعذر تنفيذ العملية. تحقق من البيانات وحاول مرة أخرى.'
                : 'The operation failed. Please check the details and try again.',
        )
        setMessageError(true)
        return
      }

      setMessage(ar ? 'تم حفظ التغييرات بنجاح.' : 'Changes saved successfully.')
      router.refresh()

      if (action === 'assign' || action === 'remove') {
        setTimeout(() => setSelected(null), 500)
      }
    } catch {
      setMessage(ar ? 'حدث خطأ غير متوقع.' : 'An unexpected error occurred.')
      setMessageError(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-8" dir={ar ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-headline-xl text-primary">{labels.title}</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">
          {labels.description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: labels.total, value: users.length },
          { label: labels.active, value: activeCount },
          { label: labels.inactive, value: inactiveCount },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-outline-variant/60 bg-white p-5"
          >
            <p className="text-3xl font-bold text-primary">{item.value}</p>
            <p className="mt-2 text-label-md text-on-surface-variant">
              {item.label}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-outline-variant/60 bg-white p-4 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={labels.search}
          className="min-w-0 flex-1 rounded-lg border border-outline-variant px-4 py-3 text-body-md outline-none focus:border-secondary"
        />

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as typeof status)
          }
          className="rounded-lg border border-outline-variant bg-white px-4 py-3 text-body-md"
        >
          <option value="all">{labels.all}</option>
          <option value="active">{labels.activeFilter}</option>
          <option value="inactive">{labels.inactiveFilter}</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-outline-variant/60 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-start">
            <thead className="bg-surface-container-low">
              <tr>
                {[labels.name, labels.email, labels.phone, labels.committee, labels.account, labels.actions].map(
                  (label) => (
                    <th
                      key={label}
                      className="px-5 py-4 text-start text-label-sm font-bold text-on-surface-variant"
                    >
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-outline-variant/50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-surface-container-low/50">
                  <td className="px-5 py-4 font-bold text-primary">
                    {user.name || '—'}
                  </td>
                  <td className="px-5 py-4 text-body-sm text-on-surface-variant" dir="ltr">
                    {user.email}
                  </td>
                  <td className="px-5 py-4 text-body-sm text-on-surface-variant" dir="ltr">
                    {user.phone || '—'}
                  </td>
                  <td className="px-5 py-4 text-body-sm text-on-surface-variant">
                    {user.membership?.committeeName || labels.noCommittee}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-label-sm ${
                        user.isActive
                          ? 'bg-mint text-secondary'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {user.isActive ? labels.activeStatus : labels.inactiveStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openMembership(user)}
                        className="rounded-lg border border-primary px-3 py-2 text-label-sm text-primary hover:bg-mint"
                      >
                        {labels.assign}
                      </button>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          const action = user.isActive ? 'deactivate' : 'activate'
                          const confirmed = window.confirm(
                            user.isActive
                              ? labels.confirmDeactivate
                              : labels.confirmActivate,
                          )

                          if (confirmed) {
                            void submitAction(action, user.id)
                          }
                        }}
                        className="rounded-lg bg-surface-container px-3 py-2 text-label-sm text-primary hover:bg-surface-container-high disabled:opacity-50"
                      >
                        {user.isActive ? labels.deactivate : labels.activate}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-body-md text-on-surface-variant">
                    {labels.noResults}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) {
              setSelected(null)
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="membership-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 id="membership-title" className="text-headline-lg text-primary">
                  {labels.membershipTitle}
                </h2>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  {selected.name || selected.email}
                </p>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={() => setSelected(null)}
                className="rounded-lg px-3 py-2 text-label-sm text-on-surface-variant hover:bg-surface-container"
              >
                {labels.close}
              </button>
            </div>

            <div className="space-y-5">
              <label className="block text-label-md text-on-surface">
                {labels.committee}
                <select
                  value={committeeId}
                  onChange={(event) => setCommitteeId(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-outline-variant bg-white px-3 py-3 text-body-md"
                >
                  <option value="">{labels.noAssignment}</option>
                  {committees.map((committee) => (
                    <option key={committee.id} value={committee.id}>
                      {committee.name}
                    </option>
                  ))}
                </select>
              </label>

              {committeeId && (
                <>
                  <label className="block text-label-md text-on-surface">
                    {labels.role}
                    <select
                      value={role}
                      onChange={(event) =>
                        setRole(event.target.value as Membership['role'])
                      }
                      className="mt-2 w-full rounded-lg border border-outline-variant bg-white px-3 py-3 text-body-md"
                    >
                      <option value="chair">{labels.chair}</option>
                      <option value="rapporteur">{labels.rapporteur}</option>
                      <option value="member">{labels.member}</option>
                    </select>
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-label-md text-on-surface">
                      {labels.startDate}
                      <input
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                        className="mt-2 w-full rounded-lg border border-outline-variant px-3 py-3"
                      />
                    </label>

                    <label className="block text-label-md text-on-surface">
                      {labels.endDate}
                      <input
                        type="date"
                        min={startDate || undefined}
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                        className="mt-2 w-full rounded-lg border border-outline-variant px-3 py-3"
                      />
                    </label>
                  </div>
                </>
              )}

              {message && (
                <p
                  role="status"
                  className={`rounded-lg p-3 text-body-sm ${
                    messageError
                      ? 'bg-error/10 text-error'
                      : 'bg-mint text-secondary'
                  }`}
                >
                  {message}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-outline-variant/50 pt-5 sm:flex-row sm:justify-between">
                <div>
                  {selected.membership && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (
                          window.confirm(
                            ar
                              ? 'هل تريد إزالة عضوية هذا الموظف؟'
                              : 'Remove this staff member from the committee?',
                          )
                        ) {
                          void submitAction('remove', selected.id)
                        }
                      }}
                      className="rounded-lg px-4 py-3 text-label-sm text-error hover:bg-error/10 disabled:opacity-50"
                    >
                      {labels.remove}
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setSelected(null)}
                    className="rounded-lg bg-surface-container px-5 py-3 text-label-md text-primary"
                  >
                    {labels.cancel}
                  </button>

                  <button
                    type="button"
                    disabled={busy || !committeeId}
                    onClick={() => void submitAction('assign', selected.id)}
                    className="rounded-lg bg-primary px-5 py-3 text-label-md text-white hover:bg-secondary disabled:opacity-50"
                  >
                    {busy ? labels.saving : labels.save}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
