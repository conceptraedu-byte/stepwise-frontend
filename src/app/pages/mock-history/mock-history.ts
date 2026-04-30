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
  styleUrls: ['./mock-history.css']
})
export class MockHistory implements OnInit {

  history: MockHistoryItem[] = [];

  /* ===== INSIGHTS ===== */

  lastAccuracy = 0;
  averageAccuracy = 0;
  bestAccuracy = 0;
  improvement = 0;
  streakDays = 0;
  totalTests = 0;

  /* Trend chart data */

  accuracyHistory: number[] = [];

  isLoading = true;

  constructor(private mockService: MockTestService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  /* ===============================
     LOAD HISTORY
  =============================== */

  loadHistory(): void {

    this.mockService.getMockHistory().subscribe({

      next: (res: MockHistoryItem[]) => {

        /* Sort newest first */

        this.history = res.sort(
          (a, b) => b.completed_at - a.completed_at
        );

        this.totalTests = this.history.length;

        /* Extract last 10 accuracy values */

        this.accuracyHistory = this.history
          .slice(0, 10)
          .map(h => Number(h.accuracy))
          .reverse();

        /* ===== INSIGHTS ===== */

        if (this.accuracyHistory.length > 0) {

          this.lastAccuracy =
            this.accuracyHistory[this.accuracyHistory.length - 1];

          this.bestAccuracy =
            Math.max(...this.accuracyHistory);

          const sum =
            this.accuracyHistory.reduce((a,b) => a + b, 0);

          this.averageAccuracy =
            Math.round(sum / this.accuracyHistory.length);

          if (this.accuracyHistory.length >= 2) {

            const last =
              this.accuracyHistory[this.accuracyHistory.length - 1];

            const previous =
              this.accuracyHistory[this.accuracyHistory.length - 2];

            this.improvement = last - previous;

          }

        }

        /* ===== STUDY STREAK ===== */

        this.calculateStreak();

        this.isLoading = false;

      },

      error: (err) => {

        console.error("Failed to load history", err);
        this.isLoading = false;

      }

    });

  }

  /* ===============================
     STUDY STREAK
  =============================== */

  calculateStreak(): void {

    if (!this.history.length) return;

    let streak = 0;

    const today = new Date();

    for (let item of this.history) {

      const testDate = new Date(item.completed_at * 1000);

      const diff =
        Math.floor(
          (today.getTime() - testDate.getTime()) /
          (1000 * 60 * 60 * 24)
        );

      if (diff === streak) {
        streak++;
      } else {
        break;
      }

    }

    this.streakDays = streak;

  }

  /* ===============================
     ACCURACY CLASS
  =============================== */

  getAccuracyClass(acc: number): string {

    if (acc >= 75) return 'acc-high';
    if (acc >= 50) return 'acc-mid';

    return 'acc-low';

  }

  /* ===============================
     TREND BAR HEIGHT
  =============================== */

  getBarHeight(value: number): number {
    return Math.max(value, 8);
  }

}