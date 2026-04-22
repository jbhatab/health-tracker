'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface NavigationProps {
  currentView: 'table' | 'charts'
  onViewChange: (view: 'table' | 'charts') => void
}

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex space-x-1">
          <button
            onClick={() => onViewChange('table')}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              currentView === 'table'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Table View
          </button>
          <button
            onClick={() => onViewChange('charts')}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              currentView === 'charts'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Charts View
          </button>
        </div>
      </div>
    </nav>
  )
}