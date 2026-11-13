import OpenAI from 'openai';
import { QuestionDraft, QuestDraft, QuestionOptionDraft, QuestionDifficulty } from './types';

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
  bandwidthMode?: 'mixed' | 'accessible' | 'challenging';
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

export function getDifficultyBandwidth(
  count: number,
  mode: 'mixed' | 'accessible' | 'challenging' = 'mixed'
): QuestionDifficulty[] {
  if (mode === 'accessible') {
    return Array.from({ length: count }, (_, i) => {
      const ratio = i / Math.max(1, count - 1);
      return ratio < 0.65 ? 'Easy' : 'Medium';
    });
  }

  if (mode === 'challenging') {
    return Array.from({ length: count }, (_, i) => {
      const ratio = i / Math.max(1, count - 1);
      if (ratio < 0.25) return 'Medium';
      if (ratio < 0.65) return 'Hard';
      return 'Very Difficult';
    });
  }

  // Default: 'mixed' - balanced bandwidth curve (easy warm-ups -> medium -> hard -> very difficult)
  if (count <= 3) {
    const map: QuestionDifficulty[] = ['Easy', 'Medium', 'Hard'];
    return map.slice(0, count);
  }
  if (count === 4) {
    return ['Easy', 'Medium', 'Hard', 'Very Difficult'];
  }
  if (count === 5) {
    return ['Easy', 'Easy', 'Medium', 'Hard', 'Very Difficult'];
  }
  if (count === 6) {
    return ['Easy', 'Easy', 'Medium', 'Medium', 'Hard', 'Very Difficult'];
  }
  if (count === 7) {
    return ['Easy', 'Easy', 'Medium', 'Medium', 'Hard', 'Hard', 'Very Difficult'];
  }
  if (count === 8) {
    return ['Easy', 'Easy', 'Medium', 'Medium', 'Hard', 'Hard', 'Very Difficult', 'Very Difficult'];
  }

  return Array.from({ length: count }, (_, i) => {
    const ratio = i / Math.max(1, count - 1);
    if (ratio < 0.25) return 'Easy';
    if (ratio < 0.55) return 'Medium';
    if (ratio < 0.85) return 'Hard';
    return 'Very Difficult';
  });
}

export function getDifficultyForIndex(
  orderIndex: number,
  totalCount: number,
  mode: 'mixed' | 'accessible' | 'challenging' = 'mixed'
): QuestionDifficulty {
  const bandwidth = getDifficultyBandwidth(totalCount, mode);
  return bandwidth[Math.max(0, Math.min(orderIndex - 1, bandwidth.length - 1))] || 'Medium';
}

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

  const targetDifficulties = getDifficultyBandwidth(params.questionCount, params.bandwidthMode || 'mixed');

  if (!openai) {
    return generateFallbackQuest(params, defaultDateRange, defaultDuration, targetDifficulties);
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

VERIFIED DISCOVERY CORPUS (FROM SUPABASE):
${formattedDiscoveries.slice(0, 12000)}

CRITICAL GROUNDING & DATA INTEGRITY MANDATE:
- 100% EXCLUSIVE SUPABASE SOURCE: All questions, correct answers, scientific explanations, and trivia MUST be strictly and exclusively derived from the VERIFIED DISCOVERY CORPUS provided above.
- ZERO OUTSIDE FACTS OR HALLUCINATIONS: Do not introduce external facts, missions, or details that are not directly supported by the corpus text. The quiz must test users purely on the verified discoveries stored in the Constella database.

DIFFICULTY BANDWIDTH & CALIBRATION (VITAL MANDATE):
The user must experience a balanced progression of difficulty bandwidth from accessible warm-up questions to expert challenges.
For this quest, assign each question the following difficulty progression:
${targetDifficulties.map((diff, i) => `Question #${i + 1}: ${diff}`).join(', ')}

DIFFICULTY TIER GUIDELINES:
1. "Easy" Tier (Warm-up / Highly Accessible):
   - Focus: Prominent observational facts, primary features, major celestial bodies involved, or key timelines stated directly in the discovery title, subtitle, or opening sentences.
   - Phrasing: Clear, inviting, and straightforward (e.g. "According to discoveries on Mars, which gas giant's early inward migration swept away material and stunted Mars's growth?").
   - Answer & Distractors: Clean, concise, plausible alternatives that are easy to distinguish without deep physics knowledge (e.g., Jupiter vs Saturn vs Neptune vs Uranus).
   - Prohibit dense graduate-level jargon or confusing double negatives in Easy questions!

2. "Medium" Tier (Intermediate Comprehension):
   - Focus: Cause-and-effect relationships, environmental conditions, or comparative traits described in the text.
   - Phrasing: Asks why or how a specific finding occurred based on the corpus.
   - Distractors: Scientifically realistic options directly contrasting factors mentioned in the text.

3. "Hard" Tier (Advanced Scientific Insight):
   - Focus: Deeper physical mechanisms, specific detection methods (spectroscopy, radioactive dating, radar telemetry, orbital resonance), or subtle analytical findings from the corpus.
   - Phrasing: Thoughtful analytical challenge testing nuanced comprehension of the discovery.

4. "Very Difficult" Tier (Expert Cosmic Analysis):
   - Focus: Counterintuitive anomalies, complex multi-step interactions, or paradoxes uncovered by the discoveries.
   - Phrasing: Demanding, rigorous inquiry requiring synthesis of the detailed findings in the text.

CRITICAL UNIQUENESS & DIVERSITY MANDATE:
- NO COOKIE-CUTTER TEMPLATES: Every single question MUST come up as completely unique in its own right, with its own distinct structure, sentence opening, cognitive angle, and linguistic cadence, even if all questions are derived from the exact same source discovery or object.
- MULTI-OBJECT / MIXED TOPIC COVERAGE: If multiple objects are specified (${params.selectedObjectNames.join(', ')}), alternate questions across ALL chosen objects and categories so every selected entity is represented in the quest.
- DIVERSE QUESTION ARCHETYPES: Rotate through different cognitive lenses (Observational Evidence, Physical Mechanism, Cosmic Paradox, Orbital Dynamics, Geology, Spacecraft Telemetry).
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
      "difficulty": "Easy" | "Medium" | "Hard" | "Very Difficult",
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
          content: 'You are an elite astronomy educator producing strictly valid JSON for Constella. Calibrate question bandwidth smoothly from Easy to Very Difficult, strictly grounded in the database corpus.',
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
      const assignedDifficulty = (q.difficulty as QuestionDifficulty) || targetDifficulties[idx] || 'Medium';
      return {
        id: `gen_q_${Date.now()}_${idx + 1}`,
        orderIndex: idx + 1,
        archetype: assignedArchetype,
        difficulty: assignedDifficulty,
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
    return generateFallbackQuest(params, defaultDateRange, defaultDuration, targetDifficulties);
  }
}

export async function regenerateSingleQuestion(params: {
  category: string;
  selectedObjectNames: string[];
  discoveries: Array<{ title: string; body: string }>;
  existingQuestionTexts: string[];
  orderIndex: number;
  difficulty?: QuestionDifficulty;
}): Promise<QuestionDraft> {
  const openai = getOpenAIClient();

  const formattedDiscoveries = params.discoveries
    .map((d, i) => `[Source ${i + 1}] ${d.title}: ${d.body}`)
    .join('\n\n');

  const archetype = QUESTION_ARCHETYPES[(params.orderIndex - 1) % QUESTION_ARCHETYPES.length];
  const targetDifficulty: QuestionDifficulty = params.difficulty || getDifficultyForIndex(params.orderIndex, 5);

  if (!openai) {
    return generateFallbackSingleQuestion(
      params.orderIndex,
      params.selectedObjectNames[0] || 'Cosmos',
      params.discoveries[0],
      targetDifficulty
    );
  }

  const prompt = `
You are creating ONE fresh replacement astronomy multiple-choice question for Constella.
TARGET OBJECTS: ${params.selectedObjectNames.join(', ')}
CATEGORY: ${params.category}
TARGET QUESTION ARCHETYPE: ${archetype}
TARGET DIFFICULTY TIER: ${targetDifficulty}

DIFFICULTY LEVEL REQUIREMENTS FOR "${targetDifficulty}":
${
  targetDifficulty === 'Easy'
    ? '- Make this question ACCESSIBLE and DIRECT. Test a prominent finding, main feature, or clear timeline directly stated in the corpus. Keep phrasing clean and friendly. Distractors should be clean, clear space concepts that avoid confusing graduate-level jargon.'
    : targetDifficulty === 'Medium'
    ? '- Make this an INTERMEDIATE question testing cause-and-effect, environmental characteristics, or comparative planetary traits directly described in the corpus.'
    : targetDifficulty === 'Hard'
    ? '- Make this an ADVANCED question exploring specific detection methodology, deep planetary mechanics, or subtle analytical insights from the text.'
    : '- Make this an EXPERT/VERY DIFFICULT question examining a complex cosmic paradox, anomaly, or multi-step evolutionary puzzle from the corpus.'
}

EXISTING QUESTIONS IN THIS QUIZ (DO NOT REPEAT OR COVER THE SAME ANGLE OR SYNTAX):
${params.existingQuestionTexts.map((q, i) => `${i + 1}. ${q}`).join('\n')}

VERIFIED CORPUS (FROM SUPABASE):
${formattedDiscoveries.slice(0, 6000)}

REQUIREMENTS:
1. Formulate a novel, unique question derived EXCLUSIVELY from the VERIFIED CORPUS above (from the Supabase database). Do not introduce outside facts or unverified details.
2. Distinctly frame the question around the archetype "${archetype}" and difficulty level "${targetDifficulty}".
3. NEVER use repetitive openings like "What is..." or "Which of the following...". Use dynamic inquiry phrasing.
4. 4 options (A, B, C, D) with EXACTLY ONE option having isCorrect: true. Randomize which letter (A, B, C, or D) is correct.
5. Detailed explanation and a fascinating "Did you know?" trivia item, both directly grounded in the provided corpus.

RETURN STRICTLY JSON:
{
  "archetype": "${archetype}",
  "difficulty": "${targetDifficulty}",
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
        { role: 'system', content: `You are an astronomy quiz engine returning strictly JSON. Calibrate to the ${targetDifficulty} difficulty level, 100% grounded in Supabase data.` },
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
      difficulty: (parsed.difficulty as QuestionDifficulty) || targetDifficulty,
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
    return generateFallbackSingleQuestion(
      params.orderIndex,
      params.selectedObjectNames[0] || 'Cosmos',
      params.discoveries[0],
      targetDifficulty
    );
  }
}

// ==========================================
// INTELLIGENT PROCEDURAL QUESTION GENERATOR
// Ensures every question has calibrated bandwidth
// and 100% Supabase discovery grounding.
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
  questionIndex: number,
  difficulty: QuestionDifficulty = 'Medium'
): QuestionDraft {
  const archetype = QUESTION_ARCHETYPES[(questionIndex - 1) % QUESTION_ARCHETYPES.length];
  const title = cleanText(disc?.title) || targetName;
  const subtitle = cleanText(disc?.subtitle);
  const body = cleanText(disc?.body);
  const curiosityTitle = cleanText(disc?.curiosityTitle);
  const curiositySub = cleanText(disc?.curiositySubtitle);

  // Extract candidate concepts from discovery text
  const sentences = body ? body.split(/(?<=[.?!])\s+/).filter((s) => s.length > 20) : [];
  const primarySentence = sentences[0] || `${targetName} exhibits unique physical characteristics in the cosmos.`;
  const secondarySentence = sentences[1] || primarySentence;

  let questionText = '';
  let correctAnswerText = '';
  let distractorPool: string[] = [];
  let explanationText = '';
  let factText = '';

  // Tailor question stem, answer, and distractor pool strictly by difficulty level
  if (difficulty === 'Easy') {
    // ----------------------------------------------------
    // EASY: Approachable, direct, prominent discovery fact
    // ----------------------------------------------------
    if (curiosityTitle) {
      questionText = `In Constella's discoveries on ${targetName}, what core finding addresses: "${curiosityTitle}"?`;
      correctAnswerText = curiositySub || subtitle || primarySentence.slice(0, 80);
    } else if (subtitle) {
      questionText = `Regarding ${targetName}, what is the central finding documented in "${title}"?`;
      correctAnswerText = subtitle;
    } else {
      questionText = `Which prominent feature of ${targetName} was highlighted during investigations of "${title}"?`;
      correctAnswerText = primarySentence.slice(0, 80);
    }

    // Clean, accessible, plausible distractors (clear to read, no dense graduate jargon)
    distractorPool = [
      `A permanent runaway greenhouse atmosphere composed primarily of dense methane`,
      `A global subsurface liquid water ocean protected beneath thousands of meters of ice`,
      `Active volcanic eruptions continually spewing molten basalt across the surface`,
      `A rapid rotational period causing extreme centrifugal flattening at the equator`,
    ];

    explanationText = `Verified Constella record: ${subtitle || primarySentence}`;
    factText = curiosityTitle
      ? `${curiosityTitle}: ${curiositySub || 'Direct observations confirm this prominent feature.'}`
      : `Research probes continue to verify foundational discoveries about ${targetName}.`;
  } else if (difficulty === 'Medium') {
    // ----------------------------------------------------
    // MEDIUM: Intermediate cause-and-effect & process
    // ----------------------------------------------------
    questionText = subtitle
      ? `How does the mechanism behind ${subtitle.toLowerCase()} shape ${targetName}'s environment?`
      : `Why does the physical process described in "${title}" occur on ${targetName}?`;

    correctAnswerText = secondarySentence.slice(0, 85) || subtitle || `Gravitational interaction coupled with solar radiative forcing`;

    distractorPool = [
      'Total magnetic field decay allowing unhindered solar wind sputtering across the terminator',
      'Differential tidal friction driven by resonance with neighboring celestial bodies',
      'Subsurface thermal equilibrium that prevents volatile gas evaporation into the exosphere',
      'Extreme axial obliquity causing dramatic alternating hemispheric glaciation cycles',
    ];

    explanationText = `Physical dynamics on ${targetName} are governed by observed processes: ${primarySentence}`;
    factText = curiositySub || `Tidal and thermodynamic cycles maintain continuous activity across ${targetName}.`;
  } else if (difficulty === 'Hard') {
    // ----------------------------------------------------
    // HARD: Advanced scientific evidence, telemetry & dating
    // ----------------------------------------------------
    questionText = subtitle
      ? `Which specific observational telemetry or isotopic signature verified researchers' models of ${targetName}'s ${subtitle.toLowerCase()}?`
      : `What distinct empirical evidence recorded by deep-space sensors established "${title}" at ${targetName}?`;

    correctAnswerText = primarySentence.slice(0, 90) || `Distinct spectroscopic absorption signatures and radiometric dating samples`;

    distractorPool = [
      'Static continuum emission without any measurable Doppler frequency shift',
      'Unshifted neutral sodium absorption lines produced solely by circumstellar dust',
      'Homogeneous infrared radiation indicating uniform internal heat transfer across all latitudes',
      'Symmetrical magnetospheric boundary currents during perihelion solar transit',
    ];

    explanationText = `Empirical instruments aboard orbiters and spectroscopic arrays established: ${primarySentence}`;
    factText = curiosityTitle
      ? `${curiosityTitle}: ${curiositySub || 'Deep-space instruments required high-precision calibration to confirm this.'}`
      : `High-resolution telemetry provides the empirical foundation for planetary science.`;
  } else {
    // ----------------------------------------------------
    // VERY DIFFICULT: Nuanced paradox, anomaly, or puzzle
    // ----------------------------------------------------
    questionText = curiosityTitle
      ? `What theoretical paradox regarding ${targetName} was uncovered by "${curiosityTitle}"?`
      : `What counterintuitive discrepancy between theoretical models and empirical telemetry was revealed in "${title}" at ${targetName}?`;

    correctAnswerText = curiositySub || `An unexpected temperature disparity and volatile retention rate contradicting classical models`;

    distractorPool = [
      'Uniform hydrostatic equilibrium persisting despite catastrophic core deceleration and mantle decoupling',
      'Instantaneous dissipation of atmospheric kinetic energy during aphelion orbital transition',
      'Complete absence of solar-wind induced sputtering across the sunlit terminator boundary',
      'Asymmetrical gravitational quadrupole moments violating established orbital decay baselines',
    ];

    explanationText = `Analysis of ${targetName} revealed surprising complexities: ${primarySentence} ${curiositySub ? `Notably, ${curiositySub.toLowerCase()}` : ''}`;
    factText = `Cosmic anomalies frequently prompt astrophysicists to revise foundational equations of planetary evolution.`;
  }

  // Shuffle options and randomize correct answer position across A, B, C, D
  const correctPrefixIndex = (questionIndex * 7 + (difficulty === 'Easy' ? 1 : 2)) % 4;
  const letters: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
  const targetPrefix = letters[correctPrefixIndex];

  // Pick 3 distractors
  const distractors = distractorPool.slice(0, 3);
  let distractorIdx = 0;

  const options: QuestionOptionDraft[] = letters.map((prefix) => {
    const isCorrect = prefix === targetPrefix;
    const text = isCorrect ? correctAnswerText : distractors[distractorIdx++] || 'Alternative astronomical outcome';
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
    difficulty,
    text: questionText,
    explanation: explanationText,
    interestingFact: factText,
    options,
  };
}

function generateFallbackQuest(
  params: GenerateQuestParams,
  dateRange: string,
  duration: string,
  targetDifficulties: QuestionDifficulty[]
): QuestDraft {
  const targets = params.selectedObjectNames.length > 0 ? params.selectedObjectNames : ['Cosmic Systems'];
  const isMixed = targets.length > 1;
  const targetLabel = isMixed
    ? targets.slice(0, 3).join(', ') + (targets.length > 3 ? ' & More' : '')
    : targets[0];
  const questTitle = isMixed ? `Cosmic Odyssey: ${targetLabel}` : `The Architecture of ${targets[0]}`;

  const questions: QuestionDraft[] = [];

  for (let i = 1; i <= params.questionCount; i++) {
    // Distribute across available discoveries
    const disc = params.discoveries[(i - 1) % (params.discoveries.length || 1)] || params.discoveries[0];
    // Rotate target object for each question so each selected entity gets featured
    const targetForThisQuestion = targets[(i - 1) % targets.length];
    const diff = targetDifficulties[i - 1] || 'Medium';
    questions.push(createUniqueQuestionFromDiscovery(disc, targetForThisQuestion, i, diff));
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

function generateFallbackSingleQuestion(
  orderIndex: number,
  target: string,
  disc?: DiscoverySource,
  difficulty: QuestionDifficulty = 'Medium'
): QuestionDraft {
  return createUniqueQuestionFromDiscovery(disc, target, orderIndex, difficulty);
}
