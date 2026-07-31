import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Survey } from '../../../models/survey.model';
import { formatDeadlineLabel } from '../../utils/deadline.util';

export type SurveyCardVariant = 'highlight' | 'default';

@Component({
  selector: 'app-survey-card',
  imports: [RouterLink],
  templateUrl: './survey-card.html',
  styleUrl: './survey-card.scss',
})
export class SurveyCard {
  readonly survey = input.required<Survey>();
  /** 'highlight' fuer die helle "Ending soon"-Karte, 'default' fuer die normale Grid-Karte. */
  readonly variant = input<SurveyCardVariant>('default');

  /** Anzeige-Label fuer die Deadline, z.B. "Ends in 3 Days". */
  readonly deadlineLabel = computed(() => formatDeadlineLabel(this.survey().deadline));
}
