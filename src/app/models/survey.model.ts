export type SurveyStatus = 'ongoing' | 'closed';

export interface SurveyOption {
  id: string;
  label: string;
  voteCount: number;
}

export interface Survey {
  id: string;
  category: string;
  title: string;
  description?: string;
  deadline: Date;
  status: SurveyStatus;
  options: SurveyOption[];
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

/** Rohdaten aus der `survey_options`-Tabelle inkl. verknuepfter Stimmen. */
export interface SurveyOptionRow {
  id: string;
  survey_id: string;
  label: string;
  votes: { id: string }[];
}

/** Formular-Eingabe zum Erstellen einer neuen Umfrage. */
export interface CreateSurveyInput {
  category: string;
  title: string;
  description?: string;
  deadline?: Date;
  optionLabels: string[];
}
