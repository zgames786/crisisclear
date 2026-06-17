import { NextResponse } from 'next/server'
import {
  buildChatGroqMessages,
  normalizeChatHistory,
} from '@/lib/analysis'
import { getGroqClient, GROQ_MODEL } from '@/lib/server/groq'
import { languageInstruction } from '@/lib/prompts'

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      originalNotice,
      clarityPreference = 'simple',
      language = 'en',
      conversationMessages,
      messages,
      userMessage,
    } = body

    if (!originalNotice || typeof originalNotice !== 'string' || !originalNotice.trim()) {
      return NextResponse.json({ error: 'originalNotice is required' }, { status: 400 })
    }

    if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
      return NextResponse.json({ error: 'userMessage is required' }, { status: 400 })
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Groq API key is not configured on the server' },
        { status: 500 }
      )
    }

    const history = normalizeChatHistory(conversationMessages ?? messages)
    const groqMessages = buildChatGroqMessages({
      originalNotice,
      clarityPreference,
      language,
      history,
      userMessage,
    })

    const groq = getGroqClient()
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: groqMessages,
      temperature: 0.5,
    })

    const content = completion.choices[0]?.message?.content
    if (!content?.trim()) {
      return NextResponse.json({ error: 'No response from Groq' }, { status: 500 })
    }

    return NextResponse.json({ message: content.trim() })
  } catch (error) {
    console.error('[POST /api/chat]', error)
    return NextResponse.json(
      {
        error: 'Failed to send message',
        details: error.message,
        status: error.status || null,
      },
      { status: 500 }
    )
  }
}
