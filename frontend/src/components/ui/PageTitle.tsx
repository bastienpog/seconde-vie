type PageTitleProps = {
  title: string
  description?: string
}

export function PageTitle({ title, description }: PageTitleProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
      {description !== undefined && <p className="mt-2 text-sm text-slate-600">{description}</p>}
    </div>
  )
}
