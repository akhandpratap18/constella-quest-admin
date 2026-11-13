import OpenAI from 'openai';
import { QuestionDraft, QuestDraft, QuestionOptionDraft } from './types';

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

export const QUESTION_ARCHETYPES = [
  '🔭 Observational Evidence',
  '⚡ Physical Mechanism',
  '🧩 Cosmic Paradox',
  '🪐 Orbital & Planetary Dynamics',
  '🌋 Surface & Interior Geology',
  '🚀 Spacecraft Telemetry',
  '⏳ Deep Time & Evolution',
  '🧪 Atmospheric Chemistry',
];

export async function generateFullQuest(params: GenerateQuestParams): Promise<QuestDraft> {
  const openai = getOpenAIClient();

  const formattedDiscoveries = params.discoveries
    .map(
      (d, i) =>
        `[Discovery #${i + 1}] Title: ${d.title}\nSubtitle: ${d.subtitle || ''}\nFact/Body: ${d.body}\n${
          d.caption ? `Caption: ${d.caption}\n` : ''
        }${d.curiosityTitle ? `Curiosity: ${d.curiosityTitle} - ${d.curiositySubtitle || ''}\n` : ''}`
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
    // Intelligent anti-template procedural generator when API key is pending
    return generateFallbackQuest(params, defaultDateRange, defaultDuration);
  }

  const prompt = `
You are the lead astrophysicist and quiz architect for Constella, an elite space science iOS application.
Your task is to create a weekly astronomy Quest based STRICTLY on verified astronomical discoveries from the Constella database.

TARGET SCOPE:
- Category: ${params.category}
- Featured Celestial Objects: ${params.selectedObjectNames.join(', ')}
- Number of Questions: ${params.questionCount}
- Estimated Duration: ${params.durationMinutes} minutes
- Active Date Range: ${defaultDateRange}

VERIFIED DISCOVERY CORPUS:
${formattedDiscoveries.slice(0, 12000)}

CRITICAL GROUNDING & DATA INTEGRITY MANDATE:
- 100% EXCLUSIVE SUPABASE SOURCE: All questions, correct answers, scientific explanations, and trivia MUST be strictly and exclusively derived from the VERIFIED DISCOVERY CORPUS provided above.
- NO OUTSIDE FACTS OR HALLUCINATIONS: Do not introduce external facts, missions, or details that are not directly supported by the corpus text. The quiz must test users purely on the verified discoveries stored in the Constella database.

CRITICAL UNIQUENESS & DIVERSITY MANDATE:
- NO COOKIE-CUTTER TEMPLATES: Every single question MUST come up as completely unique in its own right, with its own distinct structure, sentence opening, cognitive angle, and linguistic cadence, even if all questions are derived from the exact same source discovery or object.
- MULTI-OBJECT / MIXED TOPIC COVERAGE: If multiple objects are specified (${params.selectedObjectNames.join(', ')}), alternate questions across ALL chosen objects and categories so every selected entity is represented in the quest.
- DIVERSE QUESTION ARCHETYPES: You must rotate through different cognitive lenses for each question:
  1. Observational Evidence & Instrumentation (e.g. "When spectrometers analyze the reflectance of [Object], what distinct signature...")
  2. Physical Mechanism & Cause-Effect (e.g. "Why does the interaction between [Process A] and [Process B] prevent...")
  3. Cosmic Anomaly & Paradox (e.g. "What counterintuitive behavior in [Object]'s thermal profile defied initial models?")
  4. Comparative Scale & Extremes (e.g. "How does the atmospheric surface density on [Object] compare against terrestrial baselines?")
  5. Planetary Evolution & Deep Time (e.g. "What isotopic ratios in [Object]'s crust reveal its ancient magnetic dynamo?")
  6. Spacecraft Telemetry & Exploration (e.g. "Which finding confirmed by radar sounding telemetry established that...")
- PROHIBITION: DO NOT begin multiple questions with "What is...", "Which of the following...", "What key...", or "According to...". Make every question read like a thoughtfully crafted challenge written by an astrophysicist.
- ANSWER RANDOMIZATION: Randomly place the correct answer across options A, B, C, and D. Do not default to A. Ensure distractors are scientifically realistic and target genuine misconceptions.

RETURN STRICTLY A JSON OBJECT matching this exact schema:
{
  "title": string,
  "description": string,
  "category": string,
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "questions": [
    {
      "archetype": string,
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
          content: 'You are an elite astronomy educator and quiz engineer producing strictly valid JSON for Constella. Every question must be uniquely framed without repetitive stems.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    const questions: QuestionDraft[] = (parsed.questions || []).map((q: any, idx: number) => {
      const assignedArchetype = q.archetype || QUESTION_ARCHETYPES[idx % QUESTION_ARCHETYPES.length];
      return {
        id: `gen_q_${Date.now()}_${idx + 1}`,
        orderIndex: idx + 1,
        archetype: assignedArchetype,
        text: q.text || `Question ${idx + 1}`,
        explanation: q.explanation || 'Scientific explanation based on observational data.',
        interestingFact: q.interestingFact || 'Astronomical research continues to reveal new details about our cosmos.',
        options: (q.options || []).map((opt: any, optIdx: number) => ({
          id: `gen_opt_${Date.now()}_${idx + 1}_${optIdx + 1}`,
          prefix: opt.prefix || (['A', 'B', 'C', 'D'][optIdx] as 'A' | 'B' | 'C' | 'D'),
          text: opt.text || `Option ${optIdx + 1}`,
          isCorrect: Boolean(opt.isCorrect),
        })),
      };
    });

    return {
      title: parsed.title || `Secrets of ${params.selectedObjectNames.join(' & ')}`,
      description: parsed.description || `Journey through space and test your knowledge of ${params.selectedObjectNames.join(', ')}.`,
      category: parsed.category || 'Planetary Science',
      difficulty: parsed.difficulty || 'Intermediate',
      weekNumber: 5,
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

  const archetype = QUESTION_ARCHETYPES[(params.orderIndex - 1) % QUESTION_ARCHETYPES.length];

  if (!openai) {
    return generateFallbackSingleQuestion(params.orderIndex, params.selectedObjectNames[0] || 'Cosmos', params.discoveries[0]);
  }

  const prompt = `
You are creating ONE fresh replacement astronomy multiple-choice question for Constella.
TARGET OBJECTS: ${params.selectedObjectNames.join(', ')}
CATEGORY: ${params.category}
TARGET QUESTION ARCHETYPE: ${archetype}

EXISTING QUESTIONS IN THIS QUIZ (DO NOT REPEAT OR COVER THE SAME ANGLE OR SYNTAX):
${params.existingQuestionTexts.map((q, i) => `${i + 1}. ${q}`).join('\n')}

VERIFIED CORPUS:
${formattedDiscoveries.slice(0, 6000)}

REQUIREMENTS:
1. Formulate a novel, unique question derived EXCLUSIVELY from the VERIFIED CORPUS above (from the Supabase database). Do not introduce outside facts or unverified details.
2. Distinctly frame the question around the archetype "${archetype}".
3. NEVER use repetitive openings like "What is..." or "Which of the following...". Use dynamic inquiry phrasing.
4. 4 options (A, B, C, D) with EXACTLY ONE option having isCorrect: true. Randomize which letter (A, B, C, or D) is correct.
5. Detailed explanation and a fascinating "Did you know?" trivia item, both directly grounded in the provided corpus.

RETURN STRICTLY JSON:
{
  "archetype": "${archetype}",
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
        { role: 'system', content: 'You are an astronomy quiz engine returning strictly JSON with zero templated phrasing.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.85,
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    return {
      id: `regen_q_${Date.now()}_${params.orderIndex}`,
      orderIndex: params.orderIndex,
      archetype: parsed.archetype || archetype,
      text: parsed.text || 'Newly refreshed astronomy question',
      explanation: parsed.explanation || 'Refreshed explanation based on verified research.',
      interestingFact: parsed.interestingFact || 'Cosmic exploration continues to reveal startling secrets.',
      options: (parsed.options || []).map((opt: any, optIdx: number) => ({
        id: `regen_opt_${Date.now()}_${optIdx + 1}`,
        prefix: opt.prefix || (['A', 'B', 'C', 'D'][optIdx] as 'A' | 'B' | 'C' | 'D'),
        text: opt.text || `Option ${optIdx + 1}`,
        isCorrect: Boolean(opt.isCorrect),
      })),
    };
  } catch (err) {
    console.error('Single question regeneration error:', err);
    return generateFallbackSingleQuestion(params.orderIndex, params.selectedObjectNames[0] || 'Cosmos', params.discoveries[0]);
  }
}

// ==========================================
// INTELLIGENT PROCEDURAL QUESTION GENERATOR
// Ensures every question is completely distinct
// even if drawn from the exact same discovery.
// ==========================================

interface DiscoverySource {
  title: string;
  subtitle?: string;
  body: string;
  caption?: string;
  curiosityTitle?: string;
  curiositySubtitle?: string;
}

function cleanText(str?: string): string {
  if (!str) return '';
  return str.replace(/[^\w\s.,;:–—'-]/gi, '').trim();
}

function createUniqueQuestionFromDiscovery(
  disc: DiscoverySource | undefined,
  targetName: string,
  questionIndex: number
): QuestionDraft {
  const archetype = QUESTION_ARCHETYPES[(questionIndex - 1) % QUESTION_ARCHETYPES.length];
  const title = cleanText(disc?.title) || targetName;
  const subtitle = cleanText(disc?.subtitle);
  const body = cleanText(disc?.body);
  const curiosityTitle = cleanText(disc?.curiosityTitle);
  const curiositySub = cleanText(disc?.curiositySubtitle);

  // Extract candidate concepts from discovery text
  const sentences = body ? body.split(/(?<=[.?!])\s+/).filter(s => s.length > 20) : [];
  const primarySentence = sentences[0] || `${targetName} exhibits unique physical characteristics in the solar system.`;
  const secondarySentence = sentences[1] || primarySentence;

  let questionText = '';
  let correctAnswerText = '';
  let distractorPool: string[] = [];
  let explanationText = '';
  let factText = '';

  // Tailor angle based on archetype index (1 to 7)
  const angleIndex = (questionIndex - 1) % 6;

  switch (angleIndex) {
    case 0:
      // Observational Spectroscopy & Evidence
      questionText = subtitle
        ? `When spectroscopic instruments examine ${targetName}'s ${subtitle.toLowerCase()}, which signature confirmed researchers' models?`
        : `What distinct observational signature revealed ${targetName}'s atmospheric and surface dynamics in "${title}"?`;
      correctAnswerText = subtitle || `Spectral absorption lines characteristic of ${title}`;
      distractorPool = [
        'Static continuum radiation without doppler frequency variance',
        'Pure Rayleigh scattering with zero infrared absorption bands',
        'Equatorial gravitational resonance devoid of volatile emission',
        'Unshifted sodium doublet lines caused by cold interstellar dust',
      ];
      explanationText = primarySentence;
      factText = curiosityTitle 
        ? `${curiosityTitle}: ${curiositySub || 'Deep-space observations confirm this phenomenon.'}`
        : `Modern spectrographic sensors can isolate trace atmospheric chemical signatures across millions of kilometers.`;
      break;

    case 1:
      // Physical & Mechanical Process
      questionText = `Why does the physical mechanism behind "${title}" occur on ${targetName}?`;
      correctAnswerText = secondarySentence.slice(0, 85) || `Thermodynamic convection coupled with gravitational tidal interaction`;
      distractorPool = [
        'Complete hydrostatic cessation preventing interior thermal transfer',
        'Centrifugal sublimation of the metallic core under zero magnetic flux',
        'Atmospheric crystallization triggered by solar neutrino pressure',
        'Subsurface cryogenic freezing without external radiative dissipation',
      ];
      explanationText = `Physical dynamics on ${targetName} are governed by ${subtitle ? subtitle.toLowerCase() : 'rotational and gravitational forces'}. ${primarySentence}`;
      factText = curiositySub || `Tidal stress and solar radiation balance drive continuous thermodynamic cycles across ${targetName}.`;
      break;

    case 2:
      // Cosmic Anomaly & Paradox
      questionText = curiosityTitle
        ? `What counterintuitive phenomenon regarding ${targetName} is highlighted by "${curiosityTitle}"?`
        : `What unexpected discrepancy between theoretical models and empirical data was uncovered at ${targetName}?`;
      correctAnswerText = curiositySub || subtitle || `An unexpected temperature inversion and volatile retention rate`;
      distractorPool = [
        'Uniform surface heating despite extreme axial tilt and orbital eccentricity',
        'A total absence of solar-wind induced sputtering across the terminator',
        'Symmetrical magnetospheric lobes that ignore interplanetary magnetic fields',
        'Instantaneous dissipation of atmospheric kinetic energy at perihelion',
      ];
      explanationText = curiositySub 
        ? `Astronomers observed that ${curiositySub.toLowerCase()}`
        : `Observations contradicted traditional thermodynamic assumptions, revealing complex environmental interactions.`;
      factText = `Planetary anomalies often force astrophysicists to revise fundamental planetary evolution equations.`;
      break;

    case 3:
      // Comparative Scale & Planetary Dynamics
      questionText = `How do the rotational and orbital dynamics of ${targetName} influence its environmental stability?`;
      correctAnswerText = `Differential orbital velocity and gravitational resonance stabilize atmospheric circulation`;
      distractorPool = [
        'Synchronous tidal locking that eliminates all seasonal atmospheric variance',
        'Chaotic axial flipping occurring every few thousand rotational periods',
        'Hyperbolic orbital decay caused by Poynting-Robertson solar drag',
        'Complete magnetospheric collapse during aphelion transit',
      ];
      explanationText = `The scale and orbital configuration of ${targetName} create distinct observational patterns confirmed by deep-space probes.`;
      factText = `Orbital resonance acts as a cosmic pacemaker, synchronizing atmospheric and tidal rhythms.`;
      break;

    case 4:
      // Surface & Geological Evolution
      questionText = `Which geological or surface formation mechanism actively reshapes the terrain of ${targetName}?`;
      correctAnswerText = subtitle || `Cryovolcanic deposition and tectonic extensional faulting`;
      distractorPool = [
        'Pure impact vaporization without any subsequent regolith settling',
        'Uniform lithospheric cooling preventing all mantle convection currents',
        'Basaltic lava plains formed exclusively by solar corona thermal pulses',
        'Sub-crustal cavitation caused by gravitational microlensing',
      ];
      explanationText = `Topographical and surface analyses of ${targetName} demonstrate active geological evolution over geological epochs.`;
      factText = curiosityTitle 
        ? `${curiosityTitle} continues to offer critical clues regarding early Solar System formation.`
        : `Geological weathering in near-vacuum environments produces distinct, sharp-edged landforms unlike Earth.`;
      break;

    case 5:
    default:
      // Exploration Telemetry & Direct Evidence
      questionText = `What key evidentiary finding did space probes record when surveying ${targetName} during investigations of "${title}"?`;
      correctAnswerText = primarySentence.slice(0, 90) || `High-resolution radar telemetry indicating dense subsurface stratification`;
      distractorPool = [
        'Absence of any ionospheric layer capable of reflecting radio waves',
        'Zero magnetic perturbation despite high concentrations of metallic iron',
        'Constant homogenous temperature across both lit and shadowed hemispheres',
        'Complete optical transparency in both infrared and ultraviolet spectra',
      ];
      explanationText = `Remote sensing instruments aboard interplanetary orbiters verified these distinct physical properties.`;
      factText = `Planetary probe instrumentation must withstand extreme radiation belts to capture these millimeter-precise measurements.`;
      break;
  }

  // Shuffle options and randomize correct answer position across A, B, C, D
  const correctPrefixIndex = (questionIndex * 7) % 4; // produces 3, 2, 1, 0, 3...
  const letters: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
  const targetPrefix = letters[correctPrefixIndex];

  // Pick 3 distractors
  const distractors = distractorPool.slice(0, 3);
  let distractorIdx = 0;

  const options: QuestionOptionDraft[] = letters.map((prefix) => {
    const isCorrect = prefix === targetPrefix;
    const text = isCorrect ? correctAnswerText : (distractors[distractorIdx++] || 'Alternative astrophysical outcome');
    return {
      id: `fb_opt_${questionIndex}_${prefix}`,
      prefix,
      text,
      isCorrect,
    };
  });

  return {
    id: `fb_q_${questionIndex}`,
    orderIndex: questionIndex,
    archetype,
    text: questionText,
    explanation: explanationText,
    interestingFact: factText,
    options,
  };
}

function generateFallbackQuest(
  params: GenerateQuestParams,
  dateRange: string,
  duration: string
): QuestDraft {
  const targets = params.selectedObjectNames.length > 0 ? params.selectedObjectNames : ['Cosmic Systems'];
  const isMixed = targets.length > 1;
  const targetLabel = isMixed
    ? targets.slice(0, 3).join(', ') + (targets.length > 3 ? ' & More' : '')
    : targets[0];
  const questTitle = isMixed
    ? `Cosmic Odyssey: ${targetLabel}`
    : `The Architecture of ${targets[0]}`;

  const questions: QuestionDraft[] = [];

  for (let i = 1; i <= params.questionCount; i++) {
    // Distribute across available discoveries, cycling if questionCount > discoveries.length
    const disc = params.discoveries[(i - 1) % (params.discoveries.length || 1)] || params.discoveries[0];
    // Rotate target object for each question so each selected entity gets featured
    const targetForThisQuestion = targets[(i - 1) % targets.length];
    questions.push(createUniqueQuestionFromDiscovery(disc, targetForThisQuestion, i));
  }

  return {
    title: questTitle,
    description: `Examine the astrophysical mechanisms, atmospheric signatures, and evolutionary history across ${targets.join(', ')}.`,
    category: params.category || (isMixed ? 'Mixed Celestial Exploration' : 'Planetary Science'),
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

function generateFallbackSingleQuestion(orderIndex: number, target: string, disc?: DiscoverySource): QuestionDraft {
  return createUniqueQuestionFromDiscovery(disc, target, orderIndex);
}

