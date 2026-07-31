/** Lifecycle state of a survey, derived from whether its deadline has passed. */
export type SurveyStatus = 'ongoing' | 'closed';

/** Fixed list of selectable survey categories (create form & sort dropdown). */
export const SURVEY_CATEGORIES = [
  'Team Activities',
  'Health & Wellness',
  'Gaming & Entertainment',
  'Education & Learning',
  'Lifestyle & Preferences',
  'Technology & Innovation',
] as const;

/** Summary of a survey as shown on the homescreen (cards/list). */
export interface Survey {
  id: string;
  category: string;
  title: string;
  description?: string;
  deadline: Date;
  status: SurveyStatus;
}

/** A single answer option including its current vote count. */
export interface SurveyOption {
  id: string;
  label: string;
  voteCount: number;
}

/** A question within a survey along with its answer options. */
export interface SurveyQuestion {
  id: string;
  questionText: string;
  allowMultipleAnswers: boolean;
  options: SurveyOption[];
}

/** Full survey including all questions and answer options (detail/voting view). */
export interface SurveyDetails extends Survey {
  questions: SurveyQuestion[];
}

/** Raw row from the `surveys` table, as returned by Supabase. */
export interface SurveyRow {
  id: string;
  category: string;
  title: string;
  description: string | null;
  deadline: string;
  created_at: string;
}

/** Raw row from the `survey_questions` table. */
export interface SurveyQuestionRow {
  id: string;
  survey_id: string;
  question_text: string;
  allow_multiple_answers: boolean;
  position: number;
}

/** Raw row from the `survey_options` table including linked votes. */
export interface SurveyOptionRow {
  id: string;
  question_id: string;
  label: string;
  votes: { id: string }[];
}

/** Form input for a single question when creating a survey. */
export interface CreateQuestionInput {
  questionText: string;
  allowMultipleAnswers: boolean;
  optionLabels: string[];
}

/** Form input for creating a new survey. */
export interface CreateSurveyInput {
  category: string;
  title: string;
  description?: string;
  deadline?: Date;
  questions: CreateQuestionInput[];
}
