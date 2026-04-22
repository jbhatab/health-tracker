'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface NavigationProps {
  currentView: 'table' | 'charts' | 'forecast'
  onViewChange: (view: 'table' | 'charts' | 'forecast') => void
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
          <button
            onClick={() => onViewChange('forecast')}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              currentView === 'forecast'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Forecast
          </button>
        </div>
      </div>
    </nav>
  )
}