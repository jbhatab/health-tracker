'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { timeToSeconds, secondsToTime } from '@/lib/utils'
import type { Entry, HealthFactor, HealthFactorGroup, User, ScoresData } from '@/db/schema'

interface ForecastViewProps {
  entries: Entry[]
  healthFactors: HealthFactor[]
  healthFactorGroups: HealthFactorGroup[]
  users: User[]
}

const RACE_DATE = new Date('2026-10-10')
const STATION_FACTOR_IDS = [1, 2, 3, 4, 5, 6, 7, 8] // SkiErg through Wall Balls
const RUN_FACTOR_ID = 10 // Total Run Time (8km)
const RACE_TIME_FACTOR_ID = 11 // Overall race time

const STATION_NAMES: Record<number, string> = {
  1: 'SkiErg',
  2: 'Sled Push', 
  3: 'Sled Pull',
  4: 'Burpee Broad Jumps',
  5: 'Rowing',
  6: 'Farmers Carry',
  7: 'Sandbag Lunges',
  8: 'Wall Balls',
  10: 'Total Run (8km)'
}

interface DataPoint {
  date: Date
  timeSeconds: number
}

interface StationForecast {
  factorId: number
  name: string
  mostRecentTime?: string
  bestTime?: string
  projectedTime: string
  trend: 'improving' | 'worsening' | 'flat'
  weeklyChangeSeconds: number
  contributionPercent: number
}

function linearRegression(points: DataPoint[], targetDate: Date): number {
  if (points.length === 0) return 0
  if (points.length === 1) return points[0].timeSeconds

  const xData = points.map(p => p.date.getTime())
  const yData = points.map(p => p.timeSeconds)
  
  const n = points.length
  const sumX = xData.reduce((a, b) => a + b, 0)
  const sumY = yData.reduce((a, b) => a + b, 0)
  const sumXY = xData.reduce((sum, x, i) => sum + x * yData[i], 0)
  const sumXX = xData.reduce((sum, x) => sum + x * x, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  return slope * targetDate.getTime() + intercept
}

export default function ForecastView({ 
  entries, 
  healthFactors, 
  healthFactorGroups, 
  users 
}: ForecastViewProps) {
  const userMap = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.id] = user
      return acc
    }, {} as Record<number, User>)
  }, [users])

  const daysUntilRace = Math.max(0, Math.ceil((RACE_DATE.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))

  const userForecasts = useMemo(() => {
    const forecasts: Record<number, {
      stationForecasts: StationForecast[]
      projectedRaceTime: number
      bestSimulationTime?: number
      trendData: Array<{ date: string, fullDate: string, projected?: number, actual?: number }>
    }> = {}

    users.forEach(user => {
      const userEntries = entries.map(entry => ({
        ...entry,
        date: new Date(entry.date),
        scores: entry.scores as ScoresData
      })).sort((a, b) => a.date.getTime() - b.date.getTime())

      const stationForecasts: StationForecast[] = []
      let totalProjectedTime = 0

      // Process each station + run
      STATION_FACTOR_IDS.concat([RUN_FACTOR_ID]).forEach(factorId => {
        const dataPoints: DataPoint[] = userEntries
          .filter(entry => entry.scores[user.id.toString()]?.[factorId.toString()])
          .map(entry => ({
            date: entry.date,
            timeSeconds: timeToSeconds(entry.scores[user.id.toString()][factorId.toString()])
          }))

        if (dataPoints.length === 0) {
          stationForecasts.push({
            factorId,
            name: STATION_NAMES[factorId],
            projectedTime: '--',
            trend: 'flat',
            weeklyChangeSeconds: 0,
            contributionPercent: 0
          })
          return
        }

        const mostRecentTime = dataPoints[dataPoints.length - 1].timeSeconds
        const bestTime = Math.min(...dataPoints.map(p => p.timeSeconds))
        const projectedSeconds = linearRegression(dataPoints, RACE_DATE)
        
        // Calculate trend (change per week)
        let weeklyChangeSeconds = 0
        let trend: 'improving' | 'worsening' | 'flat' = 'flat'
        
        if (dataPoints.length >= 2) {
          const firstPoint = dataPoints[0]
          const lastPoint = dataPoints[dataPoints.length - 1]
          const daysDiff = (lastPoint.date.getTime() - firstPoint.date.getTime()) / (1000 * 60 * 60 * 24)
          const timeDiff = lastPoint.timeSeconds - firstPoint.timeSeconds
          
          if (daysDiff > 0) {
            weeklyChangeSeconds = (timeDiff / daysDiff) * 7
            if (Math.abs(weeklyChangeSeconds) > 1) {
              trend = weeklyChangeSeconds < 0 ? 'improving' : 'worsening'
            }
          }
        }

        stationForecasts.push({
          factorId,
          name: STATION_NAMES[factorId],
          mostRecentTime: secondsToTime(mostRecentTime),
          bestTime: secondsToTime(bestTime),
          projectedTime: secondsToTime(Math.max(0, Math.round(projectedSeconds))),
          trend,
          weeklyChangeSeconds,
          contributionPercent: 0 // Will calculate after total
        })

        totalProjectedTime += Math.max(0, projectedSeconds)
      })

      // Calculate contribution percentages
      if (totalProjectedTime > 0) {
        stationForecasts.forEach(forecast => {
          if (forecast.projectedTime !== '--') {
            const seconds = timeToSeconds(forecast.projectedTime)
            forecast.contributionPercent = (seconds / totalProjectedTime) * 100
          }
        })
      }

      // Get best simulation time (factor 11)
      const simulationTimes = userEntries
        .filter(entry => entry.scores[user.id.toString()]?.[RACE_TIME_FACTOR_ID.toString()])
        .map(entry => timeToSeconds(entry.scores[user.id.toString()][RACE_TIME_FACTOR_ID.toString()]))
      
      const bestSimulationTime = simulationTimes.length > 0 ? Math.min(...simulationTimes) : undefined

      // Build trend chart data
      const trendData: Array<{ date: string, fullDate: string, projected?: number, actual?: number }> = []
      
      // Add historical simulation data points
      userEntries.forEach(entry => {
        if (entry.scores[user.id.toString()]?.[RACE_TIME_FACTOR_ID.toString()]) {
          const dateStr = entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          trendData.push({
            date: dateStr,
            fullDate: entry.date.toISOString().split('T')[0],
            actual: timeToSeconds(entry.scores[user.id.toString()][RACE_TIME_FACTOR_ID.toString()])
          })
        }
      })

      // Add projected point for race day
      if (totalProjectedTime > 0) {
        trendData.push({
          date: 'Oct 10',
          fullDate: '2026-10-10',
          projected: totalProjectedTime
        })
      }

      forecasts[user.id] = {
        stationForecasts,
        projectedRaceTime: totalProjectedTime,
        bestSimulationTime,
        trendData: trendData.sort((a, b) => a.fullDate.localeCompare(b.fullDate))
      }
    })

    return forecasts
  }, [entries, users])

  const improvementOpportunities = useMemo(() => {
    const opportunities: Array<{
      userId: number
      userName: string
      factorId: number
      stationName: string
      potentialSavings: number
      currentGap: number
    }> = []

    Object.entries(userForecasts).forEach(([userId, forecast]) => {
      forecast.stationForecasts.forEach(station => {
        if (station.mostRecentTime && station.bestTime && station.projectedTime !== '--') {
          const current = timeToSeconds(station.mostRecentTime)
          const best = timeToSeconds(station.bestTime)
          const gap = current - best
          
          if (gap > 5) { // Only show meaningful gaps (5+ seconds)
            opportunities.push({
              userId: parseInt(userId),
              userName: userMap[parseInt(userId)]?.name || 'Unknown',
              factorId: station.factorId,
              stationName: station.name,
              potentialSavings: gap,
              currentGap: gap
            })
          }
        }
      })
    })

    return opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings)
  }, [userForecasts, userMap])

  const chartData = useMemo(() => {
    const dates = new Set<string>()
    Object.values(userForecasts).forEach(forecast => {
      forecast.trendData.forEach(point => dates.add(point.fullDate))
    })

    const sortedDates = Array.from(dates).sort()
    
    return sortedDates.map(fullDate => {
      const result: any = {
        date: new Date(fullDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate
      }

      users.forEach(user => {
        const forecast = userForecasts[user.id]
        const dataPoint = forecast?.trendData.find(p => p.fullDate === fullDate)
        
        if (dataPoint?.actual !== undefined) {
          result[`${user.name}_actual`] = Math.round(dataPoint.actual / 60) // Convert to minutes for chart
        }
        if (dataPoint?.projected !== undefined) {
          result[`${user.name}_projected`] = Math.round(dataPoint.projected / 60) // Convert to minutes for chart
        }
      })

      return result
    })
  }, [userForecasts, users])

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">HYROX Boston Race Forecast</h1>
        <p className="text-muted-foreground">
          October 10, 2026 • {daysUntilRace} days remaining
        </p>
      </div>

      {/* Projected Race Time Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {users.map(user => {
          const forecast = userForecasts[user.id]
          if (!forecast) return null

          const projectedMinutes = Math.round(forecast.projectedRaceTime / 60)
          const projectedTimeStr = secondsToTime(forecast.projectedRaceTime)
          const bestSimStr = forecast.bestSimulationTime ? secondsToTime(forecast.bestSimulationTime) : null
          const improvement = forecast.bestSimulationTime ? forecast.bestSimulationTime - forecast.projectedRaceTime : 0

          return (
            <div key={user.id} className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: user.color }}
                />
                <h3 className="text-xl font-semibold text-foreground">{user.name}</h3>
              </div>
              
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-primary">{projectedTimeStr}</div>
                <p className="text-sm text-muted-foreground">Projected Race Time</p>
                
                {bestSimStr && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Best Simulation: <span className="text-foreground font-medium">{bestSimStr}</span>
                    </p>
                    {Math.abs(improvement) > 5 && (
                      <p className="text-sm">
                        {improvement > 0 ? (
                          <span className="text-green-500">↓ {secondsToTime(improvement)} improvement projected</span>
                        ) : (
                          <span className="text-red-500">↑ {secondsToTime(-improvement)} slower than best</span>
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Station Breakdown Tables */}
      {users.map(user => {
        const forecast = userForecasts[user.id]
        if (!forecast) return null

        return (
          <div key={user.id} className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: user.color }}
                />
                <h3 className="text-lg font-semibold text-foreground">{user.name} - Station Breakdown</h3>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Station</th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Most Recent</th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Best Ever</th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Projected</th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Trend</th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.stationForecasts.map(station => (
                    <tr key={station.factorId} className="border-t border-border hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{station.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{station.mostRecentTime || '--'}</td>
                      <td className="px-4 py-3 text-sm text-green-600 font-medium">{station.bestTime || '--'}</td>
                      <td className="px-4 py-3 text-sm text-foreground font-medium">{station.projectedTime}</td>
                      <td className="px-4 py-3 text-sm">
                        {station.trend === 'improving' && (
                          <span className="text-green-500 flex items-center gap-1">
                            ↓ {Math.abs(station.weeklyChangeSeconds).toFixed(0)}s/wk
                          </span>
                        )}
                        {station.trend === 'worsening' && (
                          <span className="text-red-500 flex items-center gap-1">
                            ↑ {Math.abs(station.weeklyChangeSeconds).toFixed(0)}s/wk
                          </span>
                        )}
                        {station.trend === 'flat' && (
                          <span className="text-muted-foreground">→ stable</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {station.contributionPercent > 0 ? `${station.contributionPercent.toFixed(1)}%` : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {/* Trend Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Race Time Trends & Projections</h3>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis 
                label={{ value: 'Time (minutes)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  `${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, '0')}`,
                  name
                ]}
              />
              <Legend />
              
              <ReferenceLine x="Oct 10" stroke="#ef4444" strokeDasharray="5 5" />
              
              {users.map(user => (
                <Line
                  key={`${user.name}_actual`}
                  type="monotone"
                  dataKey={`${user.name}_actual`}
                  stroke={user.color}
                  strokeWidth={2}
                  dot={{ fill: user.color, strokeWidth: 2, r: 4 }}
                  name={`${user.name} (Actual)`}
                  connectNulls={false}
                />
              ))}
              
              {users.map(user => (
                <Line
                  key={`${user.name}_projected`}
                  type="monotone"
                  dataKey={`${user.name}_projected`}
                  stroke={user.color}
                  strokeWidth={2}
                  strokeDasharray="8 4"
                  dot={{ fill: user.color, strokeWidth: 2, r: 4 }}
                  name={`${user.name} (Projected)`}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Improvement Opportunities */}
      {improvementOpportunities.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Improvement Opportunities</h3>
          
          <div className="space-y-3">
            {improvementOpportunities.slice(0, 5).map((opp, index) => (
              <div key={`${opp.userId}-${opp.factorId}`} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-lg font-bold text-muted-foreground">#{index + 1}</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {opp.userName} - {opp.stationName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Gap to personal best: {secondsToTime(opp.currentGap)}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600">
                    -{secondsToTime(opp.potentialSavings)}
                  </p>
                  <p className="text-xs text-muted-foreground">potential savings</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 <strong>Focus tip:</strong> Improving your weakest station by 30 seconds could have a significant impact on your overall race time.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}