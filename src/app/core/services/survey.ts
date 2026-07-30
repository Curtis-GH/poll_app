import { Service, inject } from '@angular/core';
import { Supabase } from './supabase';
import {
  CreateSurveyInput,
  Survey,
  SurveyOption,
  SurveyOptionRow,
  SurveyRow,
  SurveyStatus,
} from '../../models/survey.model';

type SurveyRowWithOptions = SurveyRow & { survey_options: SurveyOptionRow[] };

@Service()
export class SurveyService {
  private readonly supabase = inject(Supabase).client;

  /** Laedt alle Umfragen inkl. Optionen und Stimmenzahl, sortiert nach Deadline. */
  async getSurveys(): Promise<Survey[]> {
    const { data, error } = await this.supabase
      .from('surveys')
      .select('*, survey_options(id, survey_id, label, votes(id))')
      .order('deadline', { ascending: true });

    if (error) throw error;
    return (data ?? []).map((row) => this.toSurvey(row));
  }

  /** Laedt eine einzelne Umfrage inkl. Optionen und Stimmenzahl. */
  async getSurveyById(id: string): Promise<Survey> {
    const { data, error } = await this.supabase
      .from('surveys')
      .select('*, survey_options(id, survey_id, label, votes(id))')
      .eq('id', id)
      .single();

    if (error) throw error;
    return this.toSurvey(data);
  }

  /** Legt eine neue Umfrage samt Antwortoptionen an und gibt deren ID zurueck. */
  async createSurvey(input: CreateSurveyInput): Promise<string> {
    const surveyId = await this.insertSurvey(input);
    await this.insertOptions(surveyId, input.optionLabels);
    return surveyId;
  }

  /** Gibt eine Stimme fuer die uebergebene Antwortoption ab. */
  async castVote(optionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('votes')
      .insert({ option_id: optionId });

    if (error) throw error;
  }

  private async insertSurvey(input: CreateSurveyInput): Promise<string> {
    const { data, error } = await this.supabase
      .from('surveys')
      .insert(this.toSurveyInsert(input))
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  private toSurveyInsert(input: CreateSurveyInput): {
    category: string;
    title: string;
    description: string | null;
    deadline: string;
  } {
    return {
      category: input.category,
      title: input.title,
      description: input.description ?? null,
      deadline: (input.deadline ?? this.farFutureDate()).toISOString(),
    };
  }

  private async insertOptions(surveyId: string, labels: string[]): Promise<void> {
    const rows = labels.map((label) => ({ survey_id: surveyId, label }));
    const { error } = await this.supabase.from('survey_options').insert(rows);
    if (error) throw error;
  }

  private toSurvey(row: SurveyRowWithOptions): Survey {
    const deadline = new Date(row.deadline);
    return {
      id: row.id,
      category: row.category,
      title: row.title,
      description: row.description ?? undefined,
      deadline,
      status: this.statusFor(deadline),
      options: row.survey_options.map((option) => this.toOption(option)),
    };
  }

  private statusFor(deadline: Date): SurveyStatus {
    return deadline.getTime() < Date.now() ? 'closed' : 'ongoing';
  }

  private toOption(row: SurveyOptionRow): SurveyOption {
    return { id: row.id, label: row.label, voteCount: row.votes.length };
  }

  private farFutureDate(): Date {
    return new Date('2100-01-01');
  }
}
