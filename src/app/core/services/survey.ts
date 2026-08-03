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

/** A raw `survey_questions` row including its nested `survey_options` rows. */
type SurveyQuestionRowWithOptions = SurveyQuestionRow & {
  survey_options: SurveyOptionRow[];
};
/** A raw `surveys` row including its nested `survey_questions` rows. */
type SurveyRowWithQuestions = SurveyRow & {
  survey_questions: SurveyQuestionRowWithOptions[];
};

/** Supabase select expression for a survey plus its ordered questions, options and vote counts. */
const DETAIL_SELECT =
  '*, survey_questions(id, survey_id, question_text, allow_multiple_answers, position, survey_options(id, question_id, label, votes(id)))';

/** Reads and writes surveys, questions, options and votes via Supabase. */
@Service()
export class SurveyService {
  private readonly supabase = inject(Supabase).client;

  /** @returns all surveys (without questions/options), sorted by deadline. */
  async getSurveys(): Promise<Survey[]> {
    const { data, error } = await this.supabase
      .from('surveys')
      .select('*')
      .order('deadline', { ascending: true });

    if (error) throw error;
    return (data ?? []).map((row) => this.toSurvey(row));
  }

  /**
   * Loads one survey including all questions, options and vote counts.
   * @param id - id of the survey to load.
   * @returns the full survey detail.
   */
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

  /**
   * Creates a new survey with its questions and answer options.
   * @param input - the form input describing the survey to create.
   * @returns the id of the newly created survey.
   */
  async createSurvey(input: CreateSurveyInput): Promise<string> {
    const surveyId = await this.insertSurvey(input);
    await this.insertQuestions(surveyId, input.questions);
    return surveyId;
  }

  /**
   * Casts a vote for the given answer option.
   * @param optionId - id of the option being voted for.
   */
  async castVote(optionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('votes')
      .insert({ option_id: optionId });

    if (error) throw error;
  }

  /**
   * Inserts the `surveys` row.
   * @param input - the form input describing the survey to create.
   * @returns the id of the inserted row.
   */
  private async insertSurvey(input: CreateSurveyInput): Promise<string> {
    const { data, error } = await this.supabase
      .from('surveys')
      .insert(this.toSurveyInsert(input))
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Builds the insert payload for the `surveys` table from the form input.
   * @param input - the form input describing the survey to create.
   * @returns the row payload to insert.
   */
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

  /**
   * Inserts all questions of a survey in order, including their answer options.
   * @param surveyId - id of the survey the questions belong to.
   * @param questions - the form input's list of questions.
   */
  private async insertQuestions(
    surveyId: string,
    questions: CreateSurveyInput['questions'],
  ): Promise<void> {
    for (const [index, question] of questions.entries()) {
      const questionId = await this.insertQuestion(surveyId, question, index);
      await this.insertOptions(questionId, question.optionLabels);
    }
  }

  /**
   * Inserts a single question.
   * @param surveyId - id of the survey the question belongs to.
   * @param question - the form input for this question.
   * @param position - the question's zero-based position within the survey.
   * @returns the id of the inserted question row.
   */
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

  /**
   * Inserts the answer options for a question.
   * @param questionId - id of the question the options belong to.
   * @param labels - the answer option labels to insert.
   */
  private async insertOptions(questionId: string, labels: string[]): Promise<void> {
    const rows = labels.map((label) => ({ question_id: questionId, label }));
    const { error } = await this.supabase.from('survey_options').insert(rows);
    if (error) throw error;
  }

  /**
   * Maps a raw `surveys` row to the app model, including the derived status.
   * @param row - the raw `surveys` row.
   * @returns the mapped survey summary.
   */
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

  /**
   * Maps a raw `surveys` row including nested questions to the app model.
   * @param row - the raw `surveys` row with its nested `survey_questions`.
   * @returns the mapped survey detail.
   */
  private toSurveyDetail(row: SurveyRowWithQuestions): SurveyDetails {
    return {
      ...this.toSurvey(row),
      questions: row.survey_questions.map((question) => this.toQuestion(question)),
    };
  }

  /**
   * Maps a raw `survey_questions` row including its options to the app model.
   * @param row - the raw `survey_questions` row with its nested `survey_options`.
   * @returns the mapped question.
   */
  private toQuestion(row: SurveyQuestionRowWithOptions): SurveyQuestion {
    return {
      id: row.id,
      questionText: row.question_text,
      allowMultipleAnswers: row.allow_multiple_answers,
      options: row.survey_options.map((option) => this.toOption(option)),
    };
  }

  /**
   * Derives the survey status from its deadline instead of storing it separately.
   * @param deadline - the survey's deadline.
   * @returns 'closed' if the deadline has passed, otherwise 'ongoing'.
   */
  private statusFor(deadline: Date): SurveyStatus {
    return deadline.getTime() < Date.now() ? 'closed' : 'ongoing';
  }

  /**
   * Maps a raw `survey_options` row including its vote count to the app model.
   * @param row - the raw `survey_options` row with its nested `votes`.
   * @returns the mapped answer option.
   */
  private toOption(row: SurveyOptionRow): SurveyOption {
    return { id: row.id, label: row.label, voteCount: row.votes.length };
  }

  /** @returns a placeholder deadline for surveys created without an end date. */
  private farFutureDate(): Date {
    return new Date('2100-01-01');
  }
}
