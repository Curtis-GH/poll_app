import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SurveyService } from '../../core/services/survey';
import { CreateSurveyInput, SURVEY_CATEGORIES } from '../../models/survey.model';

interface QuestionForm {
  questionText: string;
  allowMultipleAnswers: boolean;
  options: string[];
}

@Component({
  selector: 'app-survey-create',
  imports: [RouterLink],
  templateUrl: './survey-create.html',
  styleUrl: './survey-create.scss',
})
export class SurveyCreate {
  private readonly surveyService = inject(SurveyService);
  private readonly router = inject(Router);

  readonly categories = SURVEY_CATEGORIES;

  readonly category = signal('');
  readonly title = signal('');
  readonly deadline = signal('');
  readonly description = signal('');
  readonly showDeadline = signal(true);
  readonly showDescription = signal(true);
  readonly questions = signal<QuestionForm[]>([this.emptyQuestion()]);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly isValid = computed(
    () =>
      this.title().trim().length > 0 &&
      this.category().length > 0 &&
      this.questions().every((q) => this.isQuestionValid(q)),
  );

  optionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  onTitleChange(value: string): void {
    this.title.set(value);
  }

  onCategoryChange(value: string): void {
    this.category.set(value);
  }

  onDeadlineChange(value: string): void {
    this.deadline.set(value);
  }

  onDescriptionChange(value: string): void {
    this.description.set(value);
  }

  removeDeadline(): void {
    this.showDeadline.set(false);
    this.deadline.set('');
  }

  removeDescription(): void {
    this.showDescription.set(false);
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
    const options = [...this.questions()[index].options, ''];
    this.patchQuestion(index, { options });
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

  private async trySubmit(): Promise<void> {
    try {
      await this.surveyService.createSurvey(this.buildInput());
      this.router.navigate(['/']);
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
}
