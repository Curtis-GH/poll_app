import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SurveyService } from '../../core/services/survey';
import { SURVEY_CATEGORIES, Survey, SurveyStatus } from '../../models/survey.model';
import { SurveyCard } from '../../shared/components/survey-card/survey-card';

/** Homescreen: ending-soon highlights, a tab-filtered survey list, and category sorting. */
@Component({
  selector: 'app-survey-list',
  imports: [RouterLink, SurveyCard],
  templateUrl: './survey-list.html',
  styleUrl: './survey-list.scss',
})
export class SurveyList {
  private readonly surveyService = inject(SurveyService);

  readonly categories = SURVEY_CATEGORIES;

  readonly surveys = signal<Survey[]>([]);
  readonly isLoading = signal(true);
  readonly activeTab = signal<SurveyStatus>('ongoing');
  readonly selectedCategory = signal<string | null>(null);
  readonly isSortMenuOpen = signal(false);

  /** The 3 ongoing surveys with the nearest deadline (US1). */
  readonly endingSoonSurveys = computed(() =>
    this.surveys()
      .filter((survey) => survey.status === 'ongoing')
      .slice(0, 3),
  );

  /** Surveys filtered by the active tab, optionally sorted by category. */
  readonly visibleSurveys = computed(() => {
    const filtered = this.surveys().filter(
      (survey) => survey.status === this.activeTab(),
    );
    const category = this.selectedCategory();
    return category ? this.sortedByCategory(filtered, category) : filtered;
  });

  constructor() {
    this.loadSurveys();
  }

  /** Switches between "Active survey" and "Past survey". */
  setTab(tab: SurveyStatus): void {
    this.activeTab.set(tab);
  }

  toggleSortMenu(): void {
    this.isSortMenuOpen.update((open) => !open);
  }

  closeSortMenu(): void {
    this.isSortMenuOpen.set(false);
  }

  /** Selects a category to sort by; clicking the same category again clears the selection. */
  selectCategory(category: string): void {
    this.selectedCategory.set(this.selectedCategory() === category ? null : category);
    this.isSortMenuOpen.set(false);
  }

  private async loadSurveys(): Promise<void> {
    try {
      this.surveys.set(await this.surveyService.getSurveys());
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Moves matches of the selected category to the front; order is otherwise stable. */
  private sortedByCategory(surveys: Survey[], category: string): Survey[] {
    return [...surveys].sort((a) => (a.category === category ? -1 : 1));
  }
}
