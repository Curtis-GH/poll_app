import { Component, computed, effect, inject, OnDestroy, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SurveyService } from '../../core/services/survey';
import { CreateSurveyInput, SURVEY_CATEGORIES } from '../../models/survey.model';

/** Form state for a single question while it's being edited. */
interface QuestionForm {
  questionText: string;
  allowMultipleAnswers: boolean;
  options: string[];
}

/** Shape of the form state persisted as a localStorage draft. */
interface DraftData {
  category: string;
  title: string;
  deadline: string;
  description: string;
  questions: QuestionForm[];
}

/** Maximum number of answer options allowed per question. */
const MAX_OPTIONS = 6;
/** Minimum number of answer options required per question (A and B are always kept). */
const MIN_OPTIONS = 2;
/** localStorage key the in-progress form draft is saved under. */
const DRAFT_STORAGE_KEY = 'poll-app:survey-draft';
/** Char code of 'A', used as the base for lettering answer options (A, B, C, ...). */
const OPTION_LETTER_BASE_CHAR_CODE = 65;

/** Create-survey form: multiple questions with up to MAX_OPTIONS answers each, with a localStorage draft. */
@Component({
  selector: 'app-survey-create',
  imports: [RouterLink],
  templateUrl: './survey-create.html',
  styleUrl: './survey-create.scss',
})
export class SurveyCreate implements OnDestroy {
  private readonly surveyService = inject(SurveyService);
  private readonly router = inject(Router);
  private readonly draft = this.loadDraft();

  readonly categories = SURVEY_CATEGORIES;
  readonly maxOptions = MAX_OPTIONS;
  /** Today's date in YYYY-MM-DD, used as the `min` for the deadline date input so past dates can't be picked. */
  readonly todayIsoDate = new Date().toISOString().slice(0, 10);

  readonly category = signal(this.draft.category ?? '');
  readonly title = signal(this.draft.title ?? '');
  readonly deadline = signal(this.draft.deadline ?? '');
  readonly description = signal(this.draft.description ?? '');
  readonly questions = signal<QuestionForm[]>(this.draft.questions ?? [this.emptyQuestion()]);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPublishedToast = signal(false);
  readonly isCategoryMenuOpen = signal(false);
  /** Id of the survey created by the last successful publish; used to redirect once the toast closes. */
  private createdSurveyId: string | null = null;

  /** True when title, category and all questions satisfy the required fields. */
  readonly isValid = computed(
    () =>
      this.title().trim().length > 0 &&
      this.category().length > 0 &&
      this.questions().every((q) => this.isQuestionValid(q)),
  );

  constructor() {
    effect(() => this.saveDraft());
  }

  /** Clears the draft on SPA navigation away from the page (e.g. via a header link), not only on Cancel. */
  ngOnDestroy(): void {
    this.clearDraft();
  }

  /**
   * Derives the option letter (A, B, C, ...) from its position within the question.
   * @param index - zero-based position of the option within its question.
   * @returns the single-letter label for that position.
   */
  optionLetter(index: number): string {
    return String.fromCharCode(OPTION_LETTER_BASE_CHAR_CODE + index);
  }

  /**
   * Column (1 or 2) for the question grid layout: Q1/Q2 side by side, Q3/Q4 below, etc.
   * @param index - zero-based position of the question in the list.
   * @returns '1' or '2' as a grid-column value.
   */
  questionGridColumn(index: number): string {
    return index % 2 === 0 ? '1' : '2';
  }

  /**
   * Row for the question grid layout, matching questionGridColumn.
   * @param index - zero-based position of the question in the list.
   * @returns the grid-row value as a string.
   */
  questionGridRow(index: number): string {
    return String(Math.floor(index / 2) + 1);
  }

  /**
   * Updates the survey title.
   * @param value - the new title text.
   */
  onTitleChange(value: string): void {
    this.title.set(value);
  }

  /** Opens or closes the category dropdown menu. */
  toggleCategoryMenu(): void {
    this.isCategoryMenuOpen.update((open) => !open);
  }

  /** Closes the category dropdown menu. */
  closeCategoryMenu(): void {
    this.isCategoryMenuOpen.set(false);
  }

  /**
   * Selects a category and closes the dropdown menu.
   * @param value - the chosen category name.
   */
  selectCategory(value: string): void {
    this.category.set(value);
    this.isCategoryMenuOpen.set(false);
  }

  /**
   * Updates the survey deadline.
   * @param value - the new deadline as an ISO date string (YYYY-MM-DD).
   */
  onDeadlineChange(value: string): void {
    this.deadline.set(value);
  }

  /**
   * Updates the survey description.
   * @param value - the new description text.
   */
  onDescriptionChange(value: string): void {
    this.description.set(value);
  }

  /** Clears only the value; the field itself stays visible (the whole row isn't hidden). */
  resetDeadline(): void {
    this.deadline.set('');
  }

  /** Clears only the value; the field itself stays visible (the whole row isn't hidden). */
  resetDescription(): void {
    this.description.set('');
  }

  /** Appends a new, empty question to the form. */
  addQuestion(): void {
    this.questions.update((qs) => [...qs, this.emptyQuestion()]);
  }

  /**
   * Removes the question at the given index.
   * @param index - zero-based position of the question to remove.
   */
  removeQuestion(index: number): void {
    this.questions.update((qs) => qs.filter((_, i) => i !== index));
  }

  /**
   * Question 1 (index 0) always just clears every input field in its block; later questions always remove the whole block.
   * @param index - zero-based position of the question whose trash icon was clicked.
   */
  onQuestionTrashClick(index: number): void {
    if (index === 0) {
      const current = this.questions()[0];
      this.patchQuestion(0, {
        questionText: '',
        options: current.options.map(() => ''),
      });
    } else {
      this.removeQuestion(index);
    }
  }

  /**
   * Updates the text of a question.
   * @param index - zero-based position of the question.
   * @param value - the new question text.
   */
  onQuestionTextChange(index: number, value: string): void {
    this.patchQuestion(index, { questionText: value });
  }

  /**
   * Toggles whether a question allows selecting more than one answer.
   * @param index - zero-based position of the question.
   */
  toggleAllowMultiple(index: number): void {
    const current = this.questions()[index];
    this.patchQuestion(index, { allowMultipleAnswers: !current.allowMultipleAnswers });
  }

  /**
   * Adds an answer option, up to a maximum of MAX_OPTIONS.
   * @param index - zero-based position of the question to add an option to.
   */
  addOption(index: number): void {
    const current = this.questions()[index].options;
    if (current.length >= MAX_OPTIONS) return;
    this.patchQuestion(index, { options: [...current, ''] });
  }

  /**
   * Removes an answer option from a question.
   * @param index - zero-based position of the question.
   * @param optionIndex - zero-based position of the option to remove.
   */
  removeOption(index: number, optionIndex: number): void {
    const options = this.questions()[index].options.filter((_, i) => i !== optionIndex);
    this.patchQuestion(index, { options });
  }

  /**
   * For the fixed A/B options (index < MIN_OPTIONS), just clears the text; for added options, removes the row.
   * @param index - zero-based position of the question.
   * @param optionIndex - zero-based position of the option whose trash icon was clicked.
   */
  onOptionTrashClick(index: number, optionIndex: number): void {
    if (optionIndex < MIN_OPTIONS) {
      const options = this.questions()[index].options.map((o, i) =>
        i === optionIndex ? '' : o,
      );
      this.patchQuestion(index, { options });
    } else {
      this.removeOption(index, optionIndex);
    }
  }

  /**
   * Updates the text of an answer option.
   * @param index - zero-based position of the question.
   * @param optionIndex - zero-based position of the option.
   * @param value - the new option text.
   */
  onOptionChange(index: number, optionIndex: number, value: string): void {
    const options = this.questions()[index].options.map((o, i) =>
      i === optionIndex ? value : o,
    );
    this.patchQuestion(index, { options });
  }

  /** Validates the form and triggers creating the survey. */
  async publish(): Promise<void> {
    if (!this.isValid()) {
      this.errorMessage.set('Bitte fülle alle Pflichtfelder aus.');
      return;
    }
    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    await this.trySubmit();
  }

  /** Hides the success overlay and navigates to the survey that was just created. */
  dismissPublishedToast(): void {
    this.showPublishedToast.set(false);
    this.router.navigate(['/surveys', this.createdSurveyId]);
  }

  /** Removes the locally saved form draft (after publish or cancel). */
  clearDraft(): void {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  }

  /** Creates the survey via the backend and shows the success overlay, or an error message on failure. */
  private async trySubmit(): Promise<void> {
    try {
      this.createdSurveyId = await this.surveyService.createSurvey(this.buildInput());
      this.clearDraft();
      this.showPublishedToast.set(true);
      setTimeout(() => this.dismissPublishedToast(), 2500);
    } catch {
      this.errorMessage.set('Umfrage konnte nicht erstellt werden. Versuch es erneut.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /** @returns the current form state mapped to the shape the backend expects. */
  private buildInput(): CreateSurveyInput {
    return {
      category: this.category(),
      title: this.title().trim(),
      description: this.description().trim() || undefined,
      deadline: this.deadline() ? new Date(this.deadline()) : undefined,
      questions: this.questions().map((q) => this.toQuestionInput(q)),
    };
  }

  /**
   * Trims and filters a question's form state into the backend's question input shape.
   * @param q - the question's current form state.
   * @returns the question input, with blank answer options removed.
   */
  private toQuestionInput(q: QuestionForm): CreateSurveyInput['questions'][number] {
    return {
      questionText: q.questionText.trim(),
      allowMultipleAnswers: q.allowMultipleAnswers,
      optionLabels: q.options.map((o) => o.trim()).filter((o) => o.length > 0),
    };
  }

  /**
   * Applies a partial update to the question at the given index.
   * @param index - zero-based position of the question to update.
   * @param patch - the fields to merge into that question.
   */
  private patchQuestion(index: number, patch: Partial<QuestionForm>): void {
    this.questions.update((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  /**
   * Checks whether a question has text and at least MIN_OPTIONS filled-in answers.
   * @param q - the question's current form state.
   * @returns true if the question satisfies the required fields.
   */
  private isQuestionValid(q: QuestionForm): boolean {
    const filledOptions = q.options.filter((o) => o.trim().length > 0);
    return q.questionText.trim().length > 0 && filledOptions.length >= MIN_OPTIONS;
  }

  /** @returns a fresh, empty question with the minimum number of blank answer options. */
  private emptyQuestion(): QuestionForm {
    return { questionText: '', allowMultipleAnswers: false, options: ['', ''] };
  }

  /** Mirrors the current form state into localStorage, triggered on every change. */
  private saveDraft(): void {
    const draft: DraftData = {
      category: this.category(),
      title: this.title(),
      deadline: this.deadline(),
      description: this.description(),
      questions: this.questions(),
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }

  /** @returns a previously saved draft, or an empty object if none exists. */
  private loadDraft(): Partial<DraftData> {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
}
