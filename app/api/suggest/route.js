import { NextResponse } from 'next/server'
import { SUGGEST_SYSTEM_PROMPT } from '@/lib/prompts'
import { getGroqClient, GROQ_MODEL } from '@/lib/server/groq'
import { normalizeChatHistory, parseJsonResponse } from '@/lib/analysis'

export async function POST(request) {
  try {
    const { originalNotice, conversationMessages, messages } = await request.json()

    if (!originalNotice || typeof originalNotice !== 'string' || !originalNotice.trim()) {
      return NextResponse.json({ suggestions: [] })
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ suggestions: [] })
    }

    const history = normalizeChatHistory(conversationMessages ?? messages)

    const groq = getGroqClient()
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.5,
      messages: [
        {
          role: 'system',
          content: `${SUGGEST_SYSTEM_PROMPT}\n\nOriginal notice:\n\n${originalNotice.trim()}`,
        },
        ...history,
        {
          role: 'user',
          content:
            'Return JSON {"suggestions": ["...", "...", "..."]} with up to 3 short follow-up questions I might ask next.',
        },
      ],
    })

    const content = completion.choices[0]?.message?.content
    const parsed = content ? parseJsonResponse(content) : {}
    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions
          .filter((s) => typeof s === 'string' && s.trim())
          .map((s) => s.trim())
          .slice(0, 3)
      : []

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('[POST /api/suggest]', error)
    return NextResponse.json({ suggestions: [] })
  }
}
