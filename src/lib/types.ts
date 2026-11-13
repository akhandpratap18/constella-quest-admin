export interface DBQuest {
  id: string;
  questSetId: string;
  title: string;
  description: string;
  weekNumber: number;
  status: 'Active' | 'Upcoming' | 'Completed';
  imageUrl: string;
  durationString: string;
  dateRangeString: string;
  createdAt?: string;
}

export interface DBQuestionSet {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  createdAt?: string;
}

export interface DBQuestion {
  id: string;
  setId: string;
  orderIndex: number;
  text: string;
  explanation: string;
  interestingFact?: string;
  createdAt?: string;
}

export interface DBQuestionOption {
  id: string;
  questionId: string;
  prefix: 'A' | 'B' | 'C' | 'D';
  text: string;
  isCorrect: boolean;
}

export interface DBCelestialObject {
  id: string;
  name: string;
  category: string;
  subtitle?: string;
  summary?: string;
  imageUrl?: string;
}

export interface DBTopic {
  id: string;
  objectId: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
}

export interface DBDiscovery {
  id: string;
  topicId: string;
  title: string;
  subtitle?: string;
  body: string;
  caption?: string;
  curiosityTitle?: string;
  curiositySubtitle?: string;
}

// UI Draft Types
export interface QuestionOptionDraft {
  id: string;
  prefix: 'A' | 'B' | 'C' | 'D';
  text: string;
  isCorrect: boolean;
}

export interface QuestionDraft {
  id: string;
  orderIndex: number;
  text: string;
  explanation: string;
  interestingFact: string;
  archetype?: string;
  options: QuestionOptionDraft[];
}

export interface QuestDraft {
  id?: string;
  questSetId?: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  weekNumber: number;
  durationString: string;
  dateRangeString: string;
  imageUrl: string;
  status: 'Active' | 'Upcoming' | 'Completed';
  selectedCategory: string;
  selectedObjectIds: string[];
  questions: QuestionDraft[];
}
