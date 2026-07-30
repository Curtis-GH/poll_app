import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SurveyService } from '../../core/services/survey';
import { Survey, SurveyStatus } from '../../models/survey.model';
import { SurveyCard } from '../../shared/components/survey-card/survey-card';

@Component({
  selector: 'app-survey-list',
  imports: [RouterLink, SurveyCard],
  templateUrl: './survey-list.html',
  styleUrl: './survey-list.scss',
})
export class SurveyList {
  private readonly surveyService = inject(SurveyService);

  readonly surveys = signal<Survey[]>([]);
  readonly isLoading = signal(true);
  readonly activeTab = signal<SurveyStatus>('ongoing');
  readonly sortByCategory = signal(false);

  readonly endingSoonSurveys = computed(() =>
    this.surveys()
      .filter((survey) => survey.status === 'ongoing')
      .slice(0, 3),
  );

  readonly visibleSurveys = computed(() => {
    const filtered = this.surveys().filter(
      (survey) => survey.status === this.activeTab(),
    );
    return this.sortByCategory() ? this.sortedByCategory(filtered) : filtered;
  });

  constructor() {
    this.loadSurveys();
  }

  setTab(tab: SurveyStatus): void {
    this.activeTab.set(tab);
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.sortByCategory.set(value === 'category');
  }

  private async loadSurveys(): Promise<void> {
    try {
      this.surveys.set(await this.surveyService.getSurveys());
    } finally {
      this.isLoading.set(false);
    }
  }

  private sortedByCategory(surveys: Survey[]): Survey[] {
    return [...surveys].sort((a, b) => a.category.localeCompare(b.category));
  }
}
