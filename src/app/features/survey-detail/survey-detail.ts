import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SurveyService } from '../../core/services/survey';
import { SurveyDetail, SurveyOption, SurveyQuestion } from '../../models/survey.model';
import { formatDeadlineDate } from '../../shared/utils/deadline.util';

type SelectedOptions = Record<string, string[]>;

@Component({
  selector: 'app-survey-detail',
  imports: [RouterLink],
  templateUrl: './survey-detail.html',
  styleUrl: './survey-detail.scss',
})
export class SurveyDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly surveyService = inject(SurveyService);
  private readonly surveyId = this.route.snapshot.paramMap.get('id')!;

  readonly survey = signal<SurveyDetail | null>(null);
  readonly isLoading = signal(true);
  readonly hasVoted = signal(false);
  readonly isSubmitting = signal(false);
  readonly resultsExpanded = signal(true);
  readonly selectedOptionIds = signal<SelectedOptions>({});

  readonly canSubmit = computed(() => {
    const survey = this.survey();
    if (!survey) return false;
    return survey.questions.every((q) => (this.selectedOptionIds()[q.id] ?? []).length > 0);
  });

  constructor() {
    this.loadSurvey();
  }

  formatDate(deadline: Date): string {
    return formatDeadlineDate(deadline);
  }

  isSelected(questionId: string, optionId: string): boolean {
    return (this.selectedOptionIds()[questionId] ?? []).includes(optionId);
  }

  toggleOption(questionId: string, optionId: string, allowMultiple: boolean): void {
    this.selectedOptionIds.update((map) => {
      const current = map[questionId] ?? [];
      const next = allowMultiple ? this.toggleInArray(current, optionId) : [optionId];
      return { ...map, [questionId]: next };
    });
  }

  optionLetterFor(question: SurveyQuestion, option: SurveyOption): string {
    const index = question.options.findIndex((o) => o.id === option.id);
    return String.fromCharCode(65 + index);
  }

  percentFor(question: SurveyQuestion, option: SurveyOption): number {
    const total = question.options.reduce((sum, o) => sum + o.voteCount, 0);
    if (total === 0) return 0;
    return Math.round((option.voteCount / total) * 100);
  }

  toggleResults(): void {
    this.resultsExpanded.update((expanded) => !expanded);
  }

  async completeSurvey(): Promise<void> {
    if (!this.canSubmit() || this.isSubmitting()) return;
    this.isSubmitting.set(true);
    try {
      await this.castAllVotes();
      this.hasVoted.set(true);
      await this.loadSurvey();
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async castAllVotes(): Promise<void> {
    const allOptionIds = Object.values(this.selectedOptionIds()).flat();
    for (const optionId of allOptionIds) {
      await this.surveyService.castVote(optionId);
    }
  }

  private async loadSurvey(): Promise<void> {
    this.isLoading.set(true);
    try {
      this.survey.set(await this.surveyService.getSurveyById(this.surveyId));
    } finally {
      this.isLoading.set(false);
    }
  }

  private toggleInArray(arr: string[], id: string): string[] {
    return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
  }
}
