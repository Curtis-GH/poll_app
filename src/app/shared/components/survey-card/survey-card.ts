import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Survey } from '../../../models/survey.model';
import { formatDeadlineLabel } from '../../utils/deadline.util';

/** Which visual style the survey card renders. */
export type SurveyCardVariant = 'highlight' | 'default';

/** Card summarizing a single survey, used in both the "Ending soon" and the full list. */
@Component({
  selector: 'app-survey-card',
  imports: [RouterLink],
  templateUrl: './survey-card.html',
  styleUrl: './survey-card.scss',
})
export class SurveyCard {
  /** The survey to display. */
  readonly survey = input.required<Survey>();
  /** 'highlight' for the "Ending soon" card, 'default' for the regular grid card. */
  readonly variant = input<SurveyCardVariant>('default');

  /** Display label for the deadline, e.g. "Ends in 3 Days". */
  readonly deadlineLabel = computed(() => formatDeadlineLabel(this.survey().deadline));
}
