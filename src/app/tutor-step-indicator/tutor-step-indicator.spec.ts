import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TutorStepIndicator } from './tutor-step-indicator';

describe('TutorStepIndicator', () => {
  let component: TutorStepIndicator;
  let fixture: ComponentFixture<TutorStepIndicator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TutorStepIndicator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TutorStepIndicator);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
