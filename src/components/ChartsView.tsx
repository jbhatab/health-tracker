'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ReferenceLine } from 'recharts'
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

  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const todayFull = new Date().toISOString().split('T')[0]

  const ensureToday = (data: any[]) => {
    if (data.length === 0) return data
    const last = data[data.length - 1]
    if (last.fullDate < todayFull) {
      data.push({ date: todayStr, fullDate: todayFull })
    }
    return data
  }

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
    
    return ensureToday(data.sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()))
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
    
    return ensureToday(data.sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()))
  }

  const processRepsWeightData = (factor: HealthFactor) => {
    const combinedData: any[] = []
    const volumeData: any[] = []
    
    entries.forEach(entry => {
      const scores = entry.scores as ScoresData
      const dateStr = new Date(entry.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
      
      const combinedPoint: any = { date: dateStr, fullDate: entry.date }
      const volumePoint: any = { date: dateStr, fullDate: entry.date }
      let hasData = false
      
      Object.entries(scores).forEach(([userId, userScores]) => {
        const score = userScores[factor.id.toString()]
        if (score) {
          const user = userMap[parseInt(userId)]
          if (user) {
            const { reps, weight, volume } = parseRepsWeight(score)
            combinedPoint[`${user.name} reps`] = reps
            combinedPoint[`${user.name} weight`] = weight
            volumePoint[user.name] = volume
            hasData = true
          }
        }
      })
      
      if (hasData) {
        combinedData.push(combinedPoint)
        volumeData.push(volumePoint)
      }
    })
    
    const sortFn = (a: any, b: any) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()
    
    return {
      combined: ensureToday(combinedData.sort(sortFn)),
      volume: ensureToday(volumeData.sort(sortFn))
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
                          <ReferenceLine x={todayStr} stroke="#3B82F6" strokeDasharray="3 3" strokeWidth={2} label={{ value: 'Today', position: 'top', fill: '#3B82F6', fontSize: 12 }} />
                          {users.map(user => (
                            <Line 
                              key={user.id}
                              type="monotone" 
                              dataKey={user.name}
                              stroke={user.color}
                              strokeWidth={2}
                              dot={{ fill: user.color, r: 4 }}
                              connectNulls={false}
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
                          <ReferenceLine x={todayStr} stroke="#3B82F6" strokeDasharray="3 3" strokeWidth={2} label={{ value: 'Today', position: 'top', fill: '#3B82F6', fontSize: 12 }} />
                          {users.map(user => (
                            <Line 
                              key={user.id}
                              type="monotone" 
                              dataKey={user.name}
                              stroke={user.color}
                              strokeWidth={2}
                              dot={{ fill: user.color, r: 4 }}
                              connectNulls={false}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )
              } else if (factor.unit === 'reps_weight') {
                const { combined, volume } = processRepsWeightData(factor)
                if (combined.length === 0) return null

                // Figure out which users have data for this factor
                const activeUsers = users.filter(u =>
                  combined.some((d: any) => d[`${u.name} reps`] != null)
                )
                
                return (
                  <div key={factor.id} className="space-y-4">
                    <h3 className="text-lg font-medium">{factor.name}</h3>
                    
                    <div className="bg-card border border-border rounded-lg p-4">
                      <h4 className="text-md font-medium mb-2">Reps & Weight</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={combined}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="date" 
                              stroke="hsl(var(--muted-foreground))"
                            />
                            <YAxis 
                              yAxisId="weight"
                              orientation="left"
                              stroke="hsl(var(--muted-foreground))"
                              label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft', offset: -5, style: { fill: 'hsl(var(--muted-foreground))' } }}
                            />
                            <YAxis 
                              yAxisId="reps"
                              orientation="right"
                              stroke="hsl(var(--muted-foreground))"
                              label={{ value: 'Reps', angle: 90, position: 'insideRight', offset: 5, style: { fill: 'hsl(var(--muted-foreground))' } }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Legend />
                            <ReferenceLine x={todayStr} yAxisId="weight" stroke="#3B82F6" strokeDasharray="3 3" strokeWidth={2} label={{ value: 'Today', position: 'top', fill: '#3B82F6', fontSize: 12 }} />
                            {activeUsers.map(user => (
                              <Bar 
                                key={`${user.id}-weight`}
                                yAxisId="weight"
                                dataKey={`${user.name} weight`}
                                fill={user.color}
                                radius={[3, 3, 0, 0] as any}
                                barSize={20}
                              />
                            ))}
                            {activeUsers.map(user => (
                              <Bar 
                                key={`${user.id}-reps`}
                                yAxisId="reps"
                                dataKey={`${user.name} reps`}
                                fill={`${user.color}66`}
                                radius={[3, 3, 0, 0] as any}
                                barSize={20}
                              />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
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
                            <ReferenceLine x={todayStr} stroke="#3B82F6" strokeDasharray="3 3" strokeWidth={2} label={{ value: 'Today', position: 'top', fill: '#3B82F6', fontSize: 12 }} />
                            {users.map(user => (
                              <Line 
                                key={user.id}
                                type="monotone" 
                                dataKey={user.name}
                                stroke={user.color}
                                strokeWidth={2}
                                dot={{ fill: user.color, r: 4 }}
                                connectNulls={false}
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