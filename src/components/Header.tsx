'use client'

export default function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold text-foreground">
          Health Tracker v2
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          HYROX Training & Fitness Progress
        </p>
      </div>
    </header>
  )
}