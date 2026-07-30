import { Service, inject } from '@angular/core';
import { Supabase } from './supabase';
import {
  CreateSurveyInput,
  Survey,
  SurveyDetail,
  SurveyOption,
  SurveyOptionRow,
  SurveyQuestion,
  SurveyQuestionRow,
  SurveyRow,
  SurveyStatus,
} from '../../models/survey.model';

type SurveyQuestionRowWithOptions = SurveyQuestionRow & {
  survey_options: SurveyOptionRow[];
};
type SurveyRowWithQuestions = SurveyRow & {
  survey_questions: SurveyQuestionRowWithOptions[];
};

const DETAIL_SELECT =
  '*, survey_questions(id, survey_id, question_text, allow_multiple_answers, position, survey_options(id, question_id, label, votes(id)))';

@Service()
export class SurveyService {
  private readonly supabase = inject(Supabase).client;

  /** Laedt alle Umfragen (ohne Fragen/Optionen) sortiert nach Deadline. */
  async getSurveys(): Promise<Survey[]> {
    const { data, error } = await this.supabase
      .from('surveys')
      .select('*')
      .order('deadline', { ascending: true });

    if (error) throw error;
    return (data ?? []).map((row) => this.toSurvey(row));
  }

  /** Laedt eine Umfrage inkl. aller Fragen, Optionen und Stimmenzahl. */
  async getSurveyById(id: string): Promise<SurveyDetail> {
    const { data, error } = await this.supabase
      .from('surveys')
      .select(DETAIL_SELECT)
      .order('position', { foreignTable: 'survey_questions', ascending: true })
      .eq('id', id)
      .single();

    if (error) throw error;
    return this.toSurveyDetail(data);
  }

  /** Legt eine neue Umfrage samt Fragen und Antwortoptionen an und gibt deren ID zurueck. */
  async createSurvey(input: CreateSurveyInput): Promise<string> {
    const surveyId = await this.insertSurvey(input);
    await this.insertQuestions(surveyId, input.questions);
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

  private async insertQuestions(
    surveyId: string,
    questions: CreateSurveyInput['questions'],
  ): Promise<void> {
    for (const [index, question] of questions.entries()) {
      const questionId = await this.insertQuestion(surveyId, question, index);
      await this.insertOptions(questionId, question.optionLabels);
    }
  }

  private async insertQuestion(
    surveyId: string,
    question: CreateSurveyInput['questions'][number],
    position: number,
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from('survey_questions')
      .insert({
        survey_id: surveyId,
        question_text: question.questionText,
        allow_multiple_answers: question.allowMultipleAnswers,
        position,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  private async insertOptions(questionId: string, labels: string[]): Promise<void> {
    const rows = labels.map((label) => ({ question_id: questionId, label }));
    const { error } = await this.supabase.from('survey_options').insert(rows);
    if (error) throw error;
  }

  private toSurvey(row: SurveyRow): Survey {
    const deadline = new Date(row.deadline);
    return {
      id: row.id,
      category: row.category,
      title: row.title,
      description: row.description ?? undefined,
      deadline,
      status: this.statusFor(deadline),
    };
  }

  private toSurveyDetail(row: SurveyRowWithQuestions): SurveyDetail {
    return {
      ...this.toSurvey(row),
      questions: row.survey_questions.map((question) => this.toQuestion(question)),
    };
  }

  private toQuestion(row: SurveyQuestionRowWithOptions): SurveyQuestion {
    return {
      id: row.id,
      questionText: row.question_text,
      allowMultipleAnswers: row.allow_multiple_answers,
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
