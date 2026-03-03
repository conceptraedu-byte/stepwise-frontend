import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiagnosisPanel } from './diagnosis-panel';

describe('DiagnosisPanel', () => {
  let component: DiagnosisPanel;
  let fixture: ComponentFixture<DiagnosisPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiagnosisPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiagnosisPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
