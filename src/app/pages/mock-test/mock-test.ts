import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MockTestService, MockQuestion } from '../../services/mock-test';
import { Router } from '@angular/router';

interface DetailedResult {
  question: string;
  selectedAnswer: number;
  correctAnswer: number;
  correctOption: string;
  isCorrect: boolean;
  explanation?: string;
  topic?: string;
}

@Component({
  selector: 'app-mock-test',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './mock-test.html',
  styleUrl: './mock-test.css',
})
export class MockTest implements OnInit, OnDestroy {

  /* ================= CONFIG ================= */

  questionCount = 10;
  timeLimit     = 30;
  classLevel    = 10;
  subject       = 'Maths';
  chapter       = '';
  chapters: string[] = [];

  /* ================= STATE ================= */

  isTestStarted  = false;
  isTestFinished = false;
  isTimeUp       = false;
  isLoading      = false;

  remainingTime                = 0;
  private timerInterval: any  = null;

  sessionId: string ='';

  /* ================= DATA ================= */

  questions: MockQuestion[]     = [];
  selectedAnswers: number[]     = [];
  detailedResults: DetailedResult[] = [];
  weakTopics: string[]          = [];

  currentQuestionIndex = 0;
  score                = 0;

  /* ─────────────────────────────────────── */

  constructor(
    private mockService: MockTestService,
    private route: Router
  ) {}

  ngOnInit(): void {
    this.onSubjectChange();
    this.resumeSession();
  }

  /* ================= SUBJECT / CHAPTERS ================= */

  onSubjectChange(): void {
    this.chapter = '';

    const chapterMap: Record<string, string[]> = {
      Maths: [
        'Quadratic Equations',
        'Arithmetic Progressions',
        'Polynomials',
        'Coordinate Geometry',
        'Triangles',
        'Trigonometry',
        'Statistics',
        'Probability',
      ],
      Physics: [
        'Motion',
        'Laws of Motion',
        'Work and Energy',
        'Gravitation',
        'Light – Reflection & Refraction',
        'Electricity',
        'Magnetic Effects of Current',
      ],
    };

    this.chapters = chapterMap[this.subject] ?? [];
  }

  /* ================= PRESETS ================= */

  applyPreset(questions: number, time: number): void {
    this.questionCount = questions;
    this.timeLimit     = time;
  }

  /* ================= START ================= */

startTest(): void {

  this.resetState();
  this.isLoading = true;

  this.mockService
    .startMockSession(
      this.questionCount,
      this.timeLimit,
      this.subject,
      this.classLevel,
      this.chapter
    )
    .subscribe({
      next: (response) => {

        /* ================= STORE SESSION ================= */

        this.sessionId = response.session_id;

        /* ================= LOAD QUESTIONS ================= */

        this.questions = response.questions;

        this.selectedAnswers = this.questions.map(q =>
          response.selected_answers[q.id] ?? -1
        );

        this.currentQuestionIndex = response.current_question_index;

        /* ================= TIMER LOGIC ================= */

        // started_at is UNIX timestamp (seconds)
        const startedAtMs = response.started_at * 1000;
        const nowMs = Date.now();

        const elapsedSeconds = Math.floor((nowMs - startedAtMs) / 1000);

        this.remainingTime = Math.max(
          response.duration - elapsedSeconds,
          0
        );

        /* ================= HANDLE EXPIRED ================= */

        if (this.remainingTime <= 0) {
          this.isLoading = false;
          this.autoSubmit();
          return;
        }

        this.startTimer();

        this.isTestStarted = true;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to start mock session:', err);
        this.isLoading = false;
      },
    });
}

/*  Resume session */

private resumeSession(): void {

  this.mockService.resumeMockSession().subscribe({
    next: (response: any) => {

      if (!response.active) return;

      this.questions = response.questions;

      this.selectedAnswers = this.questions.map(q =>
        response.selected_answers[q.id] ?? -1
      );

      this.currentQuestionIndex = response.current_question_index;

      const nowSec = Math.floor(Date.now() / 1000);
      const elapsed = nowSec - response.started_at;

      this.remainingTime = response.duration - elapsed;

      this.isTestStarted = true;
      this.startTimer();
    },
    error: (err) => {
      console.error("Resume failed:", err);
    }
  });
}
/* ================= RESET ================= */

  resetState(): void {
    this.clearTimer();

    this.isTestStarted       = false;
    this.isTestFinished      = false;
    this.isTimeUp            = false;
    this.currentQuestionIndex = 0;
    this.score               = 0;
    this.questions           = [];
    this.selectedAnswers     = [];
    this.detailedResults     = [];
    this.weakTopics          = [];
  }

  /* ================= TIMER ================= */

  private startTimer(): void {
    this.clearTimer();

    this.timerInterval = setInterval(() => {
      if (this.remainingTime > 0) {
        this.remainingTime--;
      } else {
        this.autoSubmit();
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private autoSubmit(): void {
    this.clearTimer();
    this.isTimeUp = true;

    setTimeout(() => this.finishTest(), 1500);
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' + s : s}`;
  }

  /* ================= NAVIGATION ================= */

  get currentQuestion(): MockQuestion {
    return this.questions[this.currentQuestionIndex];
  }

 selectOption(index: number): void {

  this.selectedAnswers[this.currentQuestionIndex] = index;

  const questionId = this.questions[this.currentQuestionIndex].id;

  this.mockService
    .saveAnswer(
      this.sessionId,
      questionId,
      index,
      this.currentQuestionIndex
    )
    .subscribe({
      error: (err) => {
        console.error('Auto-save failed', err);
      }
    });
}

goNext(): void {

  const questionId = this.questions[this.currentQuestionIndex].id;

  this.mockService
    .saveAnswer(
      this.sessionId,
      questionId,
      this.selectedAnswers[this.currentQuestionIndex],
      this.currentQuestionIndex
    )
    .subscribe();

  if (this.currentQuestionIndex + 1 >= this.questions.length) {
    this.finishTest();
    return;
  }

  this.currentQuestionIndex++;
}

  goPrevious(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  /* ================= FINISH ================= */

finishTest(): void {

  this.clearTimer();

  const answers: Record<string, number> = {};

  this.questions.forEach((q, i) => {
    answers[q.id] = this.selectedAnswers[i];
  });

  this.isLoading = true;

  this.mockService
    .submitMockTest({
      session_id: this.sessionId,
      answers: answers
    })
    .subscribe({
      next: (response) => {

        this.score = response.score;
        this.detailedResults = response.results;

        this.calculateWeakTopics();

        this.isTestStarted = false;
        this.isTestFinished = true;
        this.isLoading = false;

        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        console.error('Submit failed:', err);
        this.isLoading = false;
      }
    });
}

  /* ================= ANALYSIS ================= */

  private calculateWeakTopics(): void {
    const map: Record<string, { total: number; wrong: number }> = {};

    this.detailedResults.forEach((r) => {
      const topic = r.topic ?? 'General';
      if (!map[topic]) map[topic] = { total: 0, wrong: 0 };
      map[topic].total++;
      if (!r.isCorrect) map[topic].wrong++;
    });

    this.weakTopics = Object.keys(map)
      .filter((t) => map[t].wrong > 0)
      .sort((a, b) => map[b].wrong - map[a].wrong);
  }

  /* ================= METRICS ================= */

  get accuracy(): number {
    return this.questions.length
      ? Math.round((this.score / this.questions.length) * 100)
      : 0;
  }

  get attemptedCount(): number {
    return this.selectedAnswers.filter((a) => a !== -1).length;
  }

  /* ================= RESET / ROUTE ================= */

  resetTest(): void {
    this.route.navigate(['/dashboard']);
  }

    /* ================= mock hstory ================= */

    mockhistory(){
      this.route.navigate(['/mock-history']);
    }

  /* ================= CLEANUP ================= */

  ngOnDestroy(): void {
    this.clearTimer();
  }
}