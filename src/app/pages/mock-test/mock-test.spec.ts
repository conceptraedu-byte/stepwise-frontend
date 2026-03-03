import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MockTest } from './mock-test';

describe('MockTest', () => {
  let component: MockTest;
  let fixture: ComponentFixture<MockTest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockTest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MockTest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
