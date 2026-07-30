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
