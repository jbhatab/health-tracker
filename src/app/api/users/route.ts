import { NextResponse } from 'next/server'
import { db, users } from '@/db'

export async function GET() {
  try {
    const result = await db.select().from(users)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}