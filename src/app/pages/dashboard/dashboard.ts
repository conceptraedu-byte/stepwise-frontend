import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

/* ═════════════════════════════════════════════════════════════
   INTERFACES
   ═════════════════════════════════════════════════════════════ */

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

interface LearningInsights {
  learning_velocity: number;
  difficulty_strength: Record<string, number>;
  weakest_topic: string | null;
  strongest_topic: string | null;
  recommended_topic: string | null;
}

/* ═════════════════════════════════════════════════════════════
   COMPONENT
   ═════════════════════════════════════════════════════════════ */

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  /* ─────────────────────────────────────────────
     CORE STATS
  ───────────────────────────────────────────── */
  totalTests = 0;
  averageAccuracy = 0;
  bestScore = 0;
  lastScore = 0;
  improvementRate = 0;
  streakDays = 0;
  testsThisWeek = 0;

  /* ─────────────────────────────────────────────
     CONTEXT STRINGS
  ───────────────────────────────────────────── */
  bestScoreContext = '';
  lastScoreContext = '';
  userInitials = 'U';

  /* ─────────────────────────────────────────────
     DATA COLLECTIONS
  ───────────────────────────────────────────── */
  accuracyHistory: number[] = [];
  topicMastery: Record<string, number> = {};

  /* ─────────────────────────────────────────────
     AI GUIDANCE DATA
  ───────────────────────────────────────────── */
  recommendedTopic: string | null = null;
  weakTopics: string[] = [];
  recentTopics: string[] = [];

  /* ─────────────────────────────────────────────
     NEW ANALYTICS DATA
  ───────────────────────────────────────────── */
  learningVelocity = 0;
  difficultyStrength: Record<string, number> = {};
  strongestTopic: string | null = null;

  /* ─────────────────────────────────────────────
     STATE
  ───────────────────────────────────────────── */
  isLoading = true;
  hasError = false;

  /* ─────────────────────────────────────────────
     CONFIGURATION
  ───────────────────────────────────────────── */
  private readonly baseUrl = 'http://localhost:8000';
  private readonly CIRCUMFERENCE = 314; // 2πr where r=50

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadProgress();
    this.loadLearningInsights();
  }

  /* ═════════════════════════════════════════════════════════════
     DATA LOADING METHODS
     ═════════════════════════════════════════════════════════════ */

  /**
   * Load progress data from backend
   */
  private loadProgress(): void {
    const token = localStorage.getItem('access_token');

    if (!token) {
      console.warn('No auth token found');
      this.hasError = true;
      this.isLoading = false;
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get<ProgressResponse>(`${this.baseUrl}/progress`, { headers })
      .subscribe({
        next: (response) => this.applyProgressResponse(response),
        error: (err) => {
          console.error('Failed to load progress:', err);
          this.hasError = true;
          this.isLoading = false;
        }
      });
  }

  /**
   * Load learning insights from backend
   */
  private loadLearningInsights(): void {
    const token = localStorage.getItem('access_token');

    if (!token) {
      console.warn('No auth token for learning insights');
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get<LearningInsights>(`${this.baseUrl}/analytics/learning-insights`, { headers })
      .subscribe({
        next: (data) => this.applyInsightsResponse(data),
        error: (err) => console.error('Learning insights failed:', err)
      });
  }

  /* ═════════════════════════════════════════════════════════════
     RESPONSE PROCESSING
     ═════════════════════════════════════════════════════════════ */

  /**
   * Process progress API response
   */
  private applyProgressResponse(response: ProgressResponse): void {
    // Core metrics
    this.totalTests = response.total_tests ?? 0;
    this.averageAccuracy = response.average_accuracy ?? 0;
    this.bestScore = response.best_score ?? 0;
    this.lastScore = response.last_score ?? 0;
    this.improvementRate = response.improvement_rate ?? 0;

    // History & mastery
    this.accuracyHistory = response.accuracy_history ?? [];
    this.topicMastery = response.topic_mastery ?? {};

    // Additional context
    this.streakDays = response.streak_days ?? 0;
    this.testsThisWeek = response.tests_this_week ?? 0;
    this.bestScoreContext = response.best_score_context ?? '';
    this.lastScoreContext = response.last_score_context ?? '';

    // Extract user initials
    if (response.user_name) {
      this.userInitials = response.user_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }

    // Compute weak topics (score < 50)
    this.weakTopics = Object.entries(this.topicMastery)
      .filter(([_, score]) => score < 50)
      .map(([topic]) => topic)
      .slice(0, 3);

    // Set recommended topic if not already set by insights
    if (!this.recommendedTopic && this.weakTopics.length > 0) {
      this.recommendedTopic = this.weakTopics[0];
    }

    // Recent topics
    this.recentTopics = Object.keys(this.topicMastery).slice(0, 5);

    this.isLoading = false;
  }

  /**
   * Process learning insights API response
   */
  private applyInsightsResponse(data: LearningInsights): void {
    this.learningVelocity = data.learning_velocity ?? 0;
    this.difficultyStrength = data.difficulty_strength ?? {};
    this.strongestTopic = data.strongest_topic ?? null;

    // Override recommended topic if insights provide one
    if (!this.recommendedTopic && data.recommended_topic) {
      this.recommendedTopic = data.recommended_topic;
    }
  }

  /* ═════════════════════════════════════════════════════════════
     COMPUTED PROPERTIES
     ═════════════════════════════════════════════════════════════ */

  /**
   * Generate hero heading based on accuracy
   */
  get heroHeading(): string {
    if (this.averageAccuracy >= 75) {
      return "You're Exam Ready 🎯";
    }
    if (this.averageAccuracy >= 50) {
      return "Improving Consistently 📈";
    }
    return "Time to Focus Up 💡";
  }

  /**
   * Get status badge CSS class
   */
  get statusClass(): string {
    if (this.averageAccuracy >= 75) return 'ready';
    if (this.averageAccuracy >= 50) return 'improving';
    return 'critical';
  }

  /**
   * Get status message based on accuracy
   */
  get statusMessage(): string {
    if (this.averageAccuracy >= 75) {
      return 'Strong accuracy — keep the momentum';
    }
    if (this.averageAccuracy >= 50) {
      return 'Getting better — push through the tough topics';
    }
    return 'Targeted practice will turn this around';
  }

  /**
   * Calculate SVG ring dash offset for accuracy ring
   */
  get ringOffset(): number {
    const clamped = Math.min(100, Math.max(0, this.averageAccuracy));
    return this.CIRCUMFERENCE * (1 - clamped / 100);
  }

  /**
   * Calculate bar height for trend chart (0-100%)
   */
  barHeight(value: number): number {
    if (this.accuracyHistory.length === 0) return 5;
    const max = Math.max(...this.accuracyHistory, 1);
    return Math.max(5, (value / max) * 100);
  }

  /**
   * Get array of topic keys for *ngFor iteration
   */
  get masteryKeys(): string[] {
    return Object.keys(this.topicMastery);
  }

  /* ═════════════════════════════════════════════════════════════
     USER ACTIONS
     ═════════════════════════════════════════════════════════════ */

  /**
   * Handle practice button click for a topic
   * TODO: Connect to tutor workspace router
   */
practiceTopic(topic: string): void {

  if (!topic) return;

  this.router.navigate(
    ['/tutor'],
    {
      queryParams: {
        topic: topic,
        mode: 'practice'
      }
    }
  );

}

}