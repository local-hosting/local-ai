import type { QuestionLabel, QuestionMapResult } from '../types/map.js'
import type { SupportedLanguage } from '../types/vocabulary.js'

const PATTERNS: Record<QuestionLabel, RegExp[]> = {
  where_to_go: [
    /where can i go/i,
    /where is safe/i,
    /where to go/i,
    /où puis-je aller/i,
    /adónde puedo ir/i,
    /ou puis-je aller/i,
    /நான் எங்கே போகலாம்/,
    /எங்கே பாதுகாப்பானது/,
    /waar kan ik heen/i,
    /waar is het veilig/i,
    /मैं कहाँ जा सकता हूँ/,
    /मैं कहां जा सकता हूं/,
    /我能去哪里/,
    /我該去哪裡/,
    /我能去哪裡/,
    /dove posso andare/i,
    /onde posso ir/i,
    /לאן אני יכול ללכת/,
    /לאן אפשר ללכת/,
    /إلى أين يمكنني الذهاب/,
    /وين اروح/,
  ],
  what_to_do: [
    /what should i do/i,
    /que dois-je faire/i,
    /qué debo hacer/i,
    /நான் என்ன செய்ய வேண்டும்/,
    /wat moet ik doen/i,
    /मुझे क्या करना चाहिए/,
    /我该怎么办/,
    /我該怎麼辦/,
    /cosa dovrei fare/i,
    /o que devo fazer/i,
    /מה עליי לעשות/,
    /ماذا يجب أن أفعل/,
  ],
  how_long: [
    /how long/i,
    /combien de temps/i,
    /cuánto tiempo/i,
    /எவ்வளவு நேரம்/,
    /hoe lang/i,
    /कितना समय/,
    /多久/,
    /quanto tempo/i,
    /כמה זמן/,
    /كم من الوقت/,
  ],
  is_it_safe_for_kids: [
    /kids|children|school|enfants|escuela|niños/i,
    /குழந்தைகள்|பள்ளி/,
    /kinderen|school/i,
    /बच्चे|स्कूल/,
    /孩子|学校|學校/,
    /bambini|scuola/i,
    /crianças|escola/i,
    /ילדים|בית ספר/,
    /أطفال|مدرسة/,
  ],
  is_it_safe_outside: [
    /go out/i,
    /work outside/i,
    /dehors/i,
    /afuera/i,
    /sortir/i,
    /வெளியே/,
    /buiten/i,
    /बाहर/,
    /外面/,
    /fuori/i,
    /fora/i,
    /בחוץ/,
    /في الخارج/,
  ],
  other: [],
}

export function mapQuestionLexicon(
  text: string,
  _lang: SupportedLanguage,
): QuestionMapResult {
  const trimmed = text.trim()
  for (const label of Object.keys(PATTERNS) as QuestionLabel[]) {
    if (label === 'other') continue
    for (const re of PATTERNS[label]) {
      if (re.test(trimmed)) {
        return { label, confidence: 0.85 }
      }
    }
  }
  return { label: 'other', confidence: 0.4 }
}
