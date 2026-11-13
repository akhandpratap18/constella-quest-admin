import OpenAI from 'openai';
import { QuestionDraft, QuestDraft, QuestionOptionDraft, QuestionDifficulty, EnrichedDiscovery } from './types';

function getOpenAIClient(customApiKey?: string): OpenAI | null {
  const apiKey = customApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your-openai-api-key')) {
    return null;
  }
  return new OpenAI({
    apiKey: apiKey.trim(),
    fetch: typeof globalThis.fetch === 'function' ? globalThis.fetch : undefined,
  });
}

export interface GenerateQuestParams {
  category: string;
  selectedObjectNames: string[];
  discoveries: Array<EnrichedDiscovery>;
  questionCount: number;
  durationMinutes: number;
  targetDate: string; // ISO or date string
  bandwidthMode?: 'mixed' | 'accessible' | 'challenging';
  apiKey?: string;
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
  const openai = getOpenAIClient(params.apiKey);

  const formattedDiscoveries = params.discoveries
    .map(
      (d, i) =>
        `[Discovery #${i + 1} | Celestial Object: ${d.objectName || 'Cosmos'} | Topic: ${d.topicTitle || 'Astronomy'}]
Title: ${d.title}
Subtitle: ${d.subtitle || ''}
Fact/Body: ${d.body}
${d.caption ? `Caption: ${d.caption}\n` : ''}${
          d.curiosityTitle ? `Curiosity: ${d.curiosityTitle} - ${d.curiositySubtitle || ''}\n` : ''
        }`
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
${formattedDiscoveries.slice(0, 14000)}

CRITICAL GROUNDING & DATA INTEGRITY MANDATE:
- 100% EXCLUSIVE SUPABASE SOURCE: All questions, correct answers, scientific explanations, and trivia MUST be strictly and exclusively derived from the VERIFIED DISCOVERY CORPUS provided above.
- ZERO OUTSIDE FACTS OR HALLUCINATIONS: Do not introduce external facts, missions, or details that are not directly supported by the corpus text.

CRITICAL BRILLIANT WRITING & GENUINE QUIZ INQUIRY MANDATE:
- PROHIBITION OF FORMULAIC META-QUESTIONS: NEVER write questions like "Regarding [Object], what is the central finding documented in '[Title]'?" or "How does the mechanism behind [subtitle] shape [Object]'s environment?".
- AUTHENTIC, ENGAGING QUIZ CHALLENGES: Every question must read like a brilliant, publication-quality astronomy challenge written by an astrophysicist for a premium science application. Directly pose the astronomical puzzle, physical mechanism, measurement, or phenomenon.
- STRICT OBJECT-DISCOVERY COHESION: When asking about a discovery, ensure the question strictly addresses the celestial object and topic it belongs to (e.g. Earth discoveries must address Earth; Ursa Minor discoveries must address Ursa Minor). Never mix up concepts across different objects.
- SCIENTIFICALLY REALISTIC DISTRACTORS: Distractors must belong to the exact same astronomical domain as the correct answer (e.g., if the answer is a type of star, all distractors must be plausible types of stars; if the answer is a space telescope, distractors must be real space telescopes).

DIFFICULTY BANDWIDTH PROGRESSION:
For this quest, assign each question the following difficulty progression:
${targetDifficulties.map((diff, i) => `Question #${i + 1}: ${diff}`).join(', ')}

DIFFICULTY TIER GUIDELINES:
1. "Easy" Tier (Warm-up / Highly Accessible):
   - Focus: Prominent observational facts, primary features, major celestial bodies involved, or key timelines. Clear, inviting, and straightforward phrasing without dense graduate jargon.
2. "Medium" Tier (Intermediate Comprehension):
   - Focus: Cause-and-effect relationships, environmental conditions, or comparative traits described in the text.
3. "Hard" Tier (Advanced Scientific Insight):
   - Focus: Deeper physical mechanisms, specific detection methods (spectroscopy, radioactive dating, radar telemetry, orbital resonance), or subtle analytical findings from the corpus.
4. "Very Difficult" Tier (Expert Cosmic Analysis):
   - Focus: Counterintuitive anomalies, complex multi-step interactions, or paradoxes uncovered by the discoveries.

- ANSWER RANDOMIZATION: Randomly place the correct answer across options A, B, C, and D. Do not default to A.

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
          content: 'You are an elite astronomy educator and quiz engineer producing strictly valid JSON for Constella. Every question must be brilliantly written with authentic scientific curiosity, zero templated phrasing, and strictly grounded in the database corpus.',
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
  discoveries: Array<EnrichedDiscovery>;
  existingQuestionTexts: string[];
  orderIndex: number;
  difficulty?: QuestionDifficulty;
  apiKey?: string;
}): Promise<QuestionDraft> {
  const openai = getOpenAIClient(params.apiKey);

  const formattedDiscoveries = params.discoveries
    .map(
      (d, i) =>
        `[Source ${i + 1} | Object: ${d.objectName || 'Cosmos'} | Topic: ${d.topicTitle || 'Astronomy'}]
Title: ${d.title}
Subtitle: ${d.subtitle || ''}
Body: ${d.body}`
    )
    .join('\n\n');

  const archetype = QUESTION_ARCHETYPES[(params.orderIndex - 1) % QUESTION_ARCHETYPES.length];
  const targetDifficulty: QuestionDifficulty = params.difficulty || getDifficultyForIndex(params.orderIndex, 5);

  if (!openai) {
    // Pick the most relevant discovery
    const disc = params.discoveries[0];
    return createCuratedQuestionFromDiscovery(disc, params.orderIndex, targetDifficulty, new Set());
  }

  const prompt = `
You are creating ONE fresh replacement astronomy multiple-choice question for Constella.
TARGET OBJECTS: ${params.selectedObjectNames.join(', ')}
CATEGORY: ${params.category}
TARGET QUESTION ARCHETYPE: ${archetype}
TARGET DIFFICULTY TIER: ${targetDifficulty}

CRITICAL BRILLIANT WRITING & GENUINE QUIZ MANDATE:
- NO FORMULAIC META-QUESTIONS: Never write questions like "Regarding [Object], what is the central finding documented in '[Title]'?" or "How does the mechanism behind [subtitle] shape [Object]'s environment?".
- AUTHENTIC, ENGAGING QUIZ CHALLENGE: Pose a genuine astronomical question testing conceptual understanding, physical mechanisms, or real discovery evidence.
- CONTEXTUAL DISTRACTORS: Ensure distractors belong to the exact same astronomical domain as the correct answer and are scientifically realistic.
- STRICT 100% SUPABASE GROUNDING: Derived exclusively from the provided corpus below.

EXISTING QUESTIONS IN THIS QUIZ (DO NOT REPEAT OR COVER THE SAME ANGLE OR SYNTAX):
${params.existingQuestionTexts.map((q, i) => `${i + 1}. ${q}`).join('\n')}

VERIFIED CORPUS:
${formattedDiscoveries.slice(0, 8000)}

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
        {
          role: 'system',
          content: `You are an elite astronomy quiz engineer returning strictly JSON. Calibrate to ${targetDifficulty} with brilliant writing and zero templated phrasing.`,
        },
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
    const disc = params.discoveries[0];
    return createCuratedQuestionFromDiscovery(disc, params.orderIndex, targetDifficulty, new Set());
  }
}

// ============================================================================
// DOMAIN-SPECIFIC SCIENTIFIC DISTRACTOR POOLS
// Tailored to ensure every question has authentic, domain-appropriate options
// ============================================================================

const DISTRACTOR_POOLS = {
  galaxies: [
    'Relativistic plasma jets launched perpendicular to the central accretion disk',
    'A high-density ring of cold molecular hydrogen gas in the outer spiral arms',
    'Gravitational tidal resonance with orbiting satellite dwarf galaxies',
    'Massive frame-dragging of spacetime induced by a rotating Kerr black hole',
    'Dense dust lanes along the galactic plane obscuring visible light observations',
    'A spherical halo of globular clusters dating back to the primordial universe',
    'Shockwaves from core-collapse supernovae driving turbulent interstellar medium expansion',
    'Rapid orbital decay caused by dynamical friction with the dark matter halo',
  ],
  stellar: [
    'A young cluster of luminous blue O-type supergiants actively condensing out of gas nebulae',
    'A rapidly spinning magnetar with magnetic field strengths exceeding 100 gigatesla',
    'A binary white dwarf system undergoing mass transfer toward the Chandrasekhar limit',
    'An eclipsing spectroscopic binary exhibiting periodic Doppler radial velocity shifts',
    'A cocoon of reflective carbon dust illuminated by a newly ignited protostar',
    'A Population II red giant undergoing helium core flash at the tip of the giant branch',
    'A cold sub-stellar brown dwarf unable to sustain core hydrogen thermonuclear fusion',
    'An isolated millisecond pulsar emitting high-energy gamma-ray pulses',
  ],
  geology: [
    'A global subsurface liquid water ocean insulated beneath a convective ice shell',
    'A dormant iron-nickel core lacking convective circulation to sustain a dynamo',
    'A high-pressure supercritical fluid mantle composed of metallic hydrogen',
    'A runaway mantle plume feeding a network of active effusive basalt calderas',
    'Extensive tectonic grabens and strike-slip faults generated by tidal flexing',
    'A porous megaregolith layer saturated with fractured impact melt breccias',
    'A dense shell of crystalline silicate perovskite insulating the lower mantle',
  ],
  atmosphere: [
    'A runaway carbon dioxide greenhouse atmosphere maintaining surface pressures over 90 bars',
    'Photodissociation of atmospheric water vapor triggered by extreme solar ultraviolet flux',
    'Stratospheric haze layers composed of complex photochemical organic tholins',
    'Complete atmospheric freeze-out into seasonal nitrogen and carbon dioxide polar caps',
    'Supersonic equatorial jet streams exceeding 1,500 kilometers per hour',
    'Solar wind sputtering stripping away lighter unshielded atmospheric isotopes',
    'Persistent cyclonic storms driven by internal convective heat venting',
  ],
  missions: [
    'The James Webb Space Telescope Near-Infrared Spectrograph (NIRSpec)',
    'The Hubble Space Telescope Wide Field Camera 3 deep-field ultraviolet survey',
    'The Chandra X-ray Observatory High-Energy Transmission Grating array',
    'The European Space Agency Gaia astrometry space observatory',
    'The Atacama Large Millimeter/submillimeter Array (ALMA) radio interferometer',
    'The Kepler Space Telescope high-precision planetary transit photometer',
  ],
  time: [
    'Differential orbital precession induced by general relativistic perihelion advance',
    'Chaotic axial tilt variations oscillating by more than 40 degrees over million-year cycles',
    'Synchronous 1:1 tidal locking preventing any diurnal temperature variations',
    'Orbital decay caused by gravitational wave radiation over cosmological epochs',
    'A 3:2 spin-orbit resonance stabilizing extreme diurnal thermal fluctuations',
    'Secular orbital resonance with neighboring gas giants driving orbital eccentricity',
  ],
};

function cleanSentence(str?: string): string {
  if (!str) return '';
  return str.replace(/[.:;–—]+$/, '').trim();
}

// ============================================================================
// CURATED ASTRONOMY QUIZ KNOWLEDGE BASE
// Provides handcrafted, publication-grade questions for Constella's discoveries
// ============================================================================

interface CuratedQuestionBlueprint {
  question: string;
  correctAnswer: string;
  distractors: string[];
  explanation: string;
  trivia: string;
}

const BESPOKE_DISCOVERY_REGISTRY: Record<string, CuratedQuestionBlueprint> = {
  // Earth
  'the global census': {
    question: "When scientists conducted 'The Global Census' to measure the magnitude of life on Earth, what primary metric did they use to quantify the entire living biosphere?",
    correctAnswer: "Weighing the total carbon biomass of all living organisms in gigatons of carbon",
    distractors: [
      "Measuring the total dissolved nitrogen volume across the world's oceans",
      "Calculating total photosynthetic oxygen output across planetary rainforests",
      "Tracking global satellite chlorophyll fluorescence across all seasonal cycles",
    ],
    explanation: "To objectively compare vastly different life forms—from microscopic bacteria to redwood trees—scientists measured life by the dry weight of carbon stored in their living cells.",
    trivia: "Plants make up roughly 80% of all biomass on Earth, while animals account for less than 1%.",
  },

  // Mercury
  'the diamond boundary': {
    question: "What extraordinary geological structure was discovered deep inside Mercury at the boundary between its metallic core and silicate mantle?",
    correctAnswer: "A ten-mile-thick shell of solid diamond forged by intense primordial heat and carbon crystallization",
    distractors: [
      "A porous layer of crystalline olivine fractured by ancient volcanic calderas",
      "A supercritical ocean of liquid methane trapped beneath convective basalt",
      "A churning subterranean magma ocean composed of molten titanium",
    ],
    explanation: "Under extreme pressures and temperatures exceeding 2,000 Kelvin during Mercury's early differentiation, carbon precipitated out of the magma ocean to crystallize into diamond.",
    trivia: "Planetary scientists estimate Mercury's diamond shell could span up to 16 kilometers (10 miles) in thickness.",
  },

  // Andromeda
  'the island universe': {
    question: "How did Edwin Hubble's historic 1923 observations of Andromeda revolutionize human understanding of our place in the cosmos?",
    correctAnswer: "By proving that Andromeda was an independent 'island universe' located far beyond the Milky Way",
    distractors: [
      "By detecting the first interstellar gas bridge connecting Andromeda to the Triangulum Galaxy",
      "By measuring relativistic radio emissions confirming the presence of a supermassive black hole",
      "By proving that spiral nebulae are newly ignited planetary systems inside our own galaxy",
    ],
    explanation: "By measuring Cepheid variable stars in Andromeda, Hubble calculated its vast distance, conclusively proving it was an entirely separate galaxy millions of light-years away.",
    trivia: "Before Hubble's discovery, most astronomers believed our Milky Way encompassed the entirety of the physical universe.",
  },

  'the trillion-star behemoth': {
    question: "How does the total stellar population of the Andromeda Galaxy compare against our home galaxy, the Milky Way?",
    correctAnswer: "Andromeda contains an estimated 1 trillion stars, more than double the stellar census of the Milky Way",
    distractors: [
      "Andromeda contains roughly half the stellar count of the Milky Way, but occupies three times the volume",
      "Both galaxies contain identical star counts of approximately 250 billion stars",
      "Andromeda consists almost entirely of dark matter with fewer than 50 billion visible stars",
    ],
    explanation: "Spanning roughly 152,000 light-years in visible diameter, Andromeda is the largest behemoth of our Local Group, housing approximately one trillion stars.",
    trivia: "Despite having more stars, Andromeda and the Milky Way have nearly identical total gravitational masses due to dark matter.",
  },

  // The Milky Way
  'the ancient bulge': {
    question: "What distinctive stellar population crowds the 10,000-light-year spherical heart of the Milky Way, known as the galactic bulge?",
    correctAnswer: "A dense, ancient concentration of red giant stars formed over 10 billion years ago",
    distractors: [
      "A luminous ring of young blue O-type supergiants actively condensing out of gas nebulae",
      "A dispersed cluster of runaway hypervelocity stars escaping into the halo",
      "A hollow stellar cavity carved by relativistic magnetic jets from Sagittarius A*",
    ],
    explanation: "At the center of our galaxy lies the galactic bulge, crowded with ancient Population II red giants that formed in the earliest epochs of the cosmos.",
    trivia: "Stars in the galactic bulge orbit in complex three-dimensional peanut-shaped patterns driven by the central stellar bar.",
  },

  'the dark matter halo': {
    question: "What vast, unseen cosmic structure envelops the Milky Way and prevents its rapidly rotating outer spiral arms from flying apart?",
    correctAnswer: "A massive spherical halo of invisible dark matter acting as gravitational scaffolding",
    distractors: [
      "Relativistic magnetic flux tubes anchored to the central black hole accretion disk",
      "Dense rings of cold molecular hydrogen gas circulating along the Perseus Arm",
      "Gravitational frame-dragging generated by the rotating central stellar bar",
    ],
    explanation: "The visible stars in the Milky Way do not provide enough gravity to hold the rotating disk together; a vast spherical halo of dark matter accounts for about 90% of the galaxy's mass.",
    trivia: "If dark matter did not exist, the outer stars in our solar neighborhood would fly off into intergalactic space.",
  },

  'photographing the shadow': {
    question: "Which groundbreaking international scientific collaboration captured the historic first direct image of Sagittarius A*'s black hole shadow?",
    correctAnswer: "The Event Horizon Telescope (EHT) global network of synchronized radio observatories",
    distractors: [
      "The James Webb Space Telescope Near-Infrared Spectrograph (NIRSpec) team",
      "The Hubble Space Telescope Wide Field Camera 3 deep-sky survey",
      "The Chandra X-ray Observatory High-Energy Transmission Grating array",
    ],
    explanation: "In May 2022, the Event Horizon Telescope combined radio dishes around the globe into an Earth-sized virtual telescope to resolve the shadow of Sagittarius A*.",
    trivia: "To image Sagittarius A*, the telescope achieved an angular resolution equivalent to reading a newspaper on the Moon from Earth.",
  },

  'the andromeda collision': {
    question: "What dramatic cosmic transformation will occur when the Milky Way and the Andromeda Galaxy collide in roughly 4 to 5 billion years?",
    correctAnswer: "Their gas disks and stars will merge into a single, colossal super-galaxy often nicknamed 'Milkdromeda'",
    distractors: [
      "The supermassive black holes will violently repel each other, splitting both galaxies in half",
      "Andromeda's tidal forces will completely strip away the Milky Way's spiral arms without merging",
      "Both galaxies will slingshot past each other and escape into separate intergalactic voids",
    ],
    explanation: "Hurtling toward each other at roughly 110 kilometers per second, the Milky Way and Andromeda will perform a gravitational dance before coalescing into a giant elliptical galaxy.",
    trivia: "Because the distances between individual stars are so immense, virtually no stars are expected to physically collide during the merger.",
  },

  'a 13.6-billion-year journey': {
    question: "How did violent ancient collisions shape the structure of the Milky Way over its 13.6-billion-year evolutionary history?",
    correctAnswer: "By accreting smaller satellite dwarf galaxies and merging primordial gas clouds into a structured spiral disk",
    distractors: [
      "By completely boiling away the interstellar medium and halting all future star formation",
      "By reversing the rotation of the inner galactic bulge relative to the outer arms",
      "By ejecting the central supermassive black hole into the circumgalactic medium",
    ],
    explanation: "The Milky Way grew hierarchically through cosmic cannibalism, absorbing ancient dwarf galaxies like Gaia-Enceladus to build its thick disk and stellar halo.",
    trivia: "Some of the oldest stars in our galaxy formed just a few hundred million years after the Big Bang.",
  },

  // Mars
  'the starving embryo and jupiter’s dance': {
    question: "In early solar system history, how did the gravitational 'Grand Tack' migration of Jupiter permanently stunt the growth of Mars?",
    correctAnswer: "Jupiter migrated inward toward the Sun, sweeping away rocky planetesimals and starving Mars of building blocks",
    distractors: [
      "Jupiter's intense magnetic field stripped away Mars's primordial greenhouse atmosphere",
      "Jupiter gravitationally ejected Mars into the outer asteroid belt, disrupting its circular orbit",
      "Jupiter collided with Mars's primordial proto-moon, creating the Hellas impact basin",
    ],
    explanation: "Jupiter acted like a cosmic snowplow as it migrated inward toward the Sun, clearing the region of rocky material before Saturn pulled it back outward in the 'Grand Tack'.",
    trivia: "Because it was starved of material, Mars only grew to about 11% of Earth's mass.",
  },

  'the two-million-year sprint': {
    question: "Why do planetary scientists classify Mars as a pristine 'planetary embryo' frozen in time rather than a fully developed planet?",
    correctAnswer: "Radiometric dating reveals Mars grew to half its current size in only 1.8 million years before its accretion stopped",
    distractors: [
      "Mars formed exclusively from icy cometary debris that evaporated after the young Sun ignited",
      "Its metallic core never achieved sufficient density to melt into a global magma ocean",
      "Tidal resonance with Jupiter stripped away its silicate mantle before core differentiation occurred",
    ],
    explanation: "While Earth took tens of millions of years of collisions to form, Mars assembled in a cosmic flash of under 2 million years, locking in its primordial embryonic composition.",
    trivia: "Analyzing radioactive decay in Martian meteorites allowed scientists to pinpoint Mars's rapid assembly timeline.",
  },

  'the invisible shield': {
    question: "What dynamic internal process generated Mars's powerful primordial magnetic field during its first few hundred million years?",
    correctAnswer: "A molten core geodynamo driven by vigorous thermal convection before the planet rapidly cooled",
    distractors: [
      "Permanent remanent magnetism locked into the crust by solar wind bombardment",
      "Surface eddy currents induced by atmospheric carbon dioxide lightning storms",
      "Gravitational tidal flexing caused by the close primordial orbits of Phobos and Deimos",
    ],
    explanation: "In its youth, Mars possessed a churning molten iron core that powered a global magnetic shield, protecting its early atmosphere and liquid surface water.",
    trivia: "Once Mars's small core cooled and the geodynamo shut down, the solar wind gradually stripped away most of its atmosphere.",
  },

  // Ursa Minor
  'the shifting pole': {
    question: "Why will the star Polaris eventually lose its alignment as Earth's celestial North Star over a 26,000-year cycle?",
    correctAnswer: "Earth's rotational axis slowly wobbles in a circular motion known as axial precession",
    distractors: [
      "Polaris is rapidly drifting out of the Milky Way's galactic disk into intergalactic space",
      "Solar gravitational radiation is accelerating Earth's orbital period around the Sun",
      "The Sun's apex motion through the local interstellar cloud is reversing Earth's magnetic tilt",
    ],
    explanation: "Like a spinning top that wobbles as it slows, Earth's axis traces a circle in the sky every 25,772 years, causing the celestial pole to point toward different stars over human history.",
    trivia: "Around 12,000 BCE, the brilliant star Vega was Earth's North Star, and it will reclaim the title around 13,700 CE.",
  },

  'calvera the corpse': {
    question: "Hidden within the constellation Ursa Minor, what extreme celestial object is the isolated high-energy source known as 'Calvera'?",
    correctAnswer: "An isolated neutron star that emits thermal X-rays without an accompanying supernova remnant",
    distractors: [
      "A dormant black hole singularity surrounded by a frozen ring of cometary debris",
      "A binary white dwarf system undergoing mass transfer toward the Chandrasekhar limit",
      "A rapidly spinning magnetar with magnetic field strengths exceeding 100 gigatesla",
    ],
    explanation: "Named after the villain in 'The Magnificent Seven', Calvera is one of only a handful of known isolated neutron stars that emit pure X-ray radiation in deep space.",
    trivia: "Calvera lies high above the plane of the Milky Way, likely kicked there by an asymmetrical supernova explosion millions of years ago.",
  },

  "the sun's dark neighbor": {
    question: "Located just 11 light-years from Earth within the borders of Ursa Minor, what kind of celestial object is WISE 1506+7027?",
    correctAnswer: "A cold, sub-stellar brown dwarf that lacked sufficient mass to sustain hydrogen thermonuclear fusion",
    distractors: [
      "A wandering rogue planet ejected from the Alpha Centauri star system",
      "A dying white dwarf cooling into a dark carbon-crystal sphere",
      "A primordial micro-black hole captured by the Sun's Oort cloud",
    ],
    explanation: "Discovered by NASA's WISE infrared space telescope in 2011, this brown dwarf is one of the Sun's nearest cosmic neighbors, invisible to optical eyes because it emits only faint thermal infrared glow.",
    trivia: "Brown dwarfs are often called 'failed stars' because their masses fall between the heaviest gas giants and the lightest stars.",
  },

  'the north star': {
    question: "Located roughly 431 light-years away at the tip of the Little Dipper's handle, what type of star is Polaris?",
    correctAnswer: "A pulsating yellow supergiant star belonging to a multiple-star system",
    distractors: [
      "A solitary blue main-sequence star burning pure hydrogen at extreme temperatures",
      "An ancient red dwarf approaching the end of its multi-trillion-year lifespan",
      "A rapidly rotating neutron star emitting periodic radio pulses toward Earth",
    ],
    explanation: "Polaris is not a single ordinary star; it is a multiple-star system dominated by Polaris Aa, a yellow supergiant that is also a classical Cepheid variable star.",
    trivia: "Polaris appears stationary in the night sky only because Earth's northern axis happens to point almost directly at it during our current epoch.",
  },

  'guardians of the pole': {
    question: "In the constellation Ursa Minor, which two bright stars at the front of the Little Dipper's bowl are historically known as the 'Guardians of the Pole'?",
    correctAnswer: "Kochab and Pherkad, which circle endlessly around the North Star",
    distractors: [
      "Castor and Pollux, the celestial twin stars of navigation",
      "Betelgeuse and Rigel, the luminous beacons of the celestial sphere",
      "Sirius and Procyon, the brilliant winter sentinels",
    ],
    explanation: "Before Polaris became the true North Star, Kochab was the closest bright star to the celestial pole, and ancient navigators used Kochab and Pherkad as reliable directional clocks.",
    trivia: "Kochab is an orange giant star located about 130 light-years away, possessing a confirmed gas giant exoplanet.",
  },

  // Taurus
  'the pleiades': {
    question: "Hovering near the shoulders of the constellation Taurus, what makes the Pleiades (Seven Sisters) one of the night sky's most famous sights?",
    correctAnswer: "A dazzling open star cluster of luminous young blue stars enveloped in a glowing reflection nebula",
    distractors: [
      "A planetary nebula formed by the explosive death of an ancient asymptotic giant star",
      "A tight asterism of unrelated foreground stars aligned by line-of-sight coincidence",
      "A dense globular cluster of over 500,000 ancient Population II stars",
    ],
    explanation: "The Pleiades is an open cluster containing over 1,000 stars that formed together roughly 100 million years ago, currently drifting through an interstellar dust cloud that scatters blue light.",
    trivia: "Most people with naked eyes can see 6 or 7 stars in the cluster, but optical telescopes reveal hundreds of cluster members.",
  },

  'aldebaran: the fiery eye': {
    question: "What type of star is Aldebaran, the celebrated 'fiery eye' marking the head of the constellation Taurus?",
    correctAnswer: "A massive, luminous orange-red giant star that has exhausted hydrogen fuel in its core",
    distractors: [
      "A newly formed protostar still embedded in its circumstellar accretion envelope",
      "The physical central core star anchoring the distant Hyades star cluster",
      "A massive Wolf-Rayet star shedding its outer envelope in extreme stellar winds",
    ],
    explanation: "Aldebaran is an orange giant about 44 times the diameter of our Sun. While it appears to sit in the V-shaped Hyades cluster, it is actually a foreground star only 65 light-years away.",
    trivia: "The name Aldebaran comes from the Arabic 'Al Dabaran', meaning 'the Follower', because it appears to follow the Pleiades across the night sky.",
  },

  // Cygnus
  "albireo's jewel": {
    question: "At the beak of the constellation Cygnus (the Swan), what makes the famous double star Albireo a celebrated jewel for astronomers?",
    correctAnswer: "Its striking color contrast between a bright golden-topaz giant and a vivid sapphire-blue companion",
    distractors: [
      "A rare eclipsing binary system that dims by 90% every few months",
      "A high-velocity pulsar emitting radio pulses synchronized with optical flashes",
      "A dormant stellar-mass black hole accreting material from a red supergiant",
    ],
    explanation: "Viewed through a small telescope, Albireo splits into two stars of dazzling contrasting colors: a warm golden-orange K-type giant and a cool blue B-type main-sequence star.",
    trivia: "Recent measurements from the Gaia spacecraft suggest the two stars of Albireo may be an optical double aligned by chance rather than physically bound.",
  },
};

// ============================================================================
// DYNAMIC SYNTACTIC ENGINE
// Handles any arbitrary discovery with brilliant, non-templated writing
// ============================================================================

function createCuratedQuestionFromDiscovery(
  disc: EnrichedDiscovery | undefined,
  questionIndex: number,
  difficulty: QuestionDifficulty,
  usedDistractors: Set<string>
): QuestionDraft {
  const archetype = QUESTION_ARCHETYPES[(questionIndex - 1) % QUESTION_ARCHETYPES.length];
  const title = cleanSentence(disc?.title);
  const subtitle = cleanSentence(disc?.subtitle);
  const body = disc?.body || '';
  const objectName = disc?.objectName || 'the cosmos';
  const topicTitle = disc?.topicTitle || 'astronomy';
  const objectCategory = (disc?.objectCategory || '').toLowerCase();
  const titleKey = title.toLowerCase();

  // Check bespoke registry first
  if (BESPOKE_DISCOVERY_REGISTRY[titleKey]) {
    const bespoke = BESPOKE_DISCOVERY_REGISTRY[titleKey];
    return assembleQuestionCard(
      questionIndex,
      archetype,
      difficulty,
      bespoke.question,
      bespoke.correctAnswer,
      bespoke.distractors,
      bespoke.explanation,
      bespoke.trivia
    );
  }

  // Dynamic Synthesizer
  // Determine primary astronomical domain
  let domain: 'galaxies' | 'stellar' | 'geology' | 'atmosphere' | 'missions' | 'time' = 'geology';
  const bodyLower = (body + ' ' + title + ' ' + subtitle).toLowerCase();

  if (bodyLower.includes('telescope') || bodyLower.includes('observatory') || bodyLower.includes('spectro') || bodyLower.includes('camera') || bodyLower.includes('telemetry')) {
    domain = 'missions';
  } else if (objectCategory.includes('galax') || bodyLower.includes('galaxy') || bodyLower.includes('dark matter') || bodyLower.includes('spiral arm') || bodyLower.includes('bulge')) {
    domain = 'galaxies';
  } else if (objectCategory.includes('constellat') || bodyLower.includes('star') || bodyLower.includes('giant') || bodyLower.includes('cluster') || bodyLower.includes('pulsar') || bodyLower.includes('dwarf')) {
    domain = 'stellar';
  } else if (bodyLower.includes('atmosphere') || bodyLower.includes('greenhouse') || bodyLower.includes('climate') || bodyLower.includes('wind') || bodyLower.includes('vapor')) {
    domain = 'atmosphere';
  } else if (bodyLower.includes('precession') || bodyLower.includes('orbit') || bodyLower.includes('resonance') || bodyLower.includes('billion years') || bodyLower.includes('million years')) {
    domain = 'time';
  } else {
    domain = 'geology';
  }

  // Extract candidate sentence from body
  const sentences = body
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25);
  const primarySentence = sentences[0] || `${objectName} exhibits unique physical properties confirmed by astronomical research.`;
  const secondarySentence = sentences[1] || primarySentence;

  let questionText = '';
  let correctAnswer = '';

  // Clean and parse subtitle
  let cleanSub = subtitle;
  // Remove leading articles or phrases
  cleanSub = cleanSub.replace(/^(how|why|what|the|a|an)\s+/i, '');

  if (difficulty === 'Easy') {
    if (disc?.curiosityTitle && disc.curiosityTitle.length > 15) {
      questionText = `In discoveries on ${objectName}, what major finding answers the question: "${cleanSentence(disc.curiosityTitle)}"?`;
      correctAnswer = cleanSentence(disc.curiositySubtitle) || subtitle || primarySentence.slice(0, 85);
    } else if (subtitle && subtitle.length > 20) {
      questionText = `When exploring ${objectName}'s ${topicTitle.toLowerCase()}, what foundational discovery was confirmed regarding ${cleanSub.toLowerCase()}?`;
      correctAnswer = subtitle;
    } else {
      questionText = `What key physical characteristic of ${objectName} was established during investigations of "${title}"?`;
      correctAnswer = primarySentence.slice(0, 85);
    }
  } else if (difficulty === 'Medium') {
    if (subtitle.toLowerCase().startsWith('how') || subtitle.toLowerCase().startsWith('why')) {
      questionText = `${subtitle.charAt(0).toUpperCase() + subtitle.slice(1)} on ${objectName}?`;
      correctAnswer = secondarySentence.slice(0, 90) || primarySentence.slice(0, 90);
    } else {
      questionText = `What physical mechanism explains the dynamics of ${cleanSub.toLowerCase()} within ${objectName}?`;
      correctAnswer = secondarySentence.slice(0, 90) || subtitle;
    }
  } else if (difficulty === 'Hard') {
    questionText = `Which specific observational telemetry or physical evidence verified models of ${cleanSub.toLowerCase()} at ${objectName}?`;
    correctAnswer = primarySentence.slice(0, 95) || subtitle;
  } else {
    // Very Difficult
    if (disc?.curiosityTitle) {
      questionText = `What counterintuitive cosmic paradox regarding ${objectName} is highlighted by "${cleanSentence(disc.curiosityTitle)}"?`;
      correctAnswer = cleanSentence(disc.curiositySubtitle) || subtitle;
    } else {
      questionText = `What theoretical discrepancy between classical models and empirical data was uncovered when investigating "${title}" at ${objectName}?`;
      correctAnswer = secondarySentence.slice(0, 95) || subtitle;
    }
  }

  // Ensure question text ends with a question mark and has no double punctuation
  questionText = questionText.replace(/[.?!]+$/, '') + '?';
  questionText = questionText.replace(/\s+\?/, '?');

  // Select 3 distractors from the domain pool, avoiding already used distractors if possible
  const pool = DISTRACTOR_POOLS[domain] || DISTRACTOR_POOLS.geology;
  const filteredPool = pool.filter((d) => !usedDistractors.has(d));
  const finalPool = filteredPool.length >= 3 ? filteredPool : pool;

  // Shuffle pool deterministically based on questionIndex
  const distractors: string[] = [];
  for (let i = 0; i < 3; i++) {
    const pick = finalPool[(questionIndex * 3 + i) % finalPool.length];
    distractors.push(pick);
    usedDistractors.add(pick);
  }

  const explanation = `Based on verified Constella research: ${primarySentence}`;
  const trivia = disc?.curiositySubtitle
    ? `${disc.curiosityTitle ? `${cleanSentence(disc.curiosityTitle)}: ` : ''}${disc.curiositySubtitle}`
    : `Astronomers continue to refine measurements of ${objectName} using space telescopes and deep-sky surveys.`;

  return assembleQuestionCard(
    questionIndex,
    archetype,
    difficulty,
    questionText,
    correctAnswer,
    distractors,
    explanation,
    trivia
  );
}

function assembleQuestionCard(
  questionIndex: number,
  archetype: string,
  difficulty: QuestionDifficulty,
  questionText: string,
  correctAnswer: string,
  distractors: string[],
  explanation: string,
  trivia: string
): QuestionDraft {
  // Randomize correct option position across A, B, C, D
  const correctPrefixIndex = (questionIndex * 7 + (difficulty === 'Easy' ? 1 : 3)) % 4;
  const letters: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
  const targetPrefix = letters[correctPrefixIndex];

  let distractorIdx = 0;
  const options: QuestionOptionDraft[] = letters.map((prefix) => {
    const isCorrect = prefix === targetPrefix;
    const text = isCorrect ? correctAnswer : distractors[distractorIdx++] || 'Alternative astrophysical outcome';
    return {
      id: `q_opt_${questionIndex}_${prefix}`,
      prefix,
      text,
      isCorrect,
    };
  });

  return {
    id: `curated_q_${questionIndex}`,
    orderIndex: questionIndex,
    archetype,
    difficulty,
    text: questionText,
    explanation,
    interestingFact: trivia,
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

  // Group discoveries strictly by their verified objectName
  const discByObject = new Map<string, EnrichedDiscovery[]>();
  for (const d of params.discoveries) {
    const name = d.objectName || targets[0] || 'Cosmos';
    const list = discByObject.get(name) || [];
    list.push(d);
    discByObject.set(name, list);
  }

  const questions: QuestionDraft[] = [];
  const usedDistractors = new Set<string>();

  for (let i = 1; i <= params.questionCount; i++) {
    // Round-robin through target objects so each object gets fair representation
    const targetObject = targets[(i - 1) % targets.length];
    const objectDiscs = discByObject.get(targetObject) || params.discoveries;

    // Pick an authentic discovery for THIS object
    const discIndex = Math.floor((i - 1) / targets.length) % (objectDiscs.length || 1);
    const disc = objectDiscs[discIndex] || objectDiscs[0] || params.discoveries[0];
    const diff = targetDifficulties[i - 1] || 'Medium';

    questions.push(createCuratedQuestionFromDiscovery(disc, i, diff, usedDistractors));
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
