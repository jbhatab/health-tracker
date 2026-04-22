import { NextRequest, NextResponse } from 'next/server'
import { db, healthFactors } from '@/db'
import { asc } from 'drizzle-orm'

export async function GET() {
  try {
    const result = await db
      .select()
      .from(healthFactors)
      .orderBy(asc(healthFactors.groupId), asc(healthFactors.sortOrder))
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching health factors:', error)
    return NextResponse.json({ error: 'Failed to fetch health factors' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { groupId, name, unit, description, sortOrder } = body

    if (!groupId || !name || !unit) {
      return NextResponse.json({ error: 'Group ID, name, and unit are required' }, { status: 400 })
    }

    const result = await db.insert(healthFactors).values({
      groupId,
      name,
      unit,
      description,
      sortOrder: sortOrder || 0,
    }).returning()

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating health factor:', error)
    return NextResponse.json({ error: 'Failed to create health factor' }, { status: 500 })
  }
}