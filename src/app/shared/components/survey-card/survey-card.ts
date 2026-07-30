import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Survey } from '../../../models/survey.model';

export type SurveyCardVariant = 'highlight' | 'default';

@Component({
  selector: 'app-survey-card',
  imports: [RouterLink],
  templateUrl: './survey-card.html',
  styleUrl: './survey-card.scss',
})
export class SurveyCard {
  readonly survey = input.required<Survey>();
  readonly variant = input<SurveyCardVariant>('default');

  readonly deadlineLabel = computed(() => this.formatDeadline(this.survey().deadline));

  private formatDeadline(deadline: Date): string {
    const daysLeft = this.daysUntil(deadline);
    if (daysLeft <= 0) return 'Ended';
    if (daysLeft === 1) return 'Ends in 1 Day';
    return `Ends in ${daysLeft} Days`;
  }

  private daysUntil(deadline: Date): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.ceil((deadline.getTime() - Date.now()) / msPerDay);
  }
}
