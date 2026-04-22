import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(timeStr: string): string {
  return timeStr
}

export function formatWeight(weightStr: string): string {
  return `${weightStr} lbs`
}

export function formatRepsWeight(repsWeightStr: string): string {
  const [reps, weight] = repsWeightStr.split('x')
  return `${reps} × ${weight} lbs`
}

export function parseRepsWeight(repsWeightStr: string): { reps: number; weight: number; volume: number } {
  const [reps, weight] = repsWeightStr.split('x').map(Number)
  return { reps, weight, volume: reps * weight }
}

export function timeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':').map(Number)
  if (parts.length === 2) {
    // mm:ss format
    return parts[0] * 60 + parts[1]
  } else if (parts.length === 3) {
    // hh:mm:ss format
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  return 0
}

export function secondsToTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}