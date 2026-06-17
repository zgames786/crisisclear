import { NextResponse } from 'next/server'
import {
  ANALYSIS_JSON_SHAPE,
  INITIAL_SYSTEM_PROMPT,
  languageInstruction,
} from '@/lib/prompts'
import { getGroqClient, GROQ_MODEL } from '@/lib/server/groq'
import { normalizeAnalysis, parseJsonResponse } from '@/lib/analysis'

export async function POST(request) {
  try {
    const body = await request.json()
    const { noticeText, clarityPreference = 'simple', language = 'en' } = body

    if (!noticeText || typeof noticeText !== 'string' || !noticeText.trim()) {
      return NextResponse.json({ error: 'noticeText is required' }, { status: 400 })
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Groq API key is not configured on the server' },
        { status: 500 }
      )
    }

    const groq = getGroqClient()
    const systemPrompt = INITIAL_SYSTEM_PROMPT + languageInstruction(language)
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Clarity preference: ${clarityPreference}\n\nNotice to analyze:\n\n${noticeText.trim()}\n\nReturn JSON matching:\n${ANALYSIS_JSON_SHAPE}`,
        },
      ],
      temperature: 0.3,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'No response from Groq' }, { status: 500 })
    }

    const parsed = parseJsonResponse(content)
    return NextResponse.json(normalizeAnalysis(parsed))
  } catch (error) {
    console.error('[POST /api/simplify]', error)
    return NextResponse.json(
      {
        error: 'Failed to simplify notice',
        details: error.message,
        status: error.status || null,
      },
      { status: 500 }
    )
  }
}
