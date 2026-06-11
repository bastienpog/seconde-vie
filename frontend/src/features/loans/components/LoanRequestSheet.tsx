import { useMemo, useState } from 'react'
import { ApiError } from '../../../lib/api.ts'
import type { Item } from '../../items/services/itemsApi.ts'
import type { CreateLoanRequestPayload } from '../services/loansApi.ts'

type LoanRequestSheetProps = {
  error: unknown
  isOpen: boolean
  isPending: boolean
  item: Item
  onClose: () => void
  onSubmit: (payload: CreateLoanRequestPayload) => void
}

type CalendarDay = {
  date: Date
  isCurrentMonth: boolean
}

const WEEK_DAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']
const MONTH_LABELS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

export function LoanRequestSheet({ error, isOpen, isPending, item, onClose, onSubmit }: LoanRequestSheetProps) {
  const initialStartDate = useMemo(() => startOfDay(new Date()), [])
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(initialStartDate))
  const [startDate, setStartDate] = useState<Date | null>(initialStartDate)
  const [endDate, setEndDate] = useState<Date | null>(addDays(initialStartDate, 2))
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth])

  if (!isOpen) {
    return null
  }

  function handleSelectDate(date: Date) {
    const selectedDate = startOfDay(date)

    if (startDate === null || endDate !== null || selectedDate < startDate) {
      setStartDate(selectedDate)
      setEndDate(null)
      return
    }

    setEndDate(selectedDate)
  }

  function handleSubmit() {
    if (startDate === null || endDate === null) {
      return
    }

    onSubmit({
      startDate: formatDateValue(startDate),
      endDate: formatDateValue(endDate),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#2d322e]/40 backdrop-blur-[2px] sm:items-center sm:px-4">
      <button aria-label="Fermer la demande d'emprunt" className="absolute inset-0 cursor-default" onClick={onClose} type="button" />

      <section
        aria-modal="true"
        className="relative max-h-[92vh] w-full overflow-hidden rounded-t-[2rem] bg-[#f5f6f1] text-slate-950 shadow-2xl sm:max-w-md sm:rounded-[2rem]"
        role="dialog"
      >
        <div className="flex justify-center pt-3">
          <span className="h-1.5 w-12 rounded-full bg-[#c0c9c2]/50" />
        </div>

        <header className="flex items-center justify-between px-8 pb-5 pt-5">
          <h2 className="text-2xl font-extrabold tracking-tight text-[#1a4231]">Demande d'emprunt</h2>
          <button
            aria-label="Fermer"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e4e5e0]/60 text-[#1a4231] transition hover:bg-[#dde1d9]"
            onClick={onClose}
            type="button"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="max-h-[calc(92vh-8rem)] overflow-y-auto px-8 pb-28">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-base font-bold text-[#1a4231]">Dates de réservation</h3>
            <div className="flex items-center gap-2 text-sm font-medium text-[#526350]">
              <button className="rounded-full px-2 py-1 hover:bg-white" onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))} type="button">
                <span className="sr-only">Mois précédent</span>
                <ChevronLeftIcon />
              </button>
              <span className="min-w-24 text-center">{formatMonthLabel(visibleMonth)}</span>
              <button className="rounded-full px-2 py-1 hover:bg-white" onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))} type="button">
                <span className="sr-only">Mois suivant</span>
                <ChevronRightIcon />
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="grid grid-cols-7 gap-1">
              {WEEK_DAYS.map((day) => (
                <div className="py-1 text-center text-[10px] font-bold uppercase tracking-[1px] text-[#707973]" key={day}>
                  {day}
                </div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-7 gap-y-1">
              {calendarDays.map((day) => (
                <CalendarDayButton
                  day={day}
                  endDate={endDate}
                  key={formatDateValue(day.date)}
                  onSelect={handleSelectDate}
                  startDate={startDate}
                />
              ))}
            </div>

            <div className="mt-5 flex items-end justify-between border-t border-[#c0c9c2]/20 pt-4">
              <DateSummary label="Début" value={startDate} />
              <div className="mb-3 h-px w-8 bg-[#c0c9c2]" />
              <DateSummary align="right" label="Fin" value={endDate} />
            </div>
          </div>

          <div className="mt-8 rounded-[2rem] border border-[#b9ccb4]/30 bg-[#f5f2e8]/50 p-4 text-sm leading-6 text-[#3b4b39]">
            L'emprunt de {item.title} est gratuit sur Seconde Vie. Pensez à rapporter l'objet propre et dans les délais convenus.
          </div>

          {error !== null && error !== undefined && (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {getErrorMessage(error)}
            </div>
          )}
        </div>

        <footer className="absolute inset-x-0 bottom-0 bg-[#f5f6f1]/95 p-6 backdrop-blur">
          <button
            className="flex h-16 w-full items-center justify-center gap-2 rounded-full bg-[#1a4231] px-6 text-base font-bold text-white shadow-xl shadow-[#1a4231]/20 transition hover:bg-[#143629] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isPending || startDate === null || endDate === null}
            onClick={handleSubmit}
            type="button"
          >
            {isPending ? 'Envoi...' : 'Envoyer la demande'}
            <SendIcon />
          </button>
        </footer>
      </section>
    </div>
  )
}

function CalendarDayButton({
  day,
  endDate,
  onSelect,
  startDate,
}: {
  day: CalendarDay
  endDate: Date | null
  onSelect: (date: Date) => void
  startDate: Date | null
}) {
  const isStart = startDate !== null && isSameDay(day.date, startDate)
  const isEnd = endDate !== null && isSameDay(day.date, endDate)
  const isBetween = startDate !== null && endDate !== null && day.date > startDate && day.date < endDate
  const isRangeEdge = isStart || isEnd

  return (
    <button
      className={getDayClassName(day.isCurrentMonth, isBetween, isRangeEdge)}
      onClick={() => onSelect(day.date)}
      type="button"
    >
      <span className={isRangeEdge ? 'flex h-8 w-8 items-center justify-center rounded-full bg-[#1a4231] font-bold text-white' : ''}>
        {day.date.getDate()}
      </span>
    </button>
  )
}

function DateSummary({ align = 'left', label, value }: { align?: 'left' | 'right'; label: string; value: Date | null }) {
  return (
    <div className={align === 'right' ? 'text-right' : 'text-left'}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#707973]">{label}</p>
      <p className="mt-1 min-h-4 text-xs font-semibold text-[#1a4231]">{value === null ? 'À choisir' : formatDateLabel(value)}</p>
    </div>
  )
}

function buildCalendarDays(monthDate: Date): CalendarDay[] {
  const firstDay = startOfMonth(monthDate)
  const mondayIndex = (firstDay.getDay() + 6) % 7
  const firstDisplayedDay = addDays(firstDay, -mondayIndex)

  return Array.from({ length: 35 }, (_, index) => {
    const date = addDays(firstDisplayedDay, index)

    return {
      date,
      isCurrentMonth: date.getMonth() === monthDate.getMonth(),
    }
  })
}

function getDayClassName(isCurrentMonth: boolean, isBetween: boolean, isRangeEdge: boolean): string {
  const baseClassName = 'flex h-10 items-center justify-center text-sm transition'
  const textClassName = isCurrentMonth ? 'text-[#0f1714]' : 'text-[#c0c9c2]'

  if (isRangeEdge || isBetween) {
    return baseClassName + ' bg-[#d5e8cf] ' + textClassName
  }

  return baseClassName + ' rounded-full hover:bg-[#edf1ea] ' + textClassName
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

function isSameDay(firstDate: Date, secondDate: Date): boolean {
  return formatDateValue(firstDate) === formatDateValue(secondDate)
}

function formatDateValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return year + '-' + month + '-' + day
}

function formatMonthLabel(date: Date): string {
  return MONTH_LABELS[date.getMonth()] + ' ' + date.getFullYear()
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  })
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  return error instanceof Error ? error.message : "La demande d'emprunt a échoué."
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  )
}
