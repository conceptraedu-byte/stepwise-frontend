import { TestBed } from '@angular/core/testing';

import { MockTest } from './mock-test';

describe('MockTest', () => {
  let service: MockTest;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MockTest);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
