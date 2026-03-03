import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MockHistory } from './mock-history';

describe('MockHistory', () => {
  let component: MockHistory;
  let fixture: ComponentFixture<MockHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockHistory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MockHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
