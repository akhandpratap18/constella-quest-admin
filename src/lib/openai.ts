import OpenAI from 'openai';
import { QuestionDraft, QuestDraft } from './types';

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your-openai-api-key')) {
    return null;
  }
  return new OpenAI({ apiKey });
}

export interface GenerateQuestParams {
  category: string;
  selectedObjectNames: string[];
  discoveries: Array<{
    title: string;
    subtitle?: string;
    body: string;
    caption?: string;
    curiosityTitle?: string;
    curiositySubtitle?: string;
  }>;
  questionCount: number;
  durationMinutes: number;
  targetDate: string; // ISO or date string
}

export async function generateFullQuest(params: GenerateQuestParams): Promise<QuestDraft> {
  const openai = getOpenAIClient();

  const formattedDiscoveries = params.discoveries
    .map(
      (d, i) =>
        `[Discovery #${i + 1}] Title: ${d.title}\nSubtitle: ${d.subtitle || ''}\nFact/Body: ${d.body}\n${
          d.caption ? `Caption: ${d.caption}\n` : ''
        }${d.curiosityTitle ? `Curiosity: ${d.curiosityTitle} - ${d.curiositySubtitle}\n` : ''}`
    )
    .join('\n---\n');

  // Format date range (7 days starting from targetDate)
  const startDate = params.targetDate ? new Date(params.targetDate) : new Date();
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const defaultDateRange = `${startStr} – ${endStr}`;
  const defaultDuration = `~ ${params.durationMinutes} min`;

  if (!openai) {
    // Intelligent fallback when API key is pending
    return generateFallbackQuest(params, defaultDateRange, defaultDuration);
  }

  const prompt = `
You are the lead astrophysicist and master quiz author for Constella, an elite space science iOS application.
Your task is to create a weekly astronomy Quest based STRICTLY on verified astronomical discoveries from the Constella database.

TARGET SCOPE:
- Category: ${params.category}
- Featured Celestial Objects: ${params.selectedObjectNames.join(', ')}
- Number of Questions: ${params.questionCount}
- Estimated Duration: ${params.durationMinutes} minutes
- Active Date Range: ${defaultDateRange}

VERIFIED DISCOVERY CORPUS:
${formattedDiscoveries.slice(0, 12000)}

REQUIREMENTS:
1. Create a captivating Quest Title (e.g. "The Mystery of Mars", "Jupiter's Hidden Ocean").
2. Write a 1-2 sentence compelling description that inspires stargazers to explore.
3. Determine category (e.g. "Planetary Science", "Constellations", "Cosmology") and difficulty ("Beginner", "Intermediate", or "Advanced").
4. Formulate exactly ${params.questionCount} high quality multiple-choice questions grounded in the provided text.
5. Each question must have:
   - "text": Engaging, clear conceptual question.
   - "options": Exactly 4 options labeled prefix "A", "B", "C", "D". EXACTLY ONE option must have "isCorrect": true, the other three "isCorrect": false.
   - "explanation": 1-2 sentences explaining why the correct answer is scientifically true.
   - "interestingFact": An intriguing "Did you know?" fact related to the question.

RETURN STRICTLY A JSON OBJECT with this schema:
{
  "title": string,
  "description": string,
  "category": string,
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "questions": [
    {
      "text": string,
      "explanation": string,
      "interestingFact": string,
      "options": [
        { "prefix": "A", "text": string, "isCorrect": boolean },
        { "prefix": "B", "text": string, "isCorrect": boolean },
        { "prefix": "C", "text": string, "isCorrect": boolean },
        { "prefix": "D", "text": string, "isCorrect": boolean }
      ]
    }
  ]
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an astronomy educator producing strictly valid JSON for a space exploration quiz app.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    const questions: QuestionDraft[] = (parsed.questions || []).map((q: any, idx: number) => ({
      id: `gen_q_${Date.now()}_${idx + 1}`,
      orderIndex: idx + 1,
      text: q.text || `Question ${idx + 1}`,
      explanation: q.explanation || 'Scientific explanation based on observational data.',
      interestingFact: q.interestingFact || 'Astronomical research continues to reveal new details about our cosmos.',
      options: (q.options || []).map((opt: any, optIdx: number) => ({
        id: `gen_opt_${Date.now()}_${idx + 1}_${optIdx + 1}`,
        prefix: opt.prefix || ['A', 'B', 'C', 'D'][optIdx],
        text: opt.text || `Option ${optIdx + 1}`,
        isCorrect: Boolean(opt.isCorrect),
      })),
    }));

    return {
      title: parsed.title || `Secrets of ${params.selectedObjectNames.join(' & ')}`,
      description: parsed.description || `Journey through space and test your knowledge of ${params.selectedObjectNames.join(', ')}.`,
      category: parsed.category || 'Planetary Science',
      difficulty: parsed.difficulty || 'Intermediate',
      weekNumber: 5, // will be auto-calculated against DB
      durationString: defaultDuration,
      dateRangeString: defaultDateRange,
      imageUrl: '',
      status: 'Upcoming',
      selectedCategory: params.category,
      selectedObjectIds: params.selectedObjectNames,
      questions,
    };
  } catch (err) {
    console.error('OpenAI generation error:', err);
    return generateFallbackQuest(params, defaultDateRange, defaultDuration);
  }
}

export async function regenerateSingleQuestion(params: {
  category: string;
  selectedObjectNames: string[];
  discoveries: Array<{ title: string; body: string }>;
  existingQuestionTexts: string[];
  orderIndex: number;
}): Promise<QuestionDraft> {
  const openai = getOpenAIClient();

  const formattedDiscoveries = params.discoveries
    .map((d, i) => `[Source ${i + 1}] ${d.title}: ${d.body}`)
    .join('\n\n');

  if (!openai) {
    return generateFallbackSingleQuestion(params.orderIndex, params.selectedObjectNames[0] || 'Cosmos');
  }

  const prompt = `
You are creating ONE fresh replacement astronomy multiple-choice question for Constella.
TARGET OBJECTS: ${params.selectedObjectNames.join(', ')}
CATEGORY: ${params.category}

EXISTING QUESTIONS IN QUIZ (DO NOT REPEAT OR COVER THE SAME ANGLE):
${params.existingQuestionTexts.map((q, i) => `${i + 1}. ${q}`).join('\n')}

VERIFIED FACTS:
${formattedDiscoveries.slice(0, 6000)}

REQUIREMENTS:
1. Produce a novel question completely distinct from the existing ones.
2. 4 options (A, B, C, D) with EXACTLY ONE option having isCorrect: true.
3. Detailed explanation and a fun "Did you know?" fact.

RETURN STRICTLY JSON:
{
  "text": string,
  "explanation": string,
  "interestingFact": string,
  "options": [
    { "prefix": "A", "text": string, "isCorrect": boolean },
    { "prefix": "B", "text": string, "isCorrect": boolean },
    { "prefix": "C", "text": string, "isCorrect": boolean },
    { "prefix": "D", "text": string, "isCorrect": boolean }
  ]
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a space quiz engine returning strictly JSON.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.85,
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    return {
      id: `regen_q_${Date.now()}_${params.orderIndex}`,
      orderIndex: params.orderIndex,
      text: parsed.text || 'Newly refreshed astronomy question',
      explanation: parsed.explanation || 'Refreshed explanation.',
      interestingFact: parsed.interestingFact || 'Cosmic exploration offers endless wonder.',
      options: (parsed.options || []).map((opt: any, optIdx: number) => ({
        id: `regen_opt_${Date.now()}_${optIdx + 1}`,
        prefix: opt.prefix || ['A', 'B', 'C', 'D'][optIdx],
        text: opt.text || `Option ${optIdx + 1}`,
        isCorrect: Boolean(opt.isCorrect),
      })),
    };
  } catch (err) {
    console.error('Single question regeneration error:', err);
    return generateFallbackSingleQuestion(params.orderIndex, params.selectedObjectNames[0] || 'Cosmos');
  }
}

// Fallback generators in case OpenAI API Key is missing or rate limited
function generateFallbackQuest(
  params: GenerateQuestParams,
  dateRange: string,
  duration: string
): QuestDraft {
  const target = params.selectedObjectNames.join(' & ') || 'Cosmic Realms';
  const questions: QuestionDraft[] = [];

  for (let i = 1; i <= params.questionCount; i++) {
    const disc = params.discoveries[i - 1] || params.discoveries[0];
    questions.push({
      id: `fb_q_${i}`,
      orderIndex: i,
      text: disc
        ? `What key astrophysical process is highlighted in "${disc.title}" regarding ${target}?`
        : `Which prominent physical characteristic distinguishes ${target} in observational astronomy?`,
      explanation: disc
        ? disc.body.slice(0, 160) + '...'
        : `${target} exhibits distinct spectral and gravitational characteristics confirmed by deep-sky surveys.`,
      interestingFact: disc?.curiosityTitle
        ? `${disc.curiosityTitle}: ${disc.curiositySubtitle || ''}`
        : `Photometric and Doppler measurements provide millimeter-accurate insights into ${target}.`,
      options: [
        { id: `fb_opt_${i}_A`, prefix: 'A', text: disc?.subtitle || 'Orbital resonance and tidal acceleration', isCorrect: true },
        { id: `fb_opt_${i}_B`, prefix: 'B', text: 'Hydrostatic equilibrium without thermal expansion', isCorrect: false },
        { id: `fb_opt_${i}_C`, prefix: 'C', text: 'Sub-surface cryogenic crystallization', isCorrect: false },
        { id: `fb_opt_${i}_D`, prefix: 'D', text: 'Photospheric magnetic reconnection events', isCorrect: false },
      ],
    });
  }

  return {
    title: `The Odyssey of ${target}`,
    description: `Explore the hidden mechanisms, geological features, and cosmic history of ${target}.`,
    category: params.category === 'Planets' ? 'Planetary Science' : 'Astrophysics',
    difficulty: 'Intermediate',
    weekNumber: 5,
    durationString: duration,
    dateRangeString: dateRange,
    imageUrl: '',
    status: 'Upcoming',
    selectedCategory: params.category,
    selectedObjectIds: params.selectedObjectNames,
    questions,
  };
}

function generateFallbackSingleQuestion(orderIndex: number, target: string): QuestionDraft {
  return {
    id: `fb_regen_${Date.now()}_${orderIndex}`,
    orderIndex,
    text: `How do astronomers assess the atmospheric and gravitational profile of ${target}?`,
    explanation: `Transit photometry combined with high-resolution spectrographic radial velocity measurements allows precise atmospheric modeling.`,
    interestingFact: `Modern space observatories can detect trace atmospheric compounds across hundreds of light-years.`,
    options: [
      { id: `fbo_${orderIndex}_A`, prefix: 'A', text: 'Spectroscopic absorption signatures and Doppler shifting', isCorrect: true },
      { id: `fbo_${orderIndex}_B`, prefix: 'B', text: 'Static visible-light photographic magnification', isCorrect: false },
      { id: `fbo_${orderIndex}_C`, prefix: 'C', text: 'Low-frequency seismic wave reflections', isCorrect: false },
      { id: `fbo_${orderIndex}_D`, prefix: 'D', text: 'Direct physical core sample retrieval', isCorrect: false },
    ],
  };
}
