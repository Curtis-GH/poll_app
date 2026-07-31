import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { SurveyDetail } from './survey-detail';

describe('SurveyDetail', () => {
  let component: SurveyDetail;
  let fixture: ComponentFixture<SurveyDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurveyDetail],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'test-id' }) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SurveyDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
