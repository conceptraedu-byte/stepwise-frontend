import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockTestService } from '../../services/mock-test';

interface MockHistoryItem {
  session_id: string;
  subject: string;
  class_level: number;
  chapter?: string;
  score: number;
  total: number;
  accuracy: number;
  completed_at: number;
}

@Component({
  selector: 'app-mock-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mock-history.html',
  styleUrl: './mock-history.css'
})
export class MockHistory implements OnInit {

  history: MockHistoryItem[] = [];
  isLoading = true;

  constructor(private mockService: MockTestService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.mockService.getMockHistory().subscribe({
      next: (res: MockHistoryItem[]) => {
        this.history = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load history', err);
        this.isLoading = false;
      }
    });
  }

  getAccuracyClass(acc: number): string {
    if (acc >= 75) return 'acc-high';
    if (acc >= 50) return 'acc-mid';
    return 'acc-low';
  }
}