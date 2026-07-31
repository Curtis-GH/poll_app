import { Service, inject } from '@angular/core';
import { Supabase } from './supabase';
import {
  CreateSurveyInput,
  Survey,
  SurveyDetails,
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

/** Reads and writes surveys, questions, options and votes via Supabase. */
@Service()
export class SurveyService {
  private readonly supabase = inject(Supabase).client;

  /** Loads all surveys (without questions/options), sorted by deadline. */
  async getSurveys(): Promise<Survey[]> {
    const { data, error } = await this.supabase
      .from('surveys')
      .select('*')
      .order('deadline', { ascending: true });

    if (error) throw error;
    return (data ?? []).map((row) => this.toSurvey(row));
  }

  /** Loads one survey including all questions, options and vote counts. */
  async getSurveyById(id: string): Promise<SurveyDetails> {
    const { data, error } = await this.supabase
      .from('surveys')
      .select(DETAIL_SELECT)
      .order('position', { foreignTable: 'survey_questions', ascending: true })
      .eq('id', id)
      .single();

    if (error) throw error;
    return this.toSurveyDetail(data);
  }

  /** Creates a new survey with its questions and answer options, returning its id. */
  async createSurvey(input: CreateSurveyInput): Promise<string> {
    const surveyId = await this.insertSurvey(input);
    await this.insertQuestions(surveyId, input.questions);
    return surveyId;
  }

  /** Casts a vote for the given answer option. */
  async castVote(optionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('votes')
      .insert({ option_id: optionId });

    if (error) throw error;
  }

  /** Inserts the `surveys` row and returns its id. */
  private async insertSurvey(input: CreateSurveyInput): Promise<string> {
    const { data, error } = await this.supabase
      .from('surveys')
      .insert(this.toSurveyInsert(input))
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  /** Builds the insert payload for the `surveys` table from the form input. */
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

  /** Inserts all questions of a survey in order, including their answer options. */
  private async insertQuestions(
    surveyId: string,
    questions: CreateSurveyInput['questions'],
  ): Promise<void> {
    for (const [index, question] of questions.entries()) {
      const questionId = await this.insertQuestion(surveyId, question, index);
      await this.insertOptions(questionId, question.optionLabels);
    }
  }

  /** Inserts a single question and returns its id. */
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

  /** Inserts the answer options for a question. */
  private async insertOptions(questionId: string, labels: string[]): Promise<void> {
    const rows = labels.map((label) => ({ question_id: questionId, label }));
    const { error } = await this.supabase.from('survey_options').insert(rows);
    if (error) throw error;
  }

  /** Maps a raw `surveys` row to the app model, including the derived status. */
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

  /** Maps a raw `surveys` row including nested questions to the app model. */
  private toSurveyDetail(row: SurveyRowWithQuestions): SurveyDetails {
    return {
      ...this.toSurvey(row),
      questions: row.survey_questions.map((question) => this.toQuestion(question)),
    };
  }

  /** Maps a raw `survey_questions` row including its options to the app model. */
  private toQuestion(row: SurveyQuestionRowWithOptions): SurveyQuestion {
    return {
      id: row.id,
      questionText: row.question_text,
      allowMultipleAnswers: row.allow_multiple_answers,
      options: row.survey_options.map((option) => this.toOption(option)),
    };
  }

  /** Derives the survey status from its deadline instead of storing it separately. */
  private statusFor(deadline: Date): SurveyStatus {
    return deadline.getTime() < Date.now() ? 'closed' : 'ongoing';
  }

  /** Maps a raw `survey_options` row including its vote count to the app model. */
  private toOption(row: SurveyOptionRow): SurveyOption {
    return { id: row.id, label: row.label, voteCount: row.votes.length };
  }

  /** Placeholder deadline for surveys created without an end date. */
  private farFutureDate(): Date {
    return new Date('2100-01-01');
  }
}
