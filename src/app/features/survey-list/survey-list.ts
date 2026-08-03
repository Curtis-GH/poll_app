import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SurveyService } from '../../core/services/survey';
import { SURVEY_CATEGORIES, Survey, SurveyStatus } from '../../models/survey.model';
import { SurveyCard } from '../../shared/components/survey-card/survey-card';

/** Homescreen: ending-soon highlights, a tab-filtered survey list, and category filtering. */
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

  /** Surveys filtered by the active tab and, if set, restricted to the selected category. */
  readonly visibleSurveys = computed(() => {
    const filtered = this.surveys().filter(
      (survey) => survey.status === this.activeTab(),
    );
    const category = this.selectedCategory();
    return category ? filtered.filter((survey) => survey.category === category) : filtered;
  });

  constructor() {
    this.loadSurveys();
  }

  /**
   * Switches between "Active survey" and "Past survey".
   * @param tab - the tab to switch to.
   */
  setTab(tab: SurveyStatus): void {
    this.activeTab.set(tab);
  }

  /** Opens or closes the category sort menu. */
  toggleSortMenu(): void {
    this.isSortMenuOpen.update((open) => !open);
  }

  /** Closes the category sort menu. */
  closeSortMenu(): void {
    this.isSortMenuOpen.set(false);
  }

  /**
   * Selects a category to filter by; clicking the same category again clears the selection.
   * @param category - the category that was clicked.
   */
  selectCategory(category: string): void {
    this.selectedCategory.set(this.selectedCategory() === category ? null : category);
    this.isSortMenuOpen.set(false);
  }

  /** Loads all surveys from the backend into the `surveys` signal. */
  private async loadSurveys(): Promise<void> {
    try {
      this.surveys.set(await this.surveyService.getSurveys());
    } finally {
      this.isLoading.set(false);
    }
  }
}
