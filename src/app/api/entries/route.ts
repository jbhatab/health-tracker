import { NextRequest, NextResponse } from 'next/server'
import { db, entries } from '@/db'
import { desc, and, gte, lte } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const conditions = []
    if (from) conditions.push(gte(entries.date, from))
    if (to) conditions.push(lte(entries.date, to))

    const result = conditions.length > 0
      ? await db.select().from(entries).where(and(...conditions)).orderBy(desc(entries.date))
      : await db.select().from(entries).orderBy(desc(entries.date))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching entries:', error)
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, raw_text, rawText, scores } = body

    if (!date || !scores) {
      return NextResponse.json({ error: 'Date and scores are required' }, { status: 400 })
    }

    const result = await db.insert(entries).values({
      date,
      rawText: rawText || raw_text,
      scores,
    }).returning()

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating entry:', error)
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 })
  }
}