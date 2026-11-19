import type { SupportedLanguage, Vocabulary } from '../types/vocabulary.js'
import type { QuestionMapResult, ReportMapResult } from '../types/map.js'
import { mapQuestionLexicon } from './lexicon-question.js'
import { mapReportLexicon } from './lexicon-report.js'

export type GlinerClientOptions = {
  baseUrl: string
  timeoutMs: number
}

function normalizeLoopback(baseUrl: string): string {
  const url = new URL(baseUrl)
  if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') {
    throw new Error('gliner base URL must be loopback')
  }
  return url.toString().replace(/\/$/, '')
}

export async function mapQuestion(
  text: string,
  lang: SupportedLanguage,
  options: GlinerClientOptions,
): Promise<QuestionMapResult> {
  const root = normalizeLoopback(options.baseUrl)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeoutMs)
  try {
    const res = await fetch(`${root}/map/question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang }),
      signal: controller.signal,
    })
    if (!res.ok) return mapQuestionLexicon(text, lang)
    return (await res.json()) as QuestionMapResult
  } catch {
    return mapQuestionLexicon(text, lang)
  } finally {
    clearTimeout(timer)
  }
}

export async function mapReport(
  text: string,
  lang: SupportedLanguage,
  vocab: Vocabulary,
  options: GlinerClientOptions,
): Promise<ReportMapResult> {
  const root = normalizeLoopback(options.baseUrl)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeoutMs)
  try {
    const res = await fetch(`${root}/map/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang, vocab }),
      signal: controller.signal,
    })
    if (!res.ok) return mapReportLexicon(text, lang, vocab)
    return (await res.json()) as ReportMapResult
  } catch {
    return mapReportLexicon(text, lang, vocab)
  } finally {
    clearTimeout(timer)
  }
}
