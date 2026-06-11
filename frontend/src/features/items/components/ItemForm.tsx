import type { FormEvent, ReactNode } from 'react'
import { ApiError } from '../../../lib/api.ts'
import { useCategoriesQuery } from '../../categories/hooks.ts'
import type { Item, ItemPayload } from '../services/itemsApi.ts'

type FormErrors = Partial<Record<keyof ItemPayload, string>>

type ItemFormProps = {
  error: unknown
  initialItem?: Item
  isPending: boolean
  mode: 'create' | 'edit'
  onSubmit: (payload: ItemPayload) => void
}

const CONDITION_OPTIONS = ['Très bon état', 'Bon état', 'État correct', 'À réparer']

export function ItemForm({ error, initialItem, isPending, mode, onSubmit }: ItemFormProps) {
  const categoriesQuery = useCategoriesQuery()
  const isEditMode = mode === 'edit'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const payload = buildPayload(formData)
    const errors = validatePayload(payload)

    if (Object.keys(errors).length > 0) {
      setFormErrors(event.currentTarget, errors)
      return
    }

    clearFormErrors(event.currentTarget)
    onSubmit(payload)
  }

  return (
    <form className="mx-auto flex w-full max-w-2xl flex-col gap-8 pb-28 sm:pb-0" noValidate onSubmit={handleSubmit}>
      <section className="rounded-[2rem] border-2 border-dashed border-[#1a4231]/30 bg-[#d1e8d9]/20 px-4 py-10 text-center sm:px-6 sm:py-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#1a4231]/10 text-[#1a4231]">
          <CameraIcon />
        </div>
        <p className="mt-4 text-base font-bold text-[#1a4231]">Ajouter une photo</p>
        <p className="mt-1 text-sm text-[#1a4231]/60">Collez une URL d'image JPG ou PNG</p>
        <label className="mx-auto mt-5 block max-w-md text-left">
          <span className="sr-only">URL de l'image</span>
          <input
            className="h-12 w-full rounded-2xl border border-transparent bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#1a4231] focus:ring-4 focus:ring-[#1a4231]/10"
            defaultValue={initialItem?.imageUrl ?? ''}
            name="imageUrl"
            placeholder="https://exemple.fr/image.jpg"
            type="url"
          />
          <span className="mt-2 hidden px-1 text-sm font-semibold text-red-700" data-error-for="imageUrl" />
        </label>
      </section>

      <div className="flex flex-col gap-7">
        <FormField label="Titre de l'objet" name="title">
          <input
            className={inputClassName}
            defaultValue={initialItem?.title ?? ''}
            minLength={3}
            name="title"
            placeholder="Perceuse visseuse"
            required
            type="text"
          />
        </FormField>

        <FormField label="Catégorie" name="categoryId">
          {categoriesQuery.isLoading && <SelectSkeleton />}
          {categoriesQuery.isError && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              Impossible de charger les catégories.
            </p>
          )}
          {categoriesQuery.isSuccess && (
            <div className="relative">
              <select
                className={`${inputClassName} appearance-none pr-12`}
                defaultValue={initialItem?.category?.id ?? ''}
                name="categoryId"
                required
              >
                <option disabled value="">
                  Choisir une catégorie
                </option>
                {categoriesQuery.data.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon />
            </div>
          )}
        </FormField>

        <FormField label="Ville" name="city">
          <input
            className={inputClassName}
            defaultValue={initialItem?.city ?? ''}
            name="city"
            placeholder="Paris"
            required
            type="text"
          />
        </FormField>

        <FormField label="État" name="condition">
          <div className="relative">
            <select
              className={`${inputClassName} appearance-none pr-12`}
              defaultValue={initialItem?.condition ?? ''}
              name="condition"
              required
            >
              <option disabled value="">
                Choisir l'état de l'objet
              </option>
              {CONDITION_OPTIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>
            <ChevronDownIcon />
          </div>
        </FormField>

        <FormField label="Description et conditions de prêt" name="description">
          <textarea
            className={`${inputClassName} min-h-32 resize-none py-4 leading-6 sm:min-h-40`}
            defaultValue={initialItem?.description ?? ''}
            minLength={10}
            name="description"
            placeholder="Décrivez l'objet et vos disponibilités..."
            required
          />
        </FormField>
      </div>

      {error !== null && error !== undefined && (
        <ApiErrorMessage error={error} />
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#1a4231]/10 bg-[#fdfcf8] px-6 pb-8 pt-4 sm:static sm:border-0 sm:bg-transparent sm:p-0">
        <button
          className="flex h-16 w-full items-center justify-center gap-2 rounded-full bg-[#1a4231] px-6 text-lg font-bold text-[#f5f5dc] shadow-xl shadow-[#1a4231]/20 transition hover:bg-[#143629] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isPending || categoriesQuery.isLoading || categoriesQuery.isError}
          type="submit"
        >
          <UploadIcon />
          {getSubmitLabel(isPending, isEditMode)}
        </button>
      </div>
    </form>
  )
}

function getSubmitLabel(isPending: boolean, isEditMode: boolean): string {
  if (isPending) {
    return isEditMode ? 'Enregistrement...' : 'Publication...'
  }

  return isEditMode ? 'Enregistrer les modifications' : "Publier l'objet"
}

function FormField({ children, label, name }: { children: ReactNode; label: string; name: string }) {
  return (
    <label className="block">
      <span className="mb-2 block px-1 text-sm font-bold text-[#1a4231]">{label}</span>
      {children}
      <span className="mt-2 hidden px-1 text-sm font-semibold text-red-700" data-error-for={name} />
    </label>
  )
}

function ApiErrorMessage({ error }: { error: unknown }) {
  return (
    <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
      {getErrorMessage(error)}
    </div>
  )
}

function SelectSkeleton() {
  return <div className="h-14 animate-pulse rounded-2xl bg-slate-200" />
}

function buildPayload(formData: FormData): ItemPayload {
  const imageUrl = String(formData.get('imageUrl') ?? '').trim()

  return {
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    city: String(formData.get('city') ?? '').trim(),
    condition: String(formData.get('condition') ?? '').trim(),
    categoryId: Number(formData.get('categoryId')),
    imageUrl: imageUrl === '' ? null : imageUrl,
  }
}

function validatePayload(payload: ItemPayload): FormErrors {
  const errors: FormErrors = {}

  if (payload.title === '') {
    errors.title = 'Le titre est obligatoire.'
  } else if (payload.title.length < 3) {
    errors.title = 'Le titre doit contenir au moins 3 caractères.'
  }

  if (payload.categoryId < 1 || Number.isNaN(payload.categoryId)) {
    errors.categoryId = 'La catégorie est obligatoire.'
  }

  if (payload.city === '') {
    errors.city = 'La ville est obligatoire.'
  }

  if (payload.condition === '') {
    errors.condition = "L'état est obligatoire."
  }

  if (payload.description === '') {
    errors.description = 'La description est obligatoire.'
  } else if (payload.description.length < 10) {
    errors.description = 'La description doit contenir au moins 10 caractères.'
  }

  if (payload.imageUrl !== null && payload.imageUrl !== undefined && !isValidUrl(payload.imageUrl)) {
    errors.imageUrl = "L'URL de l'image n'est pas valide."
  }

  return errors
}

function setFormErrors(form: HTMLFormElement, errors: FormErrors) {
  clearFormErrors(form)

  Object.entries(errors).forEach(([field, message]) => {
    const errorElement = form.querySelector<HTMLElement>(`[data-error-for="${field}"]`)

    if (errorElement !== null && message !== undefined) {
      errorElement.textContent = message
      errorElement.classList.remove('hidden')
    }
  })
}

function clearFormErrors(form: HTMLFormElement) {
  form.querySelectorAll<HTMLElement>('[data-error-for]').forEach((errorElement) => {
    errorElement.textContent = ''
    errorElement.classList.add('hidden')
  })
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value)

    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  return error instanceof Error ? error.message : "L'enregistrement de l'objet a échoué."
}

const inputClassName = 'h-14 w-full rounded-2xl border border-transparent bg-[#f1f2ee] px-6 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1a4231] focus:ring-4 focus:ring-[#1a4231]/10'

function CameraIcon() {
  return (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1a4231]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M20 20H4" />
    </svg>
  )
}
