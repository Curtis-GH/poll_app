import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/survey-list/survey-list').then((m) => m.SurveyList),
  },
];
