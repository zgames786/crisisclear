export function parseJsonResponse(content) {
  const trimmed = content.trim()
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = fenceMatch ? fenceMatch[1].trim() : trimmed
  return JSON.parse(jsonStr)
}

export function ensureArray(value) {
  if (Array.isArray(value)) return value.filter((item) => item != null && item !== '')
  if (value == null || value === '') return []
  return [value]
}

export function normalizeRiskFlags(flags) {
  if (!Array.isArray(flags)) return []
  return flags.map((flag) => {
    if (typeof flag === 'string') {
      return { label: flag, emoji: '⚠️', keyword: flag.toLowerCase() }
    }
    return {
      label: flag.label || flag.keyword || 'Flag',
      emoji: flag.emoji || '⚠️',
      keyword: (flag.keyword || flag.label || 'flag').toLowerCase(),
    }
  })
}

export function normalizeImportantDates(dates) {
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

export function normalizeWhoToContact(contacts) {
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

export function emptyAnalysis() {
  return {
    response: '',
    whatThisMeans: [],
    whatYouNeedToDo: [],
    importantDates: [],
    urgencyLevel: 'Medium',
    riskFlags: [],
    checklist: [],
    whoToContact: [],
  }
}

export function normalizeAnalysis(parsed) {
  if (!parsed || typeof parsed !== 'object') return emptyAnalysis()

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

  const whoToContact = normalizeWhoToContact(parsed.whoToContact)

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

export function normalizeChatHistory(messages) {
  if (!Array.isArray(messages)) return []

  return messages
    .filter((msg) => msg?.role && msg?.content != null && String(msg.content).trim())
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: String(msg.content).trim(),
    }))
}

import { CHAT_SYSTEM_PROMPT, languageInstruction } from './prompts.js'

export function buildChatGroqMessages({ originalNotice, clarityPreference, language = 'en', history, userMessage }) {
  const langNote = languageInstruction(language)
  return [
    {
      role: 'system',
      content: `${CHAT_SYSTEM_PROMPT}${langNote}\n\nClarity preference: ${clarityPreference}\n\nOriginal notice:\n\n${originalNotice.trim()}`,
    },
    ...history,
    { role: 'user', content: userMessage.trim() },
  ]
}
