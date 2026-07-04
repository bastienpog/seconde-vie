import { useEffect, useId, type ReactNode } from 'react'

type ConfirmDialogProps = {
  cancelLabel?: string
  children: ReactNode
  confirmLabel?: string
  isLoading?: boolean
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
  title: string
}

export function ConfirmDialog({
  cancelLabel = 'Annuler',
  children,
  confirmLabel = 'Confirmer',
  isLoading = false,
  isOpen,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isLoading) {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLoading, isOpen, onCancel])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 px-4 py-6 sm:items-center" role="presentation">
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-md rounded-[1.5rem] bg-white p-6 text-slate-950 shadow-2xl"
        role="dialog"
      >
        <h2 className="text-lg font-bold text-slate-950" id={titleId}>{title}</h2>
        <div className="mt-3 text-sm leading-6 text-slate-600" id={descriptionId}>{children}</div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            className="inline-flex h-12 items-center justify-center rounded-full bg-slate-100 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading}
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className="inline-flex h-12 items-center justify-center rounded-full bg-red-700 px-4 text-sm font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading}
            onClick={onConfirm}
            type="button"
          >
            {isLoading ? 'Suppression...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
