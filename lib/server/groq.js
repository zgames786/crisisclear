import 'server-only'
import Groq from 'groq-sdk'

let groqClient = null

export function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured')
  }

  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })
  }

  return groqClient
}

export const GROQ_MODEL = 'llama-3.3-70b-versatile'
