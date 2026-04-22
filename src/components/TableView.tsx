'use client'

import { useMemo, useEffect, useRef } from 'react'
import { formatTime, formatWeight, formatRepsWeight } from '@/lib/utils'
import type { Entry, HealthFactor, HealthFactorGroup, User, ScoresData } from '@/db/schema'

interface TableViewProps {
  entries: Entry[]
  healthFactors: HealthFactor[]
  healthFactorGroups: HealthFactorGroup[]
  users: User[]
}

export default function TableView({ 
  entries, 
  healthFactors, 
  healthFactorGroups, 
  users 
}: TableViewProps) {
  const userMap = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.id] = user
      return acc
    }, {} as Record<number, User>)
  }, [users])

  const groupedFactors = useMemo(() => {
    return healthFactorGroups.map(group => ({
      ...group,
      factors: healthFactors.filter(factor => factor.groupId === group.id)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    }))
  }, [healthFactors, healthFactorGroups])

  const dates = useMemo(() => {
    return [...new Set(entries.map(entry => entry.date))]
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
  }, [entries])

  const today = new Date().toISOString().split('T')[0]
  const highlightDate = dates.includes(today)
    ? today
    : [...dates].reverse().find(d => d <= today) || dates[dates.length - 1]

  const tableContainerRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLTableCellElement>(null)

  useEffect(() => {
    if (highlightRef.current && tableContainerRef.current) {
      const container = tableContainerRef.current
      const cell = highlightRef.current
      const containerRect = container.getBoundingClientRect()
      const cellRect = cell.getBoundingClientRect()
      const scrollLeft = cell.offsetLeft - container.offsetLeft - (containerRect.width / 2) + (cellRect.width / 2)
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' })
    }
  }, [entries])

  const entryMap = useMemo(() => {
    return entries.reduce((acc, entry) => {
      acc[entry.date] = entry.scores as ScoresData
      return acc
    }, {} as Record<string, ScoresData>)
  }, [entries])

  const formatValue = (value: string, unit: string) => {
    switch (unit) {
      case 'time':
        return formatTime(value)
      case 'lbs':
        return formatWeight(value)
      case 'reps_weight':
        return formatRepsWeight(value)
      default:
        return value
    }
  }

  const getUserColor = (userId: string) => {
    const user = userMap[parseInt(userId)]
    return user?.color || '#6B7280'
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="overflow-auto" ref={tableContainerRef}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 bg-card border border-border p-3 text-left font-medium text-foreground min-w-[200px]">
                Health Factor
              </th>
              {dates.map(date => (
                <th 
                  key={date}
                  ref={date === highlightDate ? highlightRef : null}
                  className={`border border-border p-3 text-center font-medium min-w-[120px] ${
                    date === highlightDate 
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' 
                      : 'text-foreground'
                  }`}
                >
                  {new Date(date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupedFactors.map(group => (
              <React.Fragment key={group.id}>
                <tr>
                  <td 
                    colSpan={dates.length + 1}
                    className="bg-muted border border-border p-2 font-semibold text-muted-foreground text-sm"
                  >
                    {group.name}
                  </td>
                </tr>
                {group.factors.map(factor => (
                  <tr key={factor.id} className="hover:bg-muted/50">
                    <td className="sticky left-0 bg-card border border-border p-3 font-medium text-foreground">
                      {factor.name}
                    </td>
                    {dates.map(date => (
                      <td key={date} className={`border border-border p-2 text-center ${
                        date === highlightDate ? 'bg-blue-500/10 border-blue-500/40' : ''
                      }`}>
                        {entryMap[date] && (
                          <div className="space-y-1">
                            {Object.entries(entryMap[date]).map(([userId, userScores]) => {
                              const score = userScores[factor.id.toString()]
                              if (!score) return null
                              
                              return (
                                <div 
                                  key={userId}
                                  className="text-sm px-2 py-1 rounded"
                                  style={{ 
                                    backgroundColor: `${getUserColor(userId)}20`,
                                    borderLeft: `3px solid ${getUserColor(userId)}`
                                  }}
                                >
                                  {formatValue(score, factor.unit)}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Import React to use Fragment
import React from 'react'