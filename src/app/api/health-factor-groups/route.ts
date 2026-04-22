import { NextRequest, NextResponse } from 'next/server'
import { db, healthFactorGroups } from '@/db'

export async function GET() {
  try {
    const result = await db.select().from(healthFactorGroups)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching health factor groups:', error)
    return NextResponse.json({ error: 'Failed to fetch health factor groups' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, ownerUserId } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const result = await db.insert(healthFactorGroups).values({
      name,
      ownerUserId,
    }).returning()

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating health factor group:', error)
    return NextResponse.json({ error: 'Failed to create health factor group' }, { status: 500 })
  }
}