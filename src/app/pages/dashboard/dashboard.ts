import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface ProgressResponse {
  total_tests: number;
  average_accuracy: number;
  best_score: number;
  last_score: number;
  improvement_rate: number;
  accuracy_history: number[];
  topic_mastery: Record<string, number>;
  streak_days?: number;
  tests_this_week?: number;
  best_score_context?: string;
  last_score_context?: string;
  user_name?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  /* ── Core stats ── */
  totalTests       = 0;
  averageAccuracy  = 0;
  bestScore        = 0;
  lastScore        = 0;
  improvementRate  = 0;
  streakDays       = 0;
  testsThisWeek    = 0;

  /* ── Context strings ── */
  bestScoreContext = '';
  lastScoreContext = '';
  userInitials     = 'U';

  /* ── Chart / mastery data ── */
  accuracyHistory: number[] = [];
  topicMastery: Record<string, number> = {};

  /* ── State ── */
  isLoading = true;
  hasError  = false;

  private readonly baseUrl = 'http://localhost:8000';

  /** Circumference of the SVG ring (2π × r=50) */
  private readonly CIRCUMFERENCE = 314;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadProgress();
  }

  /* ────────────────────────────────────────────────────────────────
     DATA LOADING
  ──────────────────────────────────────────────────────────────── */
  loadProgress(): void {
    const token = localStorage.getItem('access_token');

    if (!token) {
      console.warn('No auth token found — redirecting to login.');
      this.hasError = true;
      this.isLoading = false;
      return;
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get<ProgressResponse>(`${this.baseUrl}/progress`, { headers })
      .subscribe({
        next: (response) => this.applyResponse(response),
        error: (err) => {
          console.error('Failed to load progress:', err);
          this.hasError  = true;
          this.isLoading = false;
        }
      });
  }

  private applyResponse(response: ProgressResponse): void {
    this.totalTests       = response.total_tests       ?? 0;
    this.averageAccuracy  = response.average_accuracy  ?? 0;
    this.bestScore        = response.best_score        ?? 0;
    this.lastScore        = response.last_score        ?? 0;
    this.improvementRate  = response.improvement_rate  ?? 0;
    this.accuracyHistory  = response.accuracy_history  ?? [];
    this.topicMastery     = response.topic_mastery     ?? {};
    this.streakDays       = response.streak_days       ?? 0;
    this.testsThisWeek    = response.tests_this_week   ?? 0;
    this.bestScoreContext = response.best_score_context ?? '';
    this.lastScoreContext = response.last_score_context ?? '';

    if (response.user_name) {
      this.userInitials = response.user_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }

    this.isLoading = false;
  }

  /* ────────────────────────────────────────────────────────────────
     COMPUTED PROPERTIES — HERO
  ──────────────────────────────────────────────────────────────── */
  get heroHeading(): string {
    if (this.averageAccuracy >= 75) return "You're Exam Ready 🎯";
    if (this.averageAccuracy >= 50) return "Improving Consistently 📈";
    return "Time to Focus Up 💡";
  }

  /** CSS class applied to the status badge */
  get statusClass(): string {
    if (this.averageAccuracy >= 75) return 'ready';
    if (this.averageAccuracy >= 50) return 'improving';
    return 'focus';
  }

  get statusMessage(): string {
    if (this.averageAccuracy >= 75) return 'Strong accuracy — keep the momentum';
    if (this.averageAccuracy >= 50) return 'Getting better — push through the tough topics';
    return 'Targeted practice will turn this around';
  }

  /* ────────────────────────────────────────────────────────────────
     COMPUTED PROPERTIES — RADIAL RING
  ──────────────────────────────────────────────────────────────── */
  /**
   * stroke-dashoffset for the SVG ring.
   * 0 = full circle, CIRCUMFERENCE = empty.
   */
  get ringOffset(): number {
    const clamped = Math.min(100, Math.max(0, this.averageAccuracy));
    return this.CIRCUMFERENCE * (1 - clamped / 100);
  }

  /* ────────────────────────────────────────────────────────────────
     COMPUTED PROPERTIES — TREND CHART
  ──────────────────────────────────────────────────────────────── */
  /**
   * Returns bar height relative to the dataset max,
   * so bars always fill meaningful vertical space.
   * Minimum rendered height is 5% so very low values are still visible.
   */
  barHeight(value: number): number {
    const max = Math.max(...this.accuracyHistory, 1);
    return Math.max(5, (value / max) * 100);
  }

  /* ────────────────────────────────────────────────────────────────
     COMPUTED PROPERTIES — TOPIC MASTERY
  ──────────────────────────────────────────────────────────────── */
  get masteryKeys(): string[] {
    return Object.keys(this.topicMastery);
  }
}