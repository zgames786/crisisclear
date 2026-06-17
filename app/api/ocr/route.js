import { NextResponse } from 'next/server'
import { getGroqClient } from '@/lib/server/groq'
import { normalizeAnalysis, parseJsonResponse } from '@/lib/analysis'
import { ANALYSIS_JSON_SHAPE, ANALYSIS_FIELD_RULES } from '@/lib/prompts'

const MAX_IMAGE_BYTES = 12 * 1024 * 1024 // 12 MB

const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

function buildLanguageInstruction(language) {
  if (!language || language === 'en') return ''
  const names = {
    es: 'Spanish',
    fr: 'French',
    zh: 'Mandarin Chinese (Simplified)',
    ar: 'Arabic',
    hi: 'Hindi',
    pt: 'Portuguese',
    ru: 'Russian',
    ko: 'Korean',
    ja: 'Japanese',
    de: 'German',
  }
  const name = names[language] || language
  return `\n\nIMPORTANT: Write ALL text fields in ${name}. The user reads ${name}.`
}

export async function POST(request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Groq API key is not configured on the server' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const clarityPreference = formData.get('clarityPreference') || 'simple'
    const language = formData.get('language') || 'en'

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const mimeType = file.type || ''
    const isImage = mimeType.startsWith('image/')
    const isPdf = mimeType === 'application/pdf'

    if (!isImage && !isPdf) {
      return NextResponse.json(
        { error: 'Only image files (JPEG, PNG, WebP, GIF) and PDFs are supported' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Please upload a file under 12 MB.' },
        { status: 400 }
      )
    }

    const base64 = Buffer.from(bytes).toString('base64')

    // PDFs: use the first-page image approach via the vision model
    // Images: pass directly
    const imageMediaType = isPdf ? 'application/pdf' : mimeType
    const dataUrl = `data:${imageMediaType};base64,${base64}`

    const languageInstruction = buildLanguageInstruction(language)

    const systemPrompt = `You are CrisisClear, an assistant that reads document images and turns them into clear, actionable guidance.

First, read all the text visible in the image carefully. Then analyze the content and produce a structured CrisisClear analysis.

${ANALYSIS_FIELD_RULES}${languageInstruction}

Return ONLY valid JSON with this exact shape — no markdown, no extra text:
${ANALYSIS_JSON_SHAPE}`

    const groq = getGroqClient()

    const completion = await groq.chat.completions.create({
      model: VISION_MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: dataUrl },
            },
            {
              type: 'text',
              text: `Clarity preference: ${clarityPreference}

Please read all the text in this document image and produce a complete CrisisClear analysis as JSON.`,
            },
          ],
        },
      ],
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'No response from vision model' }, { status: 500 })
    }

    // Also extract plain text for display in the textarea
    const extractTextCompletion = await groq.chat.completions.create({
      model: VISION_MODEL,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: dataUrl } },
            {
              type: 'text',
              text: 'Transcribe all text visible in this document exactly as written. Output ONLY the text — no commentary, no formatting, no labels.',
            },
          ],
        },
      ],
    })

    const extractedText =
      extractTextCompletion.choices[0]?.message?.content?.trim() || ''

    const parsed = parseJsonResponse(content)
    return NextResponse.json({
      analysis: normalizeAnalysis(parsed),
      extractedText,
    })
  } catch (error) {
    console.error('[POST /api/ocr]', error)
    return NextResponse.json(
      { error: 'Failed to process document', details: error.message },
      { status: 500 }
    )
  }
}
