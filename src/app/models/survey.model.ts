export type SurveyStatus = 'ongoing' | 'closed';

/** Feste Liste der waehlbaren Umfrage-Kategorien (Create-Formular & Sortier-Dropdown). */
export const SURVEY_CATEGORIES = [
  'Team Activities',
  'Health & Wellness',
  'Gaming & Entertainment',
  'Education & Learning',
  'Lifestyle & Preferences',
  'Technology & Innovation',
] as const;

/** Zusammenfassung einer Umfrage, wie sie im Homescreen (Karten/Liste) angezeigt wird. */
export interface Survey {
  id: string;
  category: string;
  title: string;
  description?: string;
  deadline: Date;
  status: SurveyStatus;
}

/** Eine einzelne Antwortmoeglichkeit inkl. aktueller Stimmenzahl. */
export interface SurveyOption {
  id: string;
  label: string;
  voteCount: number;
}

/** Eine Frage innerhalb einer Umfrage mit ihren Antwortoptionen. */
export interface SurveyQuestion {
  id: string;
  questionText: string;
  allowMultipleAnswers: boolean;
  options: SurveyOption[];
}

/** Vollstaendige Umfrage inkl. aller Fragen und Antwortoptionen (Detail-/Abstimmungsansicht). */
export interface SurveyDetail extends Survey {
  questions: SurveyQuestion[];
}

/** Rohdaten aus der `surveys`-Tabelle, wie sie von Supabase zurueckkommen. */
export interface SurveyRow {
  id: string;
  category: string;
  title: string;
  description: string | null;
  deadline: string;
  created_at: string;
}

/** Rohdaten aus der `survey_questions`-Tabelle. */
export interface SurveyQuestionRow {
  id: string;
  survey_id: string;
  question_text: string;
  allow_multiple_answers: boolean;
  position: number;
}

/** Rohdaten aus der `survey_options`-Tabelle inkl. verknuepfter Stimmen. */
export interface SurveyOptionRow {
  id: string;
  question_id: string;
  label: string;
  votes: { id: string }[];
}

/** Formular-Eingabe fuer eine einzelne Frage beim Erstellen einer Umfrage. */
export interface CreateQuestionInput {
  questionText: string;
  allowMultipleAnswers: boolean;
  optionLabels: string[];
}

/** Formular-Eingabe zum Erstellen einer neuen Umfrage. */
export interface CreateSurveyInput {
  category: string;
  title: string;
  description?: string;
  deadline?: Date;
  questions: CreateQuestionInput[];
}
