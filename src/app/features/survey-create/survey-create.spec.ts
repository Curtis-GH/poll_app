import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SurveyCreate } from './survey-create';

describe('SurveyCreate', () => {
  let component: SurveyCreate;
  let fixture: ComponentFixture<SurveyCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurveyCreate],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SurveyCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
