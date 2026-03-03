import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LearnEntryPanel } from './learn-entry-panel';

describe('LearnEntryPanel', () => {
  let component: LearnEntryPanel;
  let fixture: ComponentFixture<LearnEntryPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LearnEntryPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LearnEntryPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
