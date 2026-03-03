import {
  Component,
  ElementRef,
  ViewChild,
  Output,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../services/chat.service';

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  metadata?: any;
}

@Component({
  selector: 'app-chat-area',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-area.html',
  styleUrls: ['./chat-area.css']
})
export class ChatAreaComponent implements OnChanges {

  constructor(private chatService: ChatService) {}

  /* =======================================================
     VIEWCHILD
  ======================================================= */

  @ViewChild('chatBody') chatBody!: ElementRef<HTMLDivElement>;

  /* =======================================================
     INPUTS / OUTPUTS
  ======================================================= */

  @Input() practiceMode = false;
  @Input() initialQuestion: string | null = null;
  @Input() diagnosis: string | null = null;

  @Output() engaged = new EventEmitter<void>();
  @Output() modeChanged = new EventEmitter<'learn' | 'practice' | 'mock' | null>();

  /* =======================================================
     CHAT STATE
  ======================================================= */

  messages: ChatMessage[] = [];

  isBotTyping = false;   // ✅ unified loader state
  showCursor = false;

  private hasEmittedEngaged = false;

  selectedBoard: string = 'CBSE';
  debugMode = false;

  /* =======================================================
     PRACTICE STATE
  ======================================================= */

  practiceQuestion: string | null = null;
  practiceAnswer: string = '';
  practiceAttempts = 0;
  isEvaluating = false;

  practiceScore: string | null = null;
  practiceStrengths: string[] = [];
  practiceMissing: string[] = [];
  practiceAdvice: string | null = null;
  practiceIdeal: string | null = null;

  previousScoreValue: number | null = null;
  scoreDelta: number | null = null;
  scorePercentage = 0;
  scoreClass = '';

  weaknessTags: string[] = [];
  attemptHistory: string[] = [];

  /* =======================================================
     LIFECYCLE
  ======================================================= */

  ngOnChanges(changes: SimpleChanges) {

    if (changes['initialQuestion'] && this.initialQuestion) {

      if (this.practiceMode) {
        this.practiceQuestion = this.initialQuestion;
      } else {
        this.sendUserMessage(this.initialQuestion);
      }

      this.initialQuestion = null;
    }
  }

  /* =======================================================
     CHAT LOGIC
  ======================================================= */

  sendUserMessage(text: string) {

    const trimmed = text?.trim();
    if (!trimmed || this.isBotTyping) return;

    this.emitEngagedOnce();

    // Add user message
    this.messages.push({ role: 'user', text: trimmed });

    // Activate loader
    this.isBotTyping = true;
    this.scrollToBottom(true);

    const diagnosisToSend =
      this.messages.length === 1 ? this.diagnosis ?? undefined : undefined;

    this.chatService
      .sendMessage(trimmed, this.selectedBoard, false, diagnosisToSend)
      .subscribe({

        next: (res) => {

          // Remove loader
          this.isBotTyping = false;

          // Add real bot message
          this.messages.push({
            role: 'bot',
            text: res.reply,
            metadata: res.metadata
          });

          this.scrollToBottom(true);
        },

        error: () => {

          this.isBotTyping = false;

          this.messages.push({
            role: 'bot',
            text: 'Something went wrong. Please try again.'
          });

          this.scrollToBottom(true);
        }
      });
  }

  resetChat() {

    if (this.isBotTyping) return;

    this.chatService.resetSession().subscribe({
      next: () => {
        this.messages = [];
        this.hasEmittedEngaged = false;

        this.messages.push({
          role: 'bot',
          text: 'Chat reset! Ask me any question about maths or science.'
        });
      }
    });
  }

  /* =======================================================
     PRACTICE EVALUATION
  ======================================================= */


  get formattedIdealAnswer(): string {
  if (!this.practiceIdeal) return '';

  return this.practiceIdeal
    .replace(/\n/g, '<br>')
    .replace(/Formula:/gi, '<br><strong>Formula:</strong>')
    .replace(/SI Unit:/gi, '<br><strong>SI Unit:</strong>')
    .replace(/Brief Explanation:/gi, '<br><strong>Brief Explanation:</strong>')
    .replace(/Teaching Note:/gi, '<br><br><strong>Teaching Note:</strong>')
    .replace(/Reflective Question:/gi, '<br><br><strong>Reflective Question:</strong>');
}

  submitPracticeAnswer() {

    if (!this.practiceAnswer.trim() || this.isEvaluating) return;

    this.isEvaluating = true;
    this.practiceAttempts++;

    const prompt = `
Question: ${this.practiceQuestion}
Student Answer: ${this.practiceAnswer}

Evaluate strictly and guide the student.

Structure:
Score: x/x
Strengths:
- ...
Missing Concepts:
- ...
Improvement Advice:
...
Ideal Full-Mark Answer:
...
`;

    this.chatService
      .sendMessage(prompt, this.selectedBoard, false)
      .subscribe({
next: (res) => {
  console.log("BACKEND RESPONSE:", res.reply);   // ADD THIS
  this.parsePracticeFeedback(res.reply);

// 🔥 Force change detection by creating new references
this.practiceStrengths = [...this.practiceStrengths];
this.practiceMissing = [...this.practiceMissing];
this.weaknessTags = [...this.weaknessTags];

this.isEvaluating = false;
},

        error: () => {
          this.practiceAdvice = 'Evaluation failed. Try again.';
          this.isEvaluating = false;
        }
      });
  }

  /* =======================================================
     FEEDBACK PARSER
  ======================================================= */

private parsePracticeFeedback(text: string) {

  this.practiceScore = null;
  this.practiceStrengths = [];
  this.practiceMissing = [];
  this.practiceAdvice = null;
  this.practiceIdeal = null;
  this.weaknessTags = [];

  if (!text) return;

  // -------- SCORE --------
  const scoreMatch = text.match(/Score\s*:\s*(\d+\.?\d*)\s*\/\s*(\d+)/i);

  if (scoreMatch) {
    const obtained = parseFloat(scoreMatch[1]);
    const total = parseFloat(scoreMatch[2]);

    this.practiceScore = `${obtained}/${total}`;
    this.scorePercentage = (obtained / total) * 100;

    if (this.scorePercentage >= 80) this.scoreClass = 'score-high';
    else if (this.scorePercentage >= 50) this.scoreClass = 'score-medium';
    else this.scoreClass = 'score-low';

    if (this.previousScoreValue !== null) {
      this.scoreDelta = +(obtained - this.previousScoreValue).toFixed(2);
    } else {
      this.scoreDelta = null;
    }

    this.previousScoreValue = obtained;
    this.attemptHistory.push(`${obtained}/${total}`);
  }

  // -------- STRENGTHS --------
  const strengthsMatch = text.match(/Strengths:\s*([\s\S]*?)\n\s*Missing Concepts:/i);
  if (strengthsMatch) {
    this.practiceStrengths = strengthsMatch[1]
      .split("\n")
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  // -------- MISSING --------
  const missingMatch = text.match(/Missing Concepts:\s*([\s\S]*?)\n\s*Improvement Advice:/i);
  if (missingMatch) {
    this.practiceMissing = missingMatch[1]
      .split("\n")
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(line => line.length > 0);

    this.weaknessTags = this.practiceMissing.map(item =>
      item.split(" ").slice(0, 3).join(" ")
    );
  }

  // -------- ADVICE --------
  const adviceMatch = text.match(/Improvement Advice:\s*([\s\S]*?)\n\s*Ideal Full-Mark Answer:/i);
  if (adviceMatch) {
    this.practiceAdvice = adviceMatch[1].trim();
  }

  // -------- IDEAL --------
  const idealMatch = text.match(/Ideal Full-Mark Answer:\s*([\s\S]*?)(\n\s*(Teaching Note|Reflective Question|Now write|$))/i);
  if (idealMatch) {
    this.practiceIdeal = idealMatch[1].trim();
  }
}

  /* =======================================================
     HELPERS
  ======================================================= */

  private emitEngagedOnce() {
    if (this.hasEmittedEngaged) return;
    this.hasEmittedEngaged = true;
    this.engaged.emit();
  }

  prepareRefinement() {
  this.practiceAnswer = '';

  setTimeout(() => {
    const textarea = document.querySelector('textarea');
    textarea?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (textarea as HTMLTextAreaElement)?.focus();
  }, 100);
}

resetPractice() {
  this.practiceAnswer = '';
  this.practiceScore = null;
  this.practiceStrengths = [];
  this.practiceMissing = [];
  this.practiceAdvice = null;
  this.practiceIdeal = null;

  this.practiceAttempts = 0;
  this.previousScoreValue = null;
  this.scoreDelta = null;
  this.scorePercentage = 0;
  this.scoreClass = '';

  this.weaknessTags = [];
  this.attemptHistory = [];
}

  private scrollToBottom(smooth = false) {
    if (!this.chatBody) return;

    requestAnimationFrame(() => {
      const el = this.chatBody.nativeElement;
      el.scrollTo({
        top: el.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    });
  }
}