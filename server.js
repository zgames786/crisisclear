import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import Groq from 'groq-sdk'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '1mb' }))

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const ANALYSIS_JSON_SHAPE = `{
  "response": "",
  "whatThisMeans": [],
  "whatYouNeedToDo": [],
  "importantDates": [],
  "urgencyLevel": "",
  "riskFlags": [],
  "checklist": [],
  "whoToContact": []
}`

const ANALYSIS_FIELD_RULES = `Field rules:
- response: a helpful paragraph answer in plain language (like a clear ChatGPT reply)
- whatThisMeans: array of bullet points explaining the notice or new information
- whatYouNeedToDo: array of clear action items
- importantDates: array of { "label": "date name", "date": "when" }
- urgencyLevel: exactly "High", "Medium", or "Low"
- riskFlags: array of { "label": "flag name", "emoji": "single emoji" }
- checklist: array of actionable checklist item strings
- whoToContact: array of { "name": "contact name", "detail": "how to reach them" }

Clarity preference rules:
- "simple": keep language very short, use fewer items in arrays
- "detailed": include full context and complete lists

Return ONLY valid JSON with the exact shape above — no markdown, no extra text.`

const INITIAL_SYSTEM_PROMPT = `You are CrisisClear, an assistant that turns confusing notices, emergency alerts, school announcements, government letters, and medical instructions into clear, actionable guidance.

Analyze the notice and return a complete CrisisClear analysis.

${ANALYSIS_FIELD_RULES}`

const CHAT_SYSTEM_PROMPT = `You are CrisisClear, a helpful assistant helping people understand confusing notices, emergency alerts, school announcements, government letters, and medical instructions.

The user already received a structured breakdown of their notice. They are now asking follow-up questions in a conversation.

Answer in clear, friendly plain language — like ChatGPT. Use short paragraphs when helpful.

Rules:
- Consider the original notice, the full conversation history, and their newest question
- Stay focused on the notice and conversation; do not invent facts not supported by them
- If clarity preference is "simple", use short plain language
- If clarity preference is "detailed", give fuller explanations when useful
- Reply with conversational text only — not JSON, not bullet-card sections`

function parseJsonResponse(content) {
  const trimmed = content.trim()
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = fenceMatch ? fenceMatch[1].trim() : trimmed
  return JSON.parse(jsonStr)
}

function ensureArray(value) {
  if (Array.isArray(value)) return value.filter((item) => item != null && item !== '')
  if (value == null || value === '') return []
  return [value]
}

function normalizeRiskFlags(flags) {
  if (!Array.isArray(flags)) return []
  return flags.map((flag) => {
    if (typeof flag === 'string') {
      return { label: flag, emoji: '⚠️' }
    }
    return {
      label: flag.label || flag.keyword || 'Flag',
      emoji: flag.emoji || '⚠️',
    }
  })
}

function normalizeImportantDates(dates) {
  if (!Array.isArray(dates)) return []
  return dates
    .map((item) => {
      if (typeof item === 'object' && item != null) {
        return {
          label: String(item.label || 'Date'),
          date: String(item.date || ''),
        }
      }
      if (typeof item === 'string') {
        const colon = item.indexOf(':')
        if (colon > 0) {
          return { label: item.slice(0, colon).trim(), date: item.slice(colon + 1).trim() }
        }
        return { label: 'Date', date: item }
      }
      return null
    })
    .filter((item) => item && (item.label || item.date))
}

function normalizeWhoToContact(contacts) {
  if (!Array.isArray(contacts)) return []
  return contacts
    .map((contact) => {
      if (typeof contact === 'string') {
        return { name: contact, detail: '' }
      }
      return {
        name: String(contact.name || 'Contact'),
        detail: String(contact.detail || ''),
      }
    })
    .filter((contact) => contact.name)
}

function normalizeAnalysis(parsed) {
  const whatThisMeans = ensureArray(parsed.whatThisMeans)
  if (!whatThisMeans.length && parsed.whatThisMeans != null && parsed.whatThisMeans !== '') {
    whatThisMeans.push(String(parsed.whatThisMeans))
  }

  let whatYouNeedToDo = ensureArray(parsed.whatYouNeedToDo)
  if (!whatYouNeedToDo.length) {
    whatYouNeedToDo = ensureArray(parsed.nextSteps ?? parsed.newActions)
  }

  let importantDates = normalizeImportantDates(parsed.importantDates)
  if (!importantDates.length && Array.isArray(parsed.importantUpdates)) {
    importantDates = normalizeImportantDates(parsed.importantUpdates)
  }

  let whoToContact = normalizeWhoToContact(parsed.whoToContact)

  let response = parsed.response ? String(parsed.response).trim() : ''
  if (!response && parsed.summary) response = String(parsed.summary).trim()
  if (!response && parsed.message) response = String(parsed.message).trim()
  if (!response && parsed.answer?.length) response = ensureArray(parsed.answer).join(' ')
  if (!response && whatThisMeans.length) {
    response = whatThisMeans.join(' ')
  }

  return {
    response,
    whatThisMeans,
    whatYouNeedToDo,
    importantDates,
    urgencyLevel: ['High', 'Medium', 'Low'].includes(parsed.urgencyLevel)
      ? parsed.urgencyLevel
      : 'Medium',
    riskFlags: normalizeRiskFlags(parsed.riskFlags),
    checklist: ensureArray(parsed.checklist),
    whoToContact,
  }
}

function logIncomingRequest(route, body) {
  console.log(`[${route}] incoming request body:`, JSON.stringify(body, null, 2))
}

function logGroqPayload(route, payload) {
  console.log(`[${route}] outgoing Groq payload:`, JSON.stringify(payload, null, 2))
}

function logGroqResponse(route, response) {
  console.log(`[${route}] Groq response:`, JSON.stringify(response, null, 2))
}

function logGroqError(route, error) {
  console.error(`[${route}] Groq error:`, error)
  console.error(`[${route}] full error object:`, {
    message: error?.message,
    status: error?.status,
    name: error?.name,
    stack: error?.stack,
    response: error?.response,
    error: error?.error,
  })
}

function normalizeChatHistory(messages) {
  if (!Array.isArray(messages)) return []

  return messages
    .filter((msg) => msg?.role && msg?.content != null && String(msg.content).trim())
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: String(msg.content).trim(),
    }))
}

function buildChatGroqMessages({ originalNotice, clarityPreference, history, userMessage }) {
  return [
    {
      role: 'system',
      content: `${CHAT_SYSTEM_PROMPT}\n\nClarity preference: ${clarityPreference}\n\nOriginal notice:\n\n${originalNotice.trim()}`,
    },
    ...history,
    { role: 'user', content: userMessage.trim() },
  ]
}

app.post('/api/simplify', async (req, res) => {
  const route = 'POST /api/simplify'

  try {
    const { noticeText, clarityPreference = 'simple' } = req.body
    logIncomingRequest(route, req.body)

    if (!noticeText || typeof noticeText !== 'string' || !noticeText.trim()) {
      return res.status(400).json({ error: 'noticeText is required' })
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'Groq API key is not configured on the server' })
    }

    const groqPayload = {
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: INITIAL_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Clarity preference: ${clarityPreference}\n\nNotice to analyze:\n\n${noticeText.trim()}\n\nReturn JSON matching:\n${ANALYSIS_JSON_SHAPE}`,
        },
      ],
      temperature: 0.3,
    }

    logGroqPayload(route, groqPayload)

    const completion = await groq.chat.completions.create(groqPayload)

    logGroqResponse(route, completion)

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return res.status(500).json({ error: 'No response from Groq' })
    }

    const parsed = parseJsonResponse(content)
    res.json(normalizeAnalysis(parsed))
  } catch (error) {
    logGroqError(route, error)
    res.status(500).json({
      error: 'Failed to simplify notice',
      details: error.message,
      status: error.status || null,
    })
  }
})

app.post('/api/chat', async (req, res) => {
  const route = 'POST /api/chat'

  try {
    const {
      originalNotice,
      clarityPreference = 'simple',
      conversationMessages,
      messages,
      userMessage,
    } = req.body

    logIncomingRequest(route, req.body)

    if (!originalNotice || typeof originalNotice !== 'string' || !originalNotice.trim()) {
      return res.status(400).json({ error: 'originalNotice is required' })
    }

    if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
      return res.status(400).json({ error: 'userMessage is required' })
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'Groq API key is not configured on the server' })
    }

    const history = normalizeChatHistory(conversationMessages ?? messages)
    const groqMessages = buildChatGroqMessages({
      originalNotice,
      clarityPreference,
      history,
      userMessage,
    })

    const groqPayload = {
      model: 'llama-3.3-70b-versatile',
      messages: groqMessages,
      temperature: 0.5,
    }

    logGroqPayload(route, groqPayload)

    const completion = await groq.chat.completions.create(groqPayload)

    logGroqResponse(route, completion)

    const content = completion.choices[0]?.message?.content
    if (!content?.trim()) {
      return res.status(500).json({ error: 'No response from Groq' })
    }

    res.json({ message: content.trim() })
  } catch (error) {
    logGroqError(route, error)
    res.status(500).json({
      error: 'Failed to send message',
      details: error.message,
      status: error.status || null,
    })
  }
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, routes: ['POST /api/simplify', 'POST /api/chat', 'GET /api/health'] })
})

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`CrisisClear API running on http://localhost:${PORT}`)
  console.log('Routes: POST /api/simplify, POST /api/chat, GET /api/health')
})
