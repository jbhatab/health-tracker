'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { timeToSeconds, secondsToTime, parseRepsWeight } from '@/lib/utils'
import type { Entry, HealthFactor, HealthFactorGroup, User, ScoresData } from '@/db/schema'

interface ChartsViewProps {
  entries: Entry[]
  healthFactors: HealthFactor[]
  healthFactorGroups: HealthFactorGroup[]
  users: User[]
}

export default function ChartsView({ 
  entries, 
  healthFactors, 
  healthFactorGroups, 
  users 
}: ChartsViewProps) {
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

  const processTimeData = (factor: HealthFactor) => {
    const data: any[] = []
    
    entries.forEach(entry => {
      const scores = entry.scores as ScoresData
      const dateStr = new Date(entry.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
      
      const dataPoint: any = { date: dateStr, fullDate: entry.date }
      
      Object.entries(scores).forEach(([userId, userScores]) => {
        const score = userScores[factor.id.toString()]
        if (score) {
          const user = userMap[parseInt(userId)]
          if (user) {
            dataPoint[user.name] = timeToSeconds(score)
          }
        }
      })
      
      if (Object.keys(dataPoint).length > 2) {
        data.push(dataPoint)
      }
    })
    
    return data.sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
  }

  const processWeightData = (factor: HealthFactor) => {
    const data: any[] = []
    
    entries.forEach(entry => {
      const scores = entry.scores as ScoresData
      const dateStr = new Date(entry.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
      
      const dataPoint: any = { date: dateStr, fullDate: entry.date }
      
      Object.entries(scores).forEach(([userId, userScores]) => {
        const score = userScores[factor.id.toString()]
        if (score) {
          const user = userMap[parseInt(userId)]
          if (user) {
            dataPoint[user.name] = parseFloat(score)
          }
        }
      })
      
      if (Object.keys(dataPoint).length > 2) {
        data.push(dataPoint)
      }
    })
    
    return data.sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
  }

  const processRepsWeightData = (factor: HealthFactor) => {
    const repsData: any[] = []
    const weightData: any[] = []
    const volumeData: any[] = []
    
    entries.forEach(entry => {
      const scores = entry.scores as ScoresData
      const dateStr = new Date(entry.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
      
      const repsPoint: any = { date: dateStr, fullDate: entry.date }
      const weightPoint: any = { date: dateStr, fullDate: entry.date }
      const volumePoint: any = { date: dateStr, fullDate: entry.date }
      
      Object.entries(scores).forEach(([userId, userScores]) => {
        const score = userScores[factor.id.toString()]
        if (score) {
          const user = userMap[parseInt(userId)]
          if (user) {
            const { reps, weight, volume } = parseRepsWeight(score)
            repsPoint[user.name] = reps
            weightPoint[user.name] = weight
            volumePoint[user.name] = volume
          }
        }
      })
      
      if (Object.keys(repsPoint).length > 2) {
        repsData.push(repsPoint)
        weightData.push(weightPoint)
        volumeData.push(volumePoint)
      }
    })
    
    const sortFn = (a: any, b: any) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()
    
    return {
      reps: repsData.sort(sortFn),
      weight: weightData.sort(sortFn),
      volume: volumeData.sort(sortFn)
    }
  }

  const CustomTimeTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {secondsToTime(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {groupedFactors.map(group => (
        <div key={group.id} className="space-y-6">
          <h2 className="text-xl font-bold text-foreground border-b border-border pb-2">
            {group.name}
          </h2>
          
          <div className="grid gap-6">
            {group.factors.map(factor => {
              if (factor.unit === 'time') {
                const data = processTimeData(factor)
                if (data.length === 0) return null
                
                return (
                  <div key={factor.id} className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">{factor.name}</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="date" 
                            stroke="hsl(var(--muted-foreground))"
                          />
                          <YAxis 
                            stroke="hsl(var(--muted-foreground))"
                            tickFormatter={(value) => secondsToTime(value)}
                          />
                          <Tooltip content={<CustomTimeTooltip />} />
                          <Legend />
                          {users.map(user => (
                            <Line 
                              key={user.id}
                              type="monotone" 
                              dataKey={user.name}
                              stroke={user.color}
                              strokeWidth={2}
                              dot={{ fill: user.color, r: 4 }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )
              } else if (factor.unit === 'lbs') {
                const data = processWeightData(factor)
                if (data.length === 0) return null
                
                return (
                  <div key={factor.id} className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">{factor.name}</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="date" 
                            stroke="hsl(var(--muted-foreground))"
                          />
                          <YAxis 
                            stroke="hsl(var(--muted-foreground))"
                            label={{ value: 'lbs', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Legend />
                          {users.map(user => (
                            <Line 
                              key={user.id}
                              type="monotone" 
                              dataKey={user.name}
                              stroke={user.color}
                              strokeWidth={2}
                              dot={{ fill: user.color, r: 4 }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )
              } else if (factor.unit === 'reps_weight') {
                const { reps, weight, volume } = processRepsWeightData(factor)
                if (reps.length === 0) return null
                
                return (
                  <div key={factor.id} className="space-y-4">
                    <h3 className="text-lg font-medium">{factor.name}</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-card border border-border rounded-lg p-4">
                        <h4 className="text-md font-medium mb-2">Reps</h4>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reps}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis 
                                dataKey="date" 
                                stroke="hsl(var(--muted-foreground))"
                              />
                              <YAxis stroke="hsl(var(--muted-foreground))" />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'hsl(var(--card))', 
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px'
                                }}
                              />
                              <Legend />
                              {users.map(user => (
                                <Bar 
                                  key={user.id}
                                  dataKey={user.name}
                                  fill={user.color}
                                />
                              ))}
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      
                      <div className="bg-card border border-border rounded-lg p-4">
                        <h4 className="text-md font-medium mb-2">Weight (lbs)</h4>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weight}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis 
                                dataKey="date" 
                                stroke="hsl(var(--muted-foreground))"
                              />
                              <YAxis stroke="hsl(var(--muted-foreground))" />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'hsl(var(--card))', 
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px'
                                }}
                              />
                              <Legend />
                              {users.map(user => (
                                <Bar 
                                  key={user.id}
                                  dataKey={user.name}
                                  fill={user.color}
                                />
                              ))}
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-card border border-border rounded-lg p-4">
                      <h4 className="text-md font-medium mb-2">Volume (Reps × Weight)</h4>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={volume}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="date" 
                              stroke="hsl(var(--muted-foreground))"
                            />
                            <YAxis stroke="hsl(var(--muted-foreground))" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Legend />
                            {users.map(user => (
                              <Line 
                                key={user.id}
                                type="monotone" 
                                dataKey={user.name}
                                stroke={user.color}
                                strokeWidth={2}
                                dot={{ fill: user.color, r: 4 }}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )
              }
              
              return null
            })}
          </div>
        </div>
      ))}
    </div>
  )
}