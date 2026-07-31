import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SurveyService } from '../../core/services/survey';
import { SURVEY_CATEGORIES, Survey, SurveyStatus } from '../../models/survey.model';
import { SurveyCard } from '../../shared/components/survey-card/survey-card';

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

  /** Die 3 laufenden Umfragen mit der naechsten Deadline (US1). */
  readonly endingSoonSurveys = computed(() =>
    this.surveys()
      .filter((survey) => survey.status === 'ongoing')
      .slice(0, 3),
  );

  /** Umfragen gefiltert nach aktivem Tab, optional nach Kategorie sortiert. */
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

  /** Wechselt zwischen "Active survey" und "Past survey". */
  setTab(tab: SurveyStatus): void {
    this.activeTab.set(tab);
  }

  toggleSortMenu(): void {
    this.isSortMenuOpen.update((open) => !open);
  }

  closeSortMenu(): void {
    this.isSortMenuOpen.set(false);
  }

  /** Waehlt eine Kategorie zum Sortieren aus; erneuter Klick hebt die Auswahl auf. */
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

  /** Stellt Treffer der gewaehlten Kategorie an den Anfang, Reihenfolge sonst stabil. */
  private sortedByCategory(surveys: Survey[], category: string): Survey[] {
    return [...surveys].sort((a) => (a.category === category ? -1 : 1));
  }
}
