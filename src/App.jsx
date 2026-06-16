import { useState, useEffect, useRef } from 'react'
import './App.css'

const STORAGE_KEYS = {
  checklist: 'crisisclear-checklist',
  savedNotices: 'crisisclear-saved-notices',
  settings: 'crisisclear-settings',
}

const DEFAULT_SETTINGS = {
  theme: 'light',
  fontSize: 'medium',
  clarityPreference: 'simple',
}

const FONT_SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
]

const CLARITY_PREFERENCE_OPTIONS = [
  { value: 'simple', label: 'Simple', description: 'Short summaries and fewer items per section.' },
  { value: 'detailed', label: 'Detailed', description: 'Full explanations with all information shown.' },
]

const CLARITY_MODES = [
  { value: 'very-simple', label: 'Very simple' },
  { value: 'parent-friendly', label: 'Parent friendly' },
  { value: 'student-friendly', label: 'Student friendly' },
  { value: 'senior-friendly', label: 'Senior friendly' },
]

const RISK_FLAGS = [
  { keyword: 'deadline', label: 'Deadline', emoji: '⏰' },
  { keyword: 'appointment', label: 'Appointment', emoji: '📅' },
  { keyword: 'medicine', label: 'Medicine', emoji: '💊' },
  { keyword: 'emergency', label: 'Emergency', emoji: '🚨' },
  { keyword: 'call', label: 'Call required', emoji: '📞' },
  { keyword: 'closed', label: 'Closure', emoji: '🚫' },
  { keyword: 'application', label: 'Application', emoji: '📝' },
  { keyword: 'required', label: 'Required action', emoji: '⚠️' },
]

const CARD_META = {
  response: { icon: '💬', title: 'Response' },
  meaning: { icon: '💡', title: 'What This Means' },
  actions: { icon: '✅', title: 'What You Need To Do' },
  dates: { icon: '📆', title: 'Important Dates' },
  urgency: { icon: '⚡', title: 'Urgency Level' },
  checklist: { icon: '☑️', title: 'Checklist' },
  contact: { icon: '📇', title: 'Who To Contact' },
}

const SAMPLE_NOTICES = {
  school: `NOTICE FROM LINCOLN ELEMENTARY SCHOOL

Due to severe weather conditions, Lincoln Elementary School will be CLOSED on Thursday, March 14, 2026. All after-school activities, including sports and tutoring, are cancelled.

Students should complete the emergency learning packet sent home last week. Teachers will be available by email between 9 AM and 3 PM for questions.

School will reopen Friday, March 15, 2026, unless you receive another notice. Please check the school website and your email for updates.

For childcare resources, contact the district family support line.`,

  hospital: `DISCHARGE INSTRUCTIONS — RIVERSIDE MEDICAL CENTER

Patient: [Your Name]
Discharge Date: March 12, 2026

You are being discharged with a prescription for Amoxicillin 500mg — take one capsule every 8 hours for 7 days. Finish all medicine even if you feel better.

Wound care: Change the dressing daily. Keep the area clean and dry. Do not soak in water for 14 days.

Follow-up appointment required with Dr. Patel within 5 business days. Call 555-0142 to schedule.

Return to the emergency room immediately if you develop fever above 101°F, increased redness, swelling, or difficulty breathing.`,

  government: `DEPARTMENT OF COMMUNITY SERVICES
SNAP BENEFIT RENEWAL NOTICE

Your Supplemental Nutrition Assistance Program (SNAP) benefits are scheduled to expire on April 30, 2026. You must submit a renewal application to continue receiving food assistance.

Required documents: proof of income for all household members, rent or mortgage statement, utility bills, and government-issued ID.

Application deadline: April 15, 2026. Late applications may result in a gap in benefits.

Apply online at benefits.gov/renew or visit your local assistance office. Call 1-800-555-0199 for help completing your application.`,

  weather: `NATIONAL WEATHER SERVICE — EMERGENCY ALERT
TORNADO WARNING — TAKE SHELTER NOW

A tornado warning is in effect for your area until 8:45 PM tonight. This is not a drill. Move to an interior room on the lowest floor, away from windows.

Shelter locations: Lincoln Community Center (open 24 hours) and Riverside High School gymnasium.

Road closures are in effect on Highway 9 and Main Street due to flooding. Do not drive through standing water.

Call 911 for life-threatening emergencies. For non-emergency storm updates, call the county hotline at 555-0300.`,
}

const MOCK_RESPONSES = {
  school: {
    whatThisMeans:
      "Your child's school is closed tomorrow because of dangerous weather. Regular classes and after-school programs are cancelled. Learning should continue at home using the packet already sent home.",
    whatYouNeedToDo: [
      'Keep your child home on the closure date.',
      'Have them work on the emergency learning packet.',
      'Email teachers if your child needs help (9 AM – 3 PM).',
      'Watch for updates before the reopening date.',
    ],
    importantDates: [
      { label: 'School closed', date: 'Thursday, March 14, 2026' },
      { label: 'Expected reopening', date: 'Friday, March 15, 2026 (unless notified)' },
    ],
    urgencyLevel: 'Medium',
    checklist: [
      'Confirm the closure date on the school website',
      'Locate the emergency learning packet',
      'Arrange childcare if needed',
      'Save the family support line number',
      'Check email for any updates tonight',
    ],
    whoToContact: [
      { name: "Your child's teacher", detail: 'Email during 9 AM – 3 PM for schoolwork help' },
      { name: 'District family support line', detail: 'For childcare and family resources' },
      { name: 'School website', detail: 'For official closure and reopening updates' },
    ],
  },

  hospital: {
    whatThisMeans:
      'You are leaving the hospital today. You have a medicine to take on a schedule, daily wound care steps, and a required follow-up visit within 5 business days. Some symptoms mean you should go back to the ER right away.',
    whatYouNeedToDo: [
      'Take Amoxicillin every 8 hours for 7 days — do not stop early.',
      'Change your wound dressing once a day; keep it clean and dry.',
      'Avoid soaking the wound in water for 14 days.',
      'Schedule a follow-up with Dr. Patel within 5 business days.',
    ],
    importantDates: [
      { label: 'Discharge date', date: 'March 12, 2026' },
      { label: 'Medicine ends', date: '7 days after starting (finish all doses)' },
      { label: 'Follow-up deadline', date: 'Within 5 business days of discharge' },
      { label: 'No soaking', date: 'Until 14 days after discharge' },
    ],
    urgencyLevel: 'High',
    checklist: [
      'Fill the Amoxicillin prescription today',
      'Set alarms for every-8-hour doses',
      'Buy clean bandages and supplies',
      'Call 555-0142 to book Dr. Patel follow-up',
      'Write down ER warning signs on the fridge',
    ],
    whoToContact: [
      { name: "Dr. Patel's office", detail: '555-0142 — schedule follow-up within 5 business days' },
      { name: 'Pharmacy', detail: 'Pick up Amoxicillin 500mg prescription' },
      { name: 'Emergency room', detail: 'Go immediately for fever over 101°F, spreading redness, swelling, or trouble breathing' },
    ],
  },

  government: {
    whatThisMeans:
      'Your food assistance (SNAP) benefits will stop unless you renew your application before the deadline. You need to gather income and household documents and submit the renewal on time to avoid a gap in benefits.',
    whatYouNeedToDo: [
      'Gather proof of income for everyone in your household.',
      'Collect rent/mortgage statements and recent utility bills.',
      'Have a government-issued ID ready.',
      'Submit your renewal online or in person before April 15, 2026.',
    ],
    importantDates: [
      { label: 'Application deadline', date: 'April 15, 2026' },
      { label: 'Benefits expire if not renewed', date: 'April 30, 2026' },
    ],
    urgencyLevel: 'High',
    checklist: [
      'List all household members and their income',
      'Find recent pay stubs or benefit letters',
      'Locate rent/mortgage and utility bills',
      'Start the application at benefits.gov/renew',
      'Call the helpline if you need help filling it out',
    ],
    whoToContact: [
      { name: 'SNAP helpline', detail: '1-800-555-0199 — help completing your application' },
      { name: 'Local assistance office', detail: 'In-person application and document drop-off' },
      { name: 'benefits.gov/renew', detail: 'Online renewal portal' },
    ],
  },

  weather: {
    whatThisMeans:
      'A tornado warning is active in your area right now. You need to get to a safe indoor shelter immediately — an interior room on the lowest floor, away from windows. Some roads are closed due to flooding.',
    whatYouNeedToDo: [
      'Move to shelter immediately — lowest floor, interior room, no windows.',
      'Stay sheltered until the warning expires at 8:45 PM.',
      'Use Lincoln Community Center or Riverside High gym if you need a public shelter.',
      'Avoid driving on Highway 9 and Main Street.',
    ],
    importantDates: [
      { label: 'Warning expires', date: 'Tonight at 8:45 PM' },
      { label: 'Shelters open', date: 'Lincoln Community Center — 24 hours' },
    ],
    urgencyLevel: 'High',
    checklist: [
      'Get to an interior room on the lowest floor now',
      'Bring phone, water, and medications if safe to grab quickly',
      'Stay away from windows and exterior walls',
      'Do not drive through flooded roads',
      'Call 911 only for life-threatening emergencies',
    ],
    whoToContact: [
      { name: '911', detail: 'Life-threatening emergencies only' },
      { name: 'County storm hotline', detail: '555-0300 — non-emergency updates' },
      { name: 'Lincoln Community Center', detail: 'Open 24-hour public shelter' },
    ],
  },

  general: {
    whatThisMeans:
      'This notice contains important instructions that affect your schedule, responsibilities, or benefits. The key points are broken down below so you can see what matters most and what to do next.',
    whatYouNeedToDo: [
      'Read each section of the original notice carefully.',
      'Note any deadlines or dates mentioned.',
      'Gather any documents or items you are asked to provide.',
      'Contact the listed phone number or office if anything is unclear.',
    ],
    importantDates: [
      { label: 'Check the notice', date: 'Look for dates, deadlines, and appointment times' },
    ],
    urgencyLevel: 'Medium',
    checklist: [
      'Highlight all dates in the original notice',
      'List any documents you need to gather',
      'Save contact phone numbers',
      'Set reminders for upcoming deadlines',
      'Ask a trusted person to review if anything is confusing',
    ],
    whoToContact: [
      { name: 'Organization that sent the notice', detail: 'Use the phone number or email on the letter' },
      { name: 'A trusted advocate', detail: 'Friend, family member, or community helper who can assist' },
    ],
  },
}

const CLARITY_VARIANTS = {
  'very-simple': {
    school: {
      whatThisMeans: 'School is closed tomorrow. Stay home. Do the homework packet.',
      whatYouNeedToDo: ['Stay home.', 'Do the learning packet.', 'Email the teacher if you need help.'],
    },
    hospital: {
      whatThisMeans: 'You are going home from the hospital. Take your medicine on time. Change your bandage every day.',
      whatYouNeedToDo: ['Take medicine every 8 hours.', 'Change bandage daily.', 'Call the doctor for a follow-up visit.'],
    },
    government: {
      whatThisMeans: 'Your food help ends soon. Send in your renewal form before the deadline.',
      whatYouNeedToDo: ['Get your pay stubs and bills.', 'Fill out the renewal form.', 'Turn it in before April 15.'],
    },
    weather: {
      whatThisMeans: 'Bad storm right now. Go inside to a safe room. Stay away from windows.',
      whatYouNeedToDo: ['Go to the lowest floor.', 'Use an inside room.', 'Stay there until 8:45 PM.'],
    },
    general: {
      whatThisMeans: 'This letter has important steps. Read the list below.',
      whatYouNeedToDo: ['Find the dates.', 'Get any papers you need.', 'Call if you have questions.'],
    },
  },
  'parent-friendly': {
    school: {
      whatThisMeans:
        'Heads up, parents: school is closed tomorrow due to weather. Your child should stay home, work on the packet sent home, and you can email teachers during school hours if they need help.',
      whatYouNeedToDo: [
        'Plan to keep your child home tomorrow.',
        'Set aside time for the emergency learning packet.',
        'Arrange backup childcare if you work.',
        'Check email tonight for any updates.',
      ],
    },
    hospital: {
      whatThisMeans:
        'Your family member is coming home from the hospital today. There is a medication schedule, daily wound care, and a follow-up appointment to book. Know the warning signs that mean a return to the ER.',
      whatYouNeedToDo: [
        'Pick up the prescription and set medication reminders.',
        'Help with daily dressing changes.',
        'Schedule the follow-up within 5 business days.',
        'Post ER warning signs where everyone can see them.',
      ],
    },
    government: {
      whatThisMeans:
        'Your household SNAP benefits need to be renewed soon. Missing the deadline could mean a gap in food assistance for your family.',
      whatYouNeedToDo: [
        'Gather income proof for every adult in the home.',
        'Collect rent and utility bills.',
        'Complete the renewal before April 15.',
        'Call the helpline if the form is confusing.',
      ],
    },
    weather: {
      whatThisMeans:
        'A tornado warning is active — your family needs to move to shelter now. Keep kids away from windows and have a plan if you need to leave home for a community shelter.',
      whatYouNeedToDo: [
        'Move everyone to the lowest interior room.',
        'Grab phones, water, and any needed medications quickly.',
        'Stay put until the warning ends at 8:45 PM.',
        'Avoid flooded roads if you must travel to a shelter.',
      ],
    },
    general: {
      whatThisMeans:
        'This notice affects your family schedule or benefits. The breakdown below highlights what you need to know and do.',
      whatYouNeedToDo: [
        'Mark important dates on the family calendar.',
        'Gather any documents the notice asks for.',
        'Call the listed number if anything is unclear.',
      ],
    },
  },
  'student-friendly': {
    school: {
      whatThisMeans:
        'No school tomorrow because of bad weather. You still have work to do — check the emergency packet your teacher sent home.',
      whatYouNeedToDo: [
        'Enjoy the day off, but do your packet work.',
        'Email your teacher between 9 AM and 3 PM if you are stuck.',
        'Check the school site for reopening news.',
      ],
    },
    hospital: {
      whatThisMeans:
        'You are heading home from the hospital. Take your meds on schedule, keep your wound clean, and book a follow-up. Some symptoms mean go back to the ER.',
      whatYouNeedToDo: [
        'Set phone alarms for your medicine.',
        'Change your bandage every day.',
        'Call to schedule your follow-up appointment.',
      ],
    },
    government: {
      whatThisMeans:
        'Your household needs to renew food assistance paperwork before the deadline or benefits could pause.',
      whatYouNeedToDo: [
        'Help gather income docs if your family asks.',
        'Remind an adult about the April 15 deadline.',
        'Offer to help look up info online.',
      ],
    },
    weather: {
      whatThisMeans:
        'Tornado warning — this is serious. Get to a safe indoor spot on the lowest floor and stay off the roads.',
      whatYouNeedToDo: [
        'Go to an interior room away from windows.',
        'Stay sheltered until 8:45 PM.',
        'Only call 911 for real emergencies.',
      ],
    },
    general: {
      whatThisMeans: 'This notice has stuff you need to know. Here is the short version.',
      whatYouNeedToDo: [
        'Find any dates or deadlines.',
        'Ask a parent or trusted adult if you are unsure.',
      ],
    },
  },
  'senior-friendly': {
    school: {
      whatThisMeans:
        'If you care for a grandchild, please note their school is closed tomorrow due to weather. They should remain home and complete the learning materials provided.',
      whatYouNeedToDo: [
        'Keep the child home on the closure date.',
        'Help them with the emergency learning packet if needed.',
        'Contact the school or teacher with any questions.',
      ],
    },
    hospital: {
      whatThisMeans:
        'You are being discharged today. Please follow your medication schedule carefully, attend to daily wound care, and schedule your follow-up appointment within five business days.',
      whatYouNeedToDo: [
        'Take Amoxicillin exactly as prescribed — every 8 hours for 7 days.',
        'Change wound dressing daily; keep the area dry.',
        'Telephone Dr. Patel\'s office at 555-0142 to arrange your follow-up.',
        'Seek emergency care for fever, swelling, or breathing difficulty.',
      ],
    },
    government: {
      whatThisMeans:
        'Your SNAP food benefits require renewal. Please submit your application and supporting documents before the deadline to avoid interruption of assistance.',
      whatYouNeedToDo: [
        'Collect proof of income and household documents.',
        'Submit renewal by April 15, 2026.',
        'Telephone 1-800-555-0199 for assistance with the application.',
      ],
    },
    weather: {
      whatThisMeans:
        'A tornado warning is in effect. Please move immediately to an interior room on the lowest level of your home, away from windows. Public shelters are available if needed.',
      whatYouNeedToDo: [
        'Go to your safe room or lowest interior space now.',
        'Remain sheltered until 8:45 PM.',
        'Consider Lincoln Community Center if you need a public shelter.',
        'Telephone 911 only for life-threatening situations.',
      ],
    },
    general: {
      whatThisMeans:
        'This notice contains instructions that may affect your schedule or services. The summary below presents the key information in plain language.',
      whatYouNeedToDo: [
        'Review all dates and deadlines carefully.',
        'Gather requested documents at your convenience.',
        'Telephone the contact number listed if you need clarification.',
      ],
    },
  },
}

const URGENCY_META = {
  High: { emoji: '🔴', hint: 'Act on this soon — deadlines or safety risks are involved.', bars: 3 },
  Medium: { emoji: '🟡', hint: 'Important, but you have some time to plan your next steps.', bars: 2 },
  Low: { emoji: '🟢', hint: 'No immediate action required — review when convenient.', bars: 1 },
}

function loadStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function detectResponseType(text) {
  const lower = text.toLowerCase()
  if (lower.includes('school')) return 'school'
  if (lower.includes('hospital') || lower.includes('medicine')) return 'hospital'
  if (
    lower.includes('government') ||
    lower.includes('assistance') ||
    lower.includes('benefit') ||
    lower.includes('application')
  ) {
    return 'government'
  }
  if (
    lower.includes('weather') ||
    lower.includes('tornado') ||
    lower.includes('storm warning') ||
    lower.includes('take shelter')
  ) {
    return 'weather'
  }
  return 'general'
}

function detectRiskFlags(text) {
  const lower = text.toLowerCase()
  return RISK_FLAGS.filter((flag) => lower.includes(flag.keyword))
}

function applyClarityMode(response, type, mode) {
  const variants = CLARITY_VARIANTS[mode]?.[type]
  if (!variants) return response
  return { ...response, ...variants }
}

function ensureArray(value) {
  if (Array.isArray(value)) return value.filter((item) => item != null && item !== '')
  if (value == null || value === '') return []
  return [value]
}

function emptyAnalysis() {
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

function normalizeAnalysis(data) {
  if (!data || typeof data !== 'object') return emptyAnalysis()

  const whatThisMeans = ensureArray(data.whatThisMeans)
  if (!whatThisMeans.length && data.whatThisMeans != null && data.whatThisMeans !== '') {
    whatThisMeans.push(String(data.whatThisMeans))
  }

  let whatYouNeedToDo = ensureArray(data.whatYouNeedToDo)
  if (!whatYouNeedToDo.length) {
    whatYouNeedToDo = ensureArray(data.nextSteps ?? data.newActions)
  }

  let importantDates = normalizeImportantDates(data.importantDates)
  if (!importantDates.length && Array.isArray(data.importantUpdates)) {
    importantDates = normalizeImportantDates(data.importantUpdates)
  }

  let whoToContact = normalizeWhoToContact(data.whoToContact)

  let response = data.response ? String(data.response).trim() : ''
  if (!response && data.summary) response = String(data.summary).trim()
  if (!response && data.message) response = String(data.message).trim()
  if (!response && Array.isArray(data.answer) && data.answer.length) {
    response = data.answer.join(' ')
  }
  if (!response && whatThisMeans.length) {
    response = whatThisMeans.join(' ')
  }

  return {
    response,
    whatThisMeans,
    whatYouNeedToDo,
    importantDates,
    urgencyLevel: ['High', 'Medium', 'Low'].includes(data.urgencyLevel)
      ? data.urgencyLevel
      : 'Medium',
    riskFlags: normalizeRiskFlags(data.riskFlags),
    checklist: ensureArray(data.checklist),
    whoToContact,
  }
}

function mockToAnalysis(mock) {
  const whatThisMeans = ensureArray(mock.whatThisMeans)
  return normalizeAnalysis({
    response: whatThisMeans.join(' ') || 'Here is a simplified breakdown of your notice.',
    whatThisMeans,
    whatYouNeedToDo: mock.whatYouNeedToDo,
    importantDates: mock.importantDates,
    urgencyLevel: mock.urgencyLevel || 'Medium',
    riskFlags:
      mock.urgencyLevel === 'High'
        ? [{ label: 'High urgency', emoji: '🔴' }]
        : mock.urgencyLevel === 'Medium'
          ? [{ label: 'Moderate urgency', emoji: '🟡' }]
          : [],
    checklist: mock.checklist,
    whoToContact: mock.whoToContact,
  })
}

function hasAnalysisContent(analysis) {
  const a = normalizeAnalysis(analysis)
  return Boolean(
    a.response?.trim() ||
      a.whatThisMeans.length ||
      a.whatYouNeedToDo.length ||
      a.importantDates.length ||
      a.riskFlags.length ||
      a.checklist.length ||
      a.whoToContact.length
  )
}

function summarizeAnalysis(analysis) {
  const a = normalizeAnalysis(analysis)
  const parts = [
    a.response ? `Response: ${a.response}` : '',
    a.whatThisMeans.length ? `What this means: ${a.whatThisMeans.join(' ')}` : '',
    a.whatYouNeedToDo.length ? `What you need to do: ${a.whatYouNeedToDo.join('; ')}` : '',
    a.importantDates.length
      ? `Important dates: ${a.importantDates.map((d) => `${d.label} (${d.date})`).join('; ')}`
      : '',
    a.urgencyLevel ? `Urgency: ${a.urgencyLevel}` : '',
    a.riskFlags.length ? `Risk flags: ${a.riskFlags.map((f) => f.label).join('; ')}` : '',
    a.checklist.length ? `Checklist: ${a.checklist.join('; ')}` : '',
    a.whoToContact.length
      ? `Who to contact: ${a.whoToContact.map((c) => `${c.name} (${c.detail})`).join('; ')}`
      : '',
  ]
  return parts.filter(Boolean).join('\n')
}

function analysisToChatText(analysis) {
  const a = normalizeAnalysis(analysis)
  return a.response?.trim() || summarizeAnalysis(a)
}

function migrateMessage(msg) {
  if (msg.role === 'user') return msg
  if (msg.type === 'text' && msg.content != null) return msg
  if (msg.type === 'analysis' && msg.analysis) return msg
  if (msg.type === 'breakdown' && msg.breakdown) {
    return { ...msg, type: 'analysis', analysis: normalizeAnalysis(msg.breakdown) }
  }
  if (msg.type === 'structured' && msg.followUp) {
    return {
      id: msg.id,
      role: 'assistant',
      type: 'text',
      content: analysisToChatText(msg.followUp),
      createdAt: msg.createdAt,
    }
  }
  if (msg.role === 'assistant' && msg.content) {
    return { ...msg, type: 'text', content: String(msg.content) }
  }
  return msg
}

function migrateThreadMessages(messages) {
  let hasInitialAnalysis = false

  return messages.map((msg) => {
    const migrated = migrateMessage(msg)

    if (migrated.role === 'assistant' && migrated.type === 'analysis' && migrated.analysis) {
      if (!hasInitialAnalysis) {
        hasInitialAnalysis = true
        return migrated
      }
      return {
        ...migrated,
        type: 'text',
        content: analysisToChatText(migrated.analysis),
        analysis: undefined,
      }
    }

    return migrated
  })
}

function shortenMeaning(text) {
  return String(text).match(/^[^.!?]+[.!?]/)?.[0] || String(text)
}

function applyClarityPreference(response, preference) {
  const normalized = normalizeAnalysis(response)
  if (preference === 'detailed') return normalized

  if (preference === 'simple') {
    return {
      ...normalized,
      whatThisMeans: normalized.whatThisMeans.slice(0, 2).map(shortenMeaning),
      whatYouNeedToDo: normalized.whatYouNeedToDo.slice(0, 3),
      checklist: normalized.checklist.slice(0, 4),
      whoToContact: normalized.whoToContact.slice(0, 2),
    }
  }

  return normalized
}

function normalizeRiskFlags(flags) {
  if (!Array.isArray(flags)) return []
  return flags.map((flag) => {
    if (typeof flag === 'string') {
      return { keyword: flag.toLowerCase(), label: flag, emoji: '⚠️' }
    }
    return {
      keyword: (flag.keyword || flag.label || 'flag').toLowerCase(),
      label: flag.label || flag.keyword || 'Flag',
      emoji: flag.emoji || '⚠️',
    }
  })
}

function normalizeApiResponse(data) {
  return normalizeAnalysis(data)
}

function applyMockFallback(noticeText) {
  const type = detectResponseType(noticeText)
  return { type, result: MOCK_RESPONSES[type] }
}

function makeNoticeTitle(text, responseType) {
  const firstLine = text.split('\n').find((line) => line.trim())?.trim()
  if (firstLine && firstLine.length <= 48) return firstLine
  if (firstLine) return `${firstLine.slice(0, 45)}…`
  const labels = {
    school: 'School Notice',
    hospital: 'Hospital Discharge',
    government: 'Government Assistance',
    weather: 'Weather Alert',
    general: 'Saved Notice',
  }
  return labels[responseType] || 'Saved Notice'
}

function messagesForApi(threadMessages) {
  return migrateThreadMessages(threadMessages)
    .filter((msg) => {
      if (msg.role === 'user') return Boolean(msg.content?.trim())
      if (msg.type === 'analysis') return hasAnalysisContent(msg.analysis)
      return Boolean(msg.content?.trim())
    })
    .map((msg) => {
      if (msg.role === 'user') {
        if (msg.type === 'notice') {
          return { role: 'user', content: `[Original notice pasted]\n${msg.content.trim()}` }
        }
        return { role: 'user', content: msg.content.trim() }
      }
      if (msg.type === 'analysis' && msg.analysis) {
        return { role: 'assistant', content: summarizeAnalysis(msg.analysis) }
      }
      return { role: 'assistant', content: msg.content.trim() }
    })
}

function migrateNoticeToThread(notice) {
  const analysis = normalizeAnalysis(notice.simplified || {})
  const messages = Array.isArray(notice.messages) ? migrateThreadMessages(notice.messages) : []

  if (messages.length > 0) {
    return {
      ...notice,
      updatedAt: notice.updatedAt || notice.savedAt,
      simplified: analysis,
      messages,
    }
  }

  const savedAt = notice.savedAt || new Date().toISOString()
  return {
    ...notice,
    updatedAt: savedAt,
    simplified: analysis,
    messages: [
      {
        id: createId(),
        role: 'user',
        type: 'notice',
        content: notice.originalNotice || '',
        createdAt: savedAt,
      },
      {
        id: createId(),
        role: 'assistant',
        type: 'analysis',
        analysis,
        createdAt: savedAt,
      },
    ],
  }
}

function createThreadFromAnalysis({
  noticeText,
  analysis,
  clarityMode,
  responseType,
}) {
  const id = createId()
  const now = new Date().toISOString()
  const normalized = normalizeAnalysis(analysis)

  return {
    id,
    title: normalized.response?.slice(0, 48) || makeNoticeTitle(noticeText, responseType),
    savedAt: now,
    updatedAt: now,
    originalNotice: noticeText,
    clarityMode,
    responseType,
    simplified: normalized,
    messages: [
      {
        id: createId(),
        role: 'user',
        type: 'notice',
        content: noticeText,
        createdAt: now,
      },
      {
        id: createId(),
        role: 'assistant',
        type: 'analysis',
        analysis: normalized,
        createdAt: now,
      },
    ],
  }
}

function getLatestAnalysis(thread) {
  if (!thread?.messages) return thread?.simplified ? normalizeAnalysis(thread.simplified) : null
  for (let i = thread.messages.length - 1; i >= 0; i -= 1) {
    const msg = migrateMessage(thread.messages[i])
    if (msg.role === 'assistant' && msg.type === 'analysis' && msg.analysis) {
      return normalizeAnalysis(msg.analysis)
    }
  }
  return thread.simplified ? normalizeAnalysis(thread.simplified) : null
}

function OutputCard({ icon, title, children, className = '', accent = 'blue' }) {
  return (
    <article className={`output-card card card-accent-${accent} ${className}`}>
      <header className="card-header">
        <span className="card-icon" aria-hidden="true">{icon}</span>
        <h3 className="card-title">{title}</h3>
      </header>
      <div className="card-content">{children}</div>
    </article>
  )
}

function SettingsScreen({ settings, onChange }) {
  function update(key, value) {
    onChange({ ...settings, [key]: value })
  }

  return (
    <div className="screen settings-screen">
      <header className="screen-header">
        <h1>Settings</h1>
        <p>Customize how CrisisClear looks and explains notices.</p>
      </header>

      <div className="settings-list">
        <section className="settings-group card">
          <h2 className="settings-group-title">Appearance</h2>

          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-label">Theme</span>
              <span className="settings-hint">Switch between light and dark mode.</span>
            </div>
            <div className="theme-toggle" role="group" aria-label="Theme">
              <button
                type="button"
                className={`theme-toggle-btn ${settings.theme === 'light' ? 'active' : ''}`}
                onClick={() => update('theme', 'light')}
              >
                ☀️ Light
              </button>
              <button
                type="button"
                className={`theme-toggle-btn ${settings.theme === 'dark' ? 'active' : ''}`}
                onClick={() => update('theme', 'dark')}
              >
                🌙 Dark
              </button>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <label className="settings-label" htmlFor="font-size-select">Font size</label>
              <span className="settings-hint">Adjust text size across the app.</span>
            </div>
            <select
              id="font-size-select"
              className="settings-select"
              value={settings.fontSize}
              onChange={(e) => update('fontSize', e.target.value)}
            >
              {FONT_SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="settings-group card">
          <h2 className="settings-group-title">Clarity</h2>

          <div className="settings-row settings-row-stack">
            <div className="settings-row-info">
              <span className="settings-label">Clarity preference</span>
              <span className="settings-hint">How simplified notices are presented.</span>
            </div>
            <div className="clarity-pref-options">
              {CLARITY_PREFERENCE_OPTIONS.map((opt) => (
                <label key={opt.value} className={`clarity-pref-option ${settings.clarityPreference === opt.value ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="clarity-preference"
                    value={opt.value}
                    checked={settings.clarityPreference === opt.value}
                    onChange={() => update('clarityPreference', opt.value)}
                  />
                  <span className="clarity-pref-label">{opt.label}</span>
                  <span className="clarity-pref-desc">{opt.description}</span>
                </label>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function CrisisClearAnalysis({ result, clarityPreference, riskFlags, copied, onCopyChecklist, onAddChecklist }) {
  const resolved = applyClarityPreference(result, clarityPreference)
  const flags = resolved.riskFlags.length ? resolved.riskFlags : riskFlags
  const urgencyMeta = URGENCY_META[resolved.urgencyLevel] || URGENCY_META.Medium

  return (
    <div className="crisisclear-analysis">
      <div className="results-grid">
        {resolved.response && (
          <OutputCard
            icon={CARD_META.response.icon}
            title={CARD_META.response.title}
            className="card-wide"
            accent="blue"
          >
            <p className="card-body response-text">{resolved.response}</p>
          </OutputCard>
        )}

        {resolved.whatThisMeans.length > 0 && (
          <OutputCard icon={CARD_META.meaning.icon} title={CARD_META.meaning.title}>
            <ul className="card-list">
              {resolved.whatThisMeans.map((item, index) => (
                <li key={`meaning-${index}`}>{item}</li>
              ))}
            </ul>
          </OutputCard>
        )}

        {resolved.whatYouNeedToDo.length > 0 && (
          <OutputCard icon={CARD_META.actions.icon} title={CARD_META.actions.title} accent="green">
            <ul className="card-list">
              {resolved.whatYouNeedToDo.map((item, index) => (
                <li key={`action-${index}`}>{item}</li>
              ))}
            </ul>
          </OutputCard>
        )}

        {resolved.importantDates.length > 0 && (
          <OutputCard icon={CARD_META.dates.icon} title={CARD_META.dates.title} accent="purple">
            <ul className="date-list">
              {resolved.importantDates.map((item, index) => (
                <li key={`date-${index}-${item.label}`}>
                  <span className="date-icon" aria-hidden="true">📌</span>
                  <div className="date-text">
                    <span className="date-label">{item.label}</span>
                    <span className="date-value">{item.date}</span>
                  </div>
                </li>
              ))}
            </ul>
          </OutputCard>
        )}

        {resolved.urgencyLevel && (
          <OutputCard
            icon={CARD_META.urgency.icon}
            title={CARD_META.urgency.title}
            accent={
              resolved.urgencyLevel === 'High'
                ? 'red'
                : resolved.urgencyLevel === 'Medium'
                  ? 'amber'
                  : 'green'
            }
            className={`urgency-card urgency-card-${resolved.urgencyLevel.toLowerCase()}`}
          >
            <div className="urgency-display">
              <span className="urgency-emoji" aria-hidden="true">{urgencyMeta.emoji}</span>
              <span className={`urgency-badge urgency-${resolved.urgencyLevel.toLowerCase()}`}>
                {resolved.urgencyLevel} urgency
              </span>
            </div>
            <div className="urgency-meter" aria-hidden="true">
              {[1, 2, 3].map((bar) => (
                <span
                  key={bar}
                  className={`urgency-bar ${bar <= urgencyMeta.bars ? 'active' : ''} urgency-bar-${resolved.urgencyLevel.toLowerCase()}`}
                />
              ))}
            </div>
            <p className="urgency-hint">{urgencyMeta.hint}</p>
          </OutputCard>
        )}

        {flags.length > 0 && (
          <div className="risk-flags card card-wide">
            <header className="risk-flags-header">
              <span className="risk-flags-icon" aria-hidden="true">🚩</span>
              <h3 className="risk-flags-title">Risk Flags</h3>
              <span className="risk-flags-count">{flags.length} detected</span>
            </header>
            <div className="risk-badges">
              {flags.map((flag, index) => (
                <span key={flag.keyword || `flag-${index}`} className="risk-badge">
                  <span aria-hidden="true">{flag.emoji}</span> {flag.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {resolved.checklist.length > 0 && (
          <OutputCard
            icon={CARD_META.checklist.icon}
            title={CARD_META.checklist.title}
            className="card-wide"
            accent="teal"
          >
            <ul className="checklist">
              {resolved.checklist.map((item, index) => (
                <li key={`check-${index}`}>
                  <span className="check-box" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {(onCopyChecklist || onAddChecklist) && (
              <div className="chat-breakdown-actions">
                {onAddChecklist && (
                  <button type="button" className="action-btn action-btn-secondary" onClick={() => onAddChecklist()}>
                    ☑️ Add checklist to My Checklist
                  </button>
                )}
                {onCopyChecklist && (
                  <button
                    type="button"
                    className="action-btn action-btn-secondary"
                    onClick={() => onCopyChecklist(resolved.checklist)}
                  >
                    {copied ? '✓ Copied!' : '📋 Copy Checklist'}
                  </button>
                )}
              </div>
            )}
          </OutputCard>
        )}

        {resolved.whoToContact.length > 0 && (
          <OutputCard
            icon={CARD_META.contact.icon}
            title={CARD_META.contact.title}
            className="card-wide"
            accent="indigo"
          >
            <ul className="contact-list">
              {resolved.whoToContact.map((contact, index) => (
                <li key={`contact-${index}-${contact.name}`}>
                  <span className="contact-icon" aria-hidden="true">👤</span>
                  <div className="contact-text">
                    <strong>{contact.name}</strong>
                    <span>{contact.detail}</span>
                  </div>
                </li>
              ))}
            </ul>
          </OutputCard>
        )}
      </div>
    </div>
  )
}

function ChatMessage({
  message,
  clarityPreference,
  riskFlags,
  copied,
  onCopyChecklist,
  onAddChecklist,
}) {
  if (message.role === 'user') {
    return (
      <div className="chat-message chat-message-user">
        <div className="chat-message-meta">You</div>
        <div className="chat-bubble chat-bubble-user">
          {message.type === 'notice' ? (
            <>
              <span className="chat-notice-label">Original notice</span>
              <pre className="chat-notice-text">{message.content}</pre>
            </>
          ) : (
            <p>{message.content}</p>
          )}
        </div>
      </div>
    )
  }

  if (message.type === 'analysis' && message.analysis) {
    const analysis = normalizeAnalysis(message.analysis)
    const display = applyClarityPreference(analysis, clarityPreference)

    return (
      <div className="chat-message chat-message-assistant">
        <div className="chat-message-meta">CrisisClear</div>
        <div className="chat-bubble chat-bubble-assistant chat-bubble-breakdown">
          <CrisisClearAnalysis
            result={analysis}
            clarityPreference={clarityPreference}
            riskFlags={riskFlags}
            copied={copied}
            onCopyChecklist={onCopyChecklist}
            onAddChecklist={
              display.checklist.length ? () => onAddChecklist(display.checklist) : null
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="chat-message chat-message-assistant">
      <div className="chat-message-meta">CrisisClear</div>
      <div className="chat-bubble chat-bubble-assistant">
        <p className="chat-text-content">{message.content}</p>
      </div>
    </div>
  )
}

function ChatThread({
  thread,
  clarityPreference,
  isProcessing,
  chatError,
  copied,
  onDelete,
  onSendMessage,
  onAddChecklist,
  onCopyChecklist,
  onDismissError,
}) {
  const [chatInput, setChatInput] = useState('')
  const messagesEndRef = useRef(null)
  const riskFlags = detectRiskFlags(thread.originalNotice)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread.messages, isProcessing])

  function handleSubmit(e) {
    e.preventDefault()
    if (!chatInput.trim() || isProcessing) return
    onSendMessage(chatInput.trim())
    setChatInput('')
  }

  return (
    <div className="screen thread-screen">
      <header className="screen-header screen-header-row">
        <div>
          <h1>{thread.title}</h1>
          <p>
            Case opened {new Date(thread.savedAt).toLocaleDateString()}
            {thread.updatedAt !== thread.savedAt &&
              ` · Updated ${new Date(thread.updatedAt).toLocaleDateString()}`}
          </p>
        </div>
        <button type="button" className="delete-notice-btn" onClick={() => onDelete(thread.id)}>
          Delete case
        </button>
      </header>

      <div className="chat-thread card">
        <div className="chat-messages" aria-live="polite">
          {thread.messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              clarityPreference={clarityPreference}
              riskFlags={riskFlags}
              copied={copied}
              onCopyChecklist={onCopyChecklist}
              onAddChecklist={onAddChecklist}
            />
          ))}

          {isProcessing && (
            <div className="chat-message chat-message-assistant">
              <div className="chat-message-meta">CrisisClear</div>
              <div className="chat-bubble chat-bubble-assistant chat-bubble-thinking">
                <div className="loading-spinner chat-spinner" />
                <span>Thinking…</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {chatError && (
          <div className="api-error chat-error" role="alert">
            <span className="api-error-icon" aria-hidden="true">⚠️</span>
            <p className="api-error-text">{chatError}</p>
            <button type="button" className="api-error-dismiss" onClick={onDismissError}>
              Dismiss
            </button>
          </div>
        )}

        <form className="chat-composer" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor={`chat-input-${thread.id}`}>
            Continue the conversation
          </label>
          <textarea
            id={`chat-input-${thread.id}`}
            className="chat-input"
            placeholder="Ask a follow-up question about this notice…"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            rows={2}
            disabled={isProcessing}
          />
          <button type="submit" className="chat-send-btn" disabled={!chatInput.trim() || isProcessing}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

function App() {
  const [activeView, setActiveView] = useState('main')
  const [noticeText, setNoticeText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [clarityMode, setClarityMode] = useState('very-simple')
  const [copied, setCopied] = useState(false)
  const [checklistItems, setChecklistItems] = useState(() =>
    loadStorage(STORAGE_KEYS.checklist, [])
  )
  const [savedNotices, setSavedNotices] = useState(() =>
    loadStorage(STORAGE_KEYS.savedNotices, []).map(migrateNoticeToThread)
  )
  const [settings, setSettings] = useState(() => {
    const loaded = loadStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS)
    if (loaded.clarityPreference === 'step-by-step') {
      return { ...loaded, clarityPreference: 'detailed' }
    }
    return loaded
  })
  const [toast, setToast] = useState('')
  const [startError, setStartError] = useState(null)
  const [chatError, setChatError] = useState(null)

  const activeSavedNotice = savedNotices.find((n) => n.id === activeView)
  const pendingCount = checklistItems.filter((item) => !item.done).length

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.checklist, JSON.stringify(checklistItems))
  }, [checklistItems])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.savedNotices, JSON.stringify(savedNotices))
  }, [savedNotices])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings))
  }, [settings])

  function navigateTo(view) {
    setActiveView(view)
    setChatError(null)
    setCopied(false)
  }

  function showToast(message) {
    setToast(message)
    setTimeout(() => setToast(''), 2500)
  }

  function updateThread(threadId, updater) {
    setSavedNotices((prev) =>
      prev.map((thread) => {
        if (thread.id !== threadId) return thread
        const updated = updater(thread)
        return { ...updated, updatedAt: new Date().toISOString() }
      })
    )
  }

  async function handleSimplify() {
    if (!noticeText.trim()) return

    setIsProcessing(true)
    setCopied(false)
    setStartError(null)

    let analysis
    let responseType = 'general'
    let usedApi = true

    try {
      const simplifyPayload = {
        noticeText: noticeText.trim(),
        clarityPreference: settings.clarityPreference,
      }
      console.log('[CrisisClear] initial request payload:', simplifyPayload)

      const response = await fetch('http://localhost:3001/api/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simplifyPayload),
      })

      const data = await response.json().catch(() => ({}))
      console.log('[CrisisClear] initial response:', response.status, data)

      if (!response.ok) {
        throw new Error(data.details || data.error || `API request failed (${response.status})`)
      }

      analysis = normalizeApiResponse(data)
    } catch {
      const fallback = applyMockFallback(noticeText)
      analysis = mockToAnalysis(
        applyClarityMode(fallback.result, fallback.type, clarityMode)
      )
      responseType = fallback.type
      usedApi = false
      setStartError(
        'We could not reach the AI service right now. Showing an offline sample breakdown — you can still save this case and try again later.'
      )
    }

    const thread = createThreadFromAnalysis({
      noticeText: noticeText.trim(),
      analysis,
      clarityMode,
      responseType,
    })

    setSavedNotices((prev) => [thread, ...prev])
    setNoticeText('')
    navigateTo(thread.id)
    if (usedApi) setStartError(null)
    showToast(usedApi ? 'Case created — continue the conversation below' : 'Offline case created')
    setIsProcessing(false)
  }

  async function handleSendMessage(threadId, userMessage) {
    const thread = savedNotices.find((n) => n.id === threadId)
    if (!thread) return

    const trimmedMessage = userMessage.trim()
    const userMsg = {
      id: createId(),
      role: 'user',
      type: 'text',
      content: trimmedMessage,
      createdAt: new Date().toISOString(),
    }

    const threadWithUserMessage = {
      ...thread,
      messages: [...thread.messages, userMsg],
    }

    updateThread(threadId, () => threadWithUserMessage)

    setIsProcessing(true)
    setChatError(null)
    setCopied(false)

    const chatPayload = {
      originalNotice: thread.originalNotice,
      conversationMessages: messagesForApi(thread.messages),
      userMessage: trimmedMessage,
      clarityPreference: settings.clarityPreference,
    }

    console.log('[CrisisClear] follow-up request payload:', chatPayload)

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatPayload),
      })

      const data = await response.json().catch(() => ({}))
      console.log('[CrisisClear] follow-up response:', response.status, data)

      if (!response.ok) {
        throw new Error(data.details || data.error || `API request failed (${response.status})`)
      }

      const reply =
        typeof data.message === 'string'
          ? data.message
          : typeof data.response === 'string'
            ? data.response
            : ''

      if (!reply.trim()) {
        throw new Error('AI response was empty')
      }

      const assistantMsg = {
        id: createId(),
        role: 'assistant',
        type: 'text',
        content: reply.trim(),
        createdAt: new Date().toISOString(),
      }

      updateThread(threadId, (current) => ({
        ...current,
        messages: [...current.messages, assistantMsg],
      }))
    } catch (error) {
      console.error('[CrisisClear] follow-up error:', error)
      const details = error instanceof Error ? error.message : 'Unknown error'
      setChatError(
        details.includes('Route not found') || details.includes('404')
          ? 'Chat endpoint not found. Restart the API server with: npm run server'
          : `Could not reach the AI service: ${details}`
      )
    } finally {
      setIsProcessing(false)
    }
  }

  function loadSample(key) {
    setNoticeText(SAMPLE_NOTICES[key])
    setStartError(null)
    navigateTo('main')
  }

  async function copyChecklist(items) {
    const text = items.map((item, i) => `${i + 1}. ${item}`).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  function addChecklistFromThread(thread, items) {
    const checklist =
      items ??
      (() => {
        const analysis = getLatestAnalysis(thread)
        if (!analysis) return []
        return applyClarityPreference(analysis, settings.clarityPreference).checklist
      })()

    if (!checklist.length) return

    const newItems = checklist.map((text) => ({
      id: createId(),
      text,
      sourceNoticeTitle: thread.title,
      done: false,
    }))

    setChecklistItems((prev) => [...prev, ...newItems])
    showToast(`Added ${newItems.length} items to My Checklist`)
  }

  function toggleChecklistItem(id) {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    )
  }

  function deleteChecklistItem(id) {
    setChecklistItems((prev) => prev.filter((item) => item.id !== id))
  }

  function deleteSavedNotice(id) {
    setSavedNotices((prev) => prev.filter((n) => n.id !== id))
    if (activeView === id) navigateTo('main')
  }

  return (
    <div
      className="workspace"
      data-theme={settings.theme}
      data-font-size={settings.fontSize}
    >
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-logo" aria-hidden="true">🛡️</span>
          <div>
            <div className="sidebar-title">CrisisClear</div>
            <div className="sidebar-tagline">Action workspace</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={`sidebar-link ${activeView === 'main' ? 'active' : ''}`}
            onClick={() => navigateTo('main')}
          >
            <span className="sidebar-link-icon" aria-hidden="true">🏠</span>
            Main
          </button>
          <button
            type="button"
            className={`sidebar-link ${activeView === 'checklist' ? 'active' : ''}`}
            onClick={() => navigateTo('checklist')}
          >
            <span className="sidebar-link-icon" aria-hidden="true">☑️</span>
            My Checklist
            {pendingCount > 0 && <span className="sidebar-badge">{pendingCount}</span>}
          </button>
          <button
            type="button"
            className={`sidebar-link ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => navigateTo('settings')}
          >
            <span className="sidebar-link-icon" aria-hidden="true">⚙️</span>
            Settings
          </button>
        </nav>

        <div className="sidebar-section">
          <h2 className="sidebar-section-title">Saved Cases</h2>
          {savedNotices.length === 0 ? (
            <p className="sidebar-empty">No saved cases yet</p>
          ) : (
            <ul className="saved-list">
              {savedNotices.map((notice) => (
                <li key={notice.id}>
                  <button
                    type="button"
                    className={`saved-link ${activeView === notice.id ? 'active' : ''}`}
                    onClick={() => navigateTo(notice.id)}
                  >
                    <span className="saved-link-icon" aria-hidden="true">📄</span>
                    <span className="saved-link-text">{notice.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <div className="content">
        {toast && <div className="toast">{toast}</div>}

        {activeView === 'main' && (
          <div className="screen main-screen">
            <header className="screen-header">
              <h1>Start a new case</h1>
              <p>Paste a notice to get a breakdown, then continue the conversation in one thread.</p>
            </header>

            <section className="input-section card">
              <label className="input-label" htmlFor="notice-input">
                Paste your notice, alert, or letter
              </label>
              <textarea
                id="notice-input"
                className="notice-input"
                placeholder="Paste a school closure notice, hospital discharge instructions, government letter, food assistance notice, or any confusing document here…"
                value={noticeText}
                onChange={(e) => setNoticeText(e.target.value)}
                rows={10}
              />

              <div className="sample-row">
                <span className="sample-label">Try a sample:</span>
                <div className="sample-buttons">
                  <button type="button" className="sample-btn" onClick={() => loadSample('school')}>
                    School closure notice
                  </button>
                  <button type="button" className="sample-btn" onClick={() => loadSample('hospital')}>
                    Hospital discharge instruction
                  </button>
                  <button type="button" className="sample-btn" onClick={() => loadSample('government')}>
                    Government assistance notice
                  </button>
                  <button type="button" className="sample-btn" onClick={() => loadSample('weather')}>
                    Emergency weather alert
                  </button>
                </div>
              </div>

              <div className="controls-row">
                <div className="clarity-control">
                  <label className="clarity-label" htmlFor="clarity-mode">
                    Clarity Mode
                  </label>
                  <select
                    id="clarity-mode"
                    className="clarity-select"
                    value={clarityMode}
                    onChange={(e) => setClarityMode(e.target.value)}
                  >
                    {CLARITY_MODES.map((mode) => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {startError && (
                <div className="api-error card" role="alert">
                  <span className="api-error-icon" aria-hidden="true">⚠️</span>
                  <p className="api-error-text">{startError}</p>
                  <button
                    type="button"
                    className="api-error-dismiss"
                    onClick={() => setStartError(null)}
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <button
                type="button"
                className="simplify-btn"
                onClick={handleSimplify}
                disabled={!noticeText.trim() || isProcessing}
              >
                {isProcessing ? 'Creating case…' : 'Start Case'}
              </button>
            </section>

            {isProcessing && (
              <div className="loading card">
                <div className="loading-spinner" />
                <p>Reading your notice and opening a new case…</p>
              </div>
            )}
          </div>
        )}

        {activeView === 'settings' && (
          <SettingsScreen settings={settings} onChange={setSettings} />
        )}

        {activeView === 'checklist' && (
          <div className="screen checklist-screen">
            <header className="screen-header">
              <h1>My Checklist</h1>
              <p>
                {checklistItems.length === 0
                  ? 'Add items from a simplified notice to track your next steps.'
                  : `${pendingCount} remaining · ${checklistItems.length} total`}
              </p>
            </header>

            {checklistItems.length === 0 ? (
              <div className="empty-state card">
                <span className="empty-icon" aria-hidden="true">☑️</span>
                <p>No checklist items yet.</p>
                <button type="button" className="action-btn action-btn-primary" onClick={() => navigateTo('main')}>
                  Go to Main
                </button>
              </div>
            ) : (
              <ul className="my-checklist">
                {checklistItems.map((item) => (
                  <li key={item.id} className={`my-checklist-item card ${item.done ? 'done' : ''}`}>
                    <label className="my-checklist-label">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => toggleChecklistItem(item.id)}
                      />
                      <span className="my-checklist-text">{item.text}</span>
                    </label>
                    <span className="my-checklist-source">{item.sourceNoticeTitle}</span>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => deleteChecklistItem(item.id)}
                      aria-label="Delete item"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeSavedNotice && (
          <ChatThread
            thread={activeSavedNotice}
            clarityPreference={settings.clarityPreference}
            isProcessing={isProcessing}
            chatError={chatError}
            copied={copied}
            onDelete={deleteSavedNotice}
            onSendMessage={(message) => handleSendMessage(activeSavedNotice.id, message)}
            onAddChecklist={(checklist) => addChecklistFromThread(activeSavedNotice, checklist)}
            onCopyChecklist={copyChecklist}
            onDismissError={() => setChatError(null)}
          />
        )}
      </div>
    </div>
  )
}

export default App
