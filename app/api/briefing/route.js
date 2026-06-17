import { NextResponse } from 'next/server'
import { BRIEFING_SYSTEM_PROMPT, languageInstruction } from '@/lib/prompts'
import { getGroqClient, GROQ_MODEL } from '@/lib/server/groq'
import { parseJsonResponse } from '@/lib/analysis'

export async function POST(request) {
  try {
    const { cases, language = 'en' } = await request.json()

    if (!Array.isArray(cases) || cases.length === 0) {
      return NextResponse.json({ briefing: '', topPriorities: [] })
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Groq API key is not configured on the server' },
        { status: 500 }
      )
    }

    const safeCases = cases.slice(0, 25).map((item) => ({
      title: String(item?.title ?? 'Case').slice(0, 120),
      urgency: String(item?.urgencyLevel ?? ''),
      summary: String(item?.summary ?? '').slice(0, 400),
      dates: Array.isArray(item?.importantDates) ? item.importantDates.slice(0, 6) : [],
    }))

    const groq = getGroqClient()
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.4,
      messages: [
        { role: 'system', content: BRIEFING_SYSTEM_PROMPT + languageInstruction(language) },
        {
          role: 'user',
          content: `Today is ${new Date().toDateString()}.\n\nMy open cases (JSON):\n${JSON.stringify(safeCases)}\n\nReturn JSON {"briefing":"2-3 sentence calm overview","topPriorities":["short action 1","short action 2"]}.`,
        },
      ],
    })

    const content = completion.choices[0]?.message?.content
    const parsed = content ? parseJsonResponse(content) : {}

    return NextResponse.json({
      briefing: typeof parsed.briefing === 'string' ? parsed.briefing.trim() : '',
      topPriorities: Array.isArray(parsed.topPriorities)
        ? parsed.topPriorities
            .filter((s) => typeof s === 'string' && s.trim())
            .map((s) => s.trim())
            .slice(0, 5)
        : [],
    })
  } catch (error) {
    console.error('[POST /api/briefing]', error)
    return NextResponse.json(
      { error: 'Failed to generate briefing', details: error.message },
      { status: 500 }
    )
  }
}
