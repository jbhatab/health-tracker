import { NextRequest, NextResponse } from 'next/server'
import { db, entries } from '@/db'
import { eq } from 'drizzle-orm'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()
    const { date, raw_text, rawText, scores } = body

    if (!date || !scores) {
      return NextResponse.json({ error: 'Date and scores are required' }, { status: 400 })
    }

    const result = await db
      .update(entries)
      .set({ date, rawText: rawText || raw_text, scores })
      .where(eq(entries.id, id))
      .returning()

    if (result.length === 0) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error updating entry:', error)
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const result = await db
      .delete(entries)
      .where(eq(entries.id, id))
      .returning()

    if (result.length === 0) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Entry deleted successfully' })
  } catch (error) {
    console.error('Error deleting entry:', error)
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 })
  }
}