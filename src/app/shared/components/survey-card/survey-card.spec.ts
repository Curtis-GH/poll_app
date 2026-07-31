import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SurveyCard } from './survey-card';
import { Survey } from '../../../models/survey.model';

const TEST_SURVEY: Survey = {
  id: '1',
  category: 'Team Activities',
  title: 'Test Survey',
  deadline: new Date('2100-01-01'),
  status: 'ongoing',
};

describe('SurveyCard', () => {
  let component: SurveyCard;
  let fixture: ComponentFixture<SurveyCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurveyCard],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SurveyCard);
    fixture.componentRef.setInput('survey', TEST_SURVEY);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
