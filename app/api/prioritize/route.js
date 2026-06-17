import { NextResponse } from 'next/server'
import { PRIORITIZE_SYSTEM_PROMPT } from '@/lib/prompts'
import { getGroqClient, GROQ_MODEL } from '@/lib/server/groq'
import { parseJsonResponse } from '@/lib/analysis'

export async function POST(request) {
  try {
    const { items } = await request.json()

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ranked: [] })
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Groq API key is not configured on the server' },
        { status: 500 }
      )
    }

    const safeItems = items.slice(0, 60).map((item, index) => ({
      id: String(item?.id ?? index),
      text: String(item?.text ?? '').slice(0, 300),
      source: String(item?.source ?? '').slice(0, 160),
    }))

    const groq = getGroqClient()
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        { role: 'system', content: PRIORITIZE_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Tasks (JSON):\n${JSON.stringify(safeItems)}\n\nReturn JSON {"ranked":[{"id":"...","priority":"High|Medium|Low"}]} ordered most urgent first, including every id exactly once.`,
        },
      ],
    })

    const content = completion.choices[0]?.message?.content
    const parsed = content ? parseJsonResponse(content) : {}
    const ranked = Array.isArray(parsed.ranked)
      ? parsed.ranked
          .filter((entry) => entry && entry.id != null)
          .map((entry) => ({
            id: String(entry.id),
            priority: ['High', 'Medium', 'Low'].includes(entry.priority)
              ? entry.priority
              : 'Medium',
          }))
      : []

    return NextResponse.json({ ranked })
  } catch (error) {
    console.error('[POST /api/prioritize]', error)
    return NextResponse.json(
      { error: 'Failed to prioritize checklist', details: error.message },
      { status: 500 }
    )
  }
}
