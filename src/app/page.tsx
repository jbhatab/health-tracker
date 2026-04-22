'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import TableView from '@/components/TableView'
import ChartsView from '@/components/ChartsView'
import type { Entry, HealthFactor, HealthFactorGroup, User } from '@/db/schema'

export default function Home() {
  const [currentView, setCurrentView] = useState<'table' | 'charts'>('table')
  const [entries, setEntries] = useState<Entry[]>([])
  const [healthFactors, setHealthFactors] = useState<HealthFactor[]>([])
  const [healthFactorGroups, setHealthFactorGroups] = useState<HealthFactorGroup[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        const [entriesRes, factorsRes, groupsRes, usersRes] = await Promise.all([
          fetch('/api/entries'),
          fetch('/api/health-factors'),
          fetch('/api/health-factor-groups'),
          fetch('/api/users')
        ])

        if (!entriesRes.ok || !factorsRes.ok || !groupsRes.ok || !usersRes.ok) {
          throw new Error('Failed to fetch data')
        }

        const [entriesData, factorsData, groupsData, usersData] = await Promise.all([
          entriesRes.json(),
          factorsRes.json(),
          groupsRes.json(),
          usersRes.json()
        ])

        setEntries(entriesData)
        setHealthFactors(factorsData)
        setHealthFactorGroups(groupsData)
        setUsers(usersData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-2">Error loading data</p>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      
      {currentView === 'table' ? (
        <TableView 
          entries={entries}
          healthFactors={healthFactors}
          healthFactorGroups={healthFactorGroups}
          users={users}
        />
      ) : (
        <ChartsView 
          entries={entries}
          healthFactors={healthFactors}
          healthFactorGroups={healthFactorGroups}
          users={users}
        />
      )}
    </div>
  )
}