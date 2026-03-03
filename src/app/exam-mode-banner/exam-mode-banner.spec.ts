import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamModeBanner } from './exam-mode-banner';

describe('ExamModeBanner', () => {
  let component: ExamModeBanner;
  let fixture: ComponentFixture<ExamModeBanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamModeBanner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamModeBanner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
