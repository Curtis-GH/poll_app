import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SurveyService } from '../../core/services/survey';
import { SurveyDetails, SurveyOption, SurveyQuestion } from '../../models/survey.model';
import { formatDeadlineDate } from '../../shared/utils/deadline.util';

type SelectedOptions = Record<string, string[]>;

const VOTED_SURVEYS_STORAGE_KEY = 'poll-app:voted-surveys';

/** Char code of 'A', used as the base for lettering answer options (A, B, C, ...). */
const OPTION_LETTER_BASE_CHAR_CODE = 65;

/** Detail/voting view of a single survey: lets the user vote and shows live results. */
@Component({
  selector: 'app-survey-detail',
  imports: [RouterLink],
  templateUrl: './survey-detail.html',
  styleUrl: './survey-detail.scss',
})
export class SurveyDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly surveyService = inject(SurveyService);
  private readonly surveyId = this.route.snapshot.paramMap.get('id')!;

  readonly survey = signal<SurveyDetails | null>(null);
  readonly isLoading = signal(true);
  readonly hasVoted = signal(this.hasAlreadyVoted(this.surveyId));
  readonly isSubmitting = signal(false);
  readonly resultsExpanded = signal(true);
  readonly selectedOptionIds = signal<SelectedOptions>({});

  /** True once every question has at least one selected answer. */
  readonly canSubmit = computed(() => {
    const survey = this.survey();
    if (!survey) return false;
    return survey.questions.every((q) => (this.selectedOptionIds()[q.id] ?? []).length > 0);
  });

  constructor() {
    this.loadSurvey();
  }

  /** Formats a deadline for display, e.g. "Ends on 01.09.2025". */
  formatDate(deadline: Date): string {
    return formatDeadlineDate(deadline);
  }

  /** True if the given option is currently selected for the given question. */
  isSelected(questionId: string, optionId: string): boolean {
    return (this.selectedOptionIds()[questionId] ?? []).includes(optionId);
  }

  /** Selects an answer option; toggles it if multiple answers are allowed, otherwise replaces the selection. */
  toggleOption(questionId: string, optionId: string, allowMultiple: boolean): void {
    this.selectedOptionIds.update((map) => {
      const current = map[questionId] ?? [];
      const next = allowMultiple ? this.toggleInArray(current, optionId) : [optionId];
      return { ...map, [questionId]: next };
    });
  }

  /** Derives the option letter (A, B, C, ...) from its position within the question. */
  optionLetterFor(question: SurveyQuestion, option: SurveyOption): string {
    const index = question.options.findIndex((o) => o.id === option.id);
    return String.fromCharCode(OPTION_LETTER_BASE_CHAR_CODE + index);
  }

  /** Vote share for the option in percent, rounded, 0 if there are no votes yet. */
  percentFor(question: SurveyQuestion, option: SurveyOption): number {
    const total = question.options.reduce((sum, o) => sum + o.voteCount, 0);
    if (total === 0) return 0;
    return Math.round((option.voteCount / total) * 100);
  }

  /** Expands or collapses the live results panel. */
  toggleResults(): void {
    this.resultsExpanded.update((expanded) => !expanded);
  }

  /** Casts all selected votes and reloads the survey so the results are live. */
  async completeSurvey(): Promise<void> {
    if (!this.canSubmit() || this.isSubmitting()) return;
    this.isSubmitting.set(true);
    try {
      await this.castAllVotes();
      this.markAsVoted(this.surveyId);
      this.hasVoted.set(true);
      await this.loadSurvey();
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /** Casts a vote for every currently selected option. */
  private async castAllVotes(): Promise<void> {
    const allOptionIds = Object.values(this.selectedOptionIds()).flat();
    for (const optionId of allOptionIds) {
      await this.surveyService.castVote(optionId);
    }
  }

  /** Loads the survey (including questions, options and vote counts) from the backend. */
  private async loadSurvey(): Promise<void> {
    this.isLoading.set(true);
    try {
      this.survey.set(await this.surveyService.getSurveyById(this.surveyId));
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Adds the id to the array if absent, otherwise removes it. */
  private toggleInArray(arr: string[], id: string): string[] {
    return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
  }

  /** Checks whether this browser has already voted on the given survey. */
  private hasAlreadyVoted(surveyId: string): boolean {
    return this.readVotedSurveyIds().includes(surveyId);
  }

  /** Persistently remembers (via localStorage) that this survey has been voted on. */
  private markAsVoted(surveyId: string): void {
    const votedIds = this.readVotedSurveyIds();
    if (votedIds.includes(surveyId)) return;
    localStorage.setItem(
      VOTED_SURVEYS_STORAGE_KEY,
      JSON.stringify([...votedIds, surveyId]),
    );
  }

  /** Reads the list of survey ids this browser has already voted on. */
  private readVotedSurveyIds(): string[] {
    try {
      const raw = localStorage.getItem(VOTED_SURVEYS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
