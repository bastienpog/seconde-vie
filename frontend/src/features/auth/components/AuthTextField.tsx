import type { InputHTMLAttributes } from 'react'

type AuthTextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

export function AuthTextField({ label, id, ...props }: AuthTextFieldProps) {
  const inputId = id ?? props.name

  return (
    <div>
      <label className="sr-only" htmlFor={inputId}>
        {label}
      </label>
      <input
        className="h-16 w-full rounded-full border border-transparent bg-white px-8 text-base text-[#1f2b25] shadow-sm outline-none transition placeholder:text-[#707973] focus:border-[#1a4231] focus:ring-4 focus:ring-[#1a4231]/10"
        id={inputId}
        placeholder={label}
        {...props}
      />
    </div>
  )
}
