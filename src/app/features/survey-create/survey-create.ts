import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SurveyService } from '../../core/services/survey';
import { CreateSurveyInput, SURVEY_CATEGORIES } from '../../models/survey.model';

interface QuestionForm {
  questionText: string;
  allowMultipleAnswers: boolean;
  options: string[];
}

interface DraftData {
  category: string;
  title: string;
  deadline: string;
  description: string;
  questions: QuestionForm[];
}

const MAX_OPTIONS = 6;
const DRAFT_STORAGE_KEY = 'poll-app:survey-draft';

@Component({
  selector: 'app-survey-create',
  imports: [RouterLink],
  templateUrl: './survey-create.html',
  styleUrl: './survey-create.scss',
})
export class SurveyCreate {
  private readonly surveyService = inject(SurveyService);
  private readonly router = inject(Router);
  private readonly draft = this.loadDraft();

  readonly categories = SURVEY_CATEGORIES;
  readonly maxOptions = MAX_OPTIONS;

  readonly category = signal(this.draft.category ?? '');
  readonly title = signal(this.draft.title ?? '');
  readonly deadline = signal(this.draft.deadline ?? '');
  readonly description = signal(this.draft.description ?? '');
  readonly questions = signal<QuestionForm[]>(this.draft.questions ?? [this.emptyQuestion()]);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPublishedToast = signal(false);
  readonly isCategoryMenuOpen = signal(false);

  readonly isValid = computed(
    () =>
      this.title().trim().length > 0 &&
      this.category().length > 0 &&
      this.questions().every((q) => this.isQuestionValid(q)),
  );

  constructor() {
    effect(() => this.saveDraft());
  }

  optionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  questionGridColumn(index: number): string {
    return index % 2 === 0 ? '1' : '2';
  }

  questionGridRow(index: number): string {
    return String(Math.floor(index / 2) + 1);
  }

  onTitleChange(value: string): void {
    this.title.set(value);
  }

  toggleCategoryMenu(): void {
    this.isCategoryMenuOpen.update((open) => !open);
  }

  closeCategoryMenu(): void {
    this.isCategoryMenuOpen.set(false);
  }

  selectCategory(value: string): void {
    this.category.set(value);
    this.isCategoryMenuOpen.set(false);
  }

  onDeadlineChange(value: string): void {
    this.deadline.set(value);
  }

  onDescriptionChange(value: string): void {
    this.description.set(value);
  }

  resetDeadline(): void {
    this.deadline.set('');
  }

  resetDescription(): void {
    this.description.set('');
  }

  addQuestion(): void {
    this.questions.update((qs) => [...qs, this.emptyQuestion()]);
  }

  removeQuestion(index: number): void {
    this.questions.update((qs) => qs.filter((_, i) => i !== index));
  }

  onQuestionTextChange(index: number, value: string): void {
    this.patchQuestion(index, { questionText: value });
  }

  toggleAllowMultiple(index: number): void {
    const current = this.questions()[index];
    this.patchQuestion(index, { allowMultipleAnswers: !current.allowMultipleAnswers });
  }

  addOption(index: number): void {
    const current = this.questions()[index].options;
    if (current.length >= MAX_OPTIONS) return;
    this.patchQuestion(index, { options: [...current, ''] });
  }

  removeOption(index: number, optionIndex: number): void {
    const options = this.questions()[index].options.filter((_, i) => i !== optionIndex);
    this.patchQuestion(index, { options });
  }

  onOptionChange(index: number, optionIndex: number, value: string): void {
    const options = this.questions()[index].options.map((o, i) =>
      i === optionIndex ? value : o,
    );
    this.patchQuestion(index, { options });
  }

  async publish(): Promise<void> {
    if (!this.isValid()) {
      this.errorMessage.set('Bitte fülle alle Pflichtfelder aus.');
      return;
    }
    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    await this.trySubmit();
  }

  dismissPublishedToast(): void {
    this.showPublishedToast.set(false);
    this.router.navigate(['/']);
  }

  clearDraft(): void {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  }

  private async trySubmit(): Promise<void> {
    try {
      await this.surveyService.createSurvey(this.buildInput());
      this.clearDraft();
      this.showPublishedToast.set(true);
      setTimeout(() => this.dismissPublishedToast(), 2500);
    } catch {
      this.errorMessage.set('Umfrage konnte nicht erstellt werden. Versuch es erneut.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private buildInput(): CreateSurveyInput {
    return {
      category: this.category(),
      title: this.title().trim(),
      description: this.description().trim() || undefined,
      deadline: this.deadline() ? new Date(this.deadline()) : undefined,
      questions: this.questions().map((q) => this.toQuestionInput(q)),
    };
  }

  private toQuestionInput(q: QuestionForm): CreateSurveyInput['questions'][number] {
    return {
      questionText: q.questionText.trim(),
      allowMultipleAnswers: q.allowMultipleAnswers,
      optionLabels: q.options.map((o) => o.trim()).filter((o) => o.length > 0),
    };
  }

  private patchQuestion(index: number, patch: Partial<QuestionForm>): void {
    this.questions.update((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  private isQuestionValid(q: QuestionForm): boolean {
    const filledOptions = q.options.filter((o) => o.trim().length > 0);
    return q.questionText.trim().length > 0 && filledOptions.length >= 2;
  }

  private emptyQuestion(): QuestionForm {
    return { questionText: '', allowMultipleAnswers: false, options: ['', ''] };
  }

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

  private loadDraft(): Partial<DraftData> {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
}
