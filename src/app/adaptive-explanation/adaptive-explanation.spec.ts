import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdaptiveExplanation } from './adaptive-explanation';

describe('AdaptiveExplanation', () => {
  let component: AdaptiveExplanation;
  let fixture: ComponentFixture<AdaptiveExplanation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdaptiveExplanation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdaptiveExplanation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
