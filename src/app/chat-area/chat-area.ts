import {
  Component,
  ElementRef,
  ViewChild,
  Output,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges,
  OnInit,
  ChangeDetectorRef,
  AfterViewChecked,
  OnDestroy,
  NgZone
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatResponse, ChatService } from '../services/chat.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

/* ===================================================== */
/* INTERFACES & TYPES */
/* ===================================================== */

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  type?: 'chat' | 'concept';
  input_mode?: 'short' | 'mcq';
  options?: string[];
  timestamp: number;
  isStreaming?: boolean;
}

interface ScrollState {
  isAutoScroll: boolean;
  shouldScroll: boolean;
  isUserScrolling: boolean;
}

interface LoadingState {
  isBotTyping: boolean;
  isEvaluating: boolean;
  currentMessageId: string | null;
}

/* ===================================================== */
/* COMPONENT */
/* ===================================================== */

@Component({
  selector: 'app-chat-area',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-area.html',
  styleUrls: ['./chat-area.css']
})
export class ChatAreaComponent implements OnChanges, OnInit, AfterViewChecked, OnDestroy {

  constructor(
    private chatService: ChatService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.destroy$ = new Subject<void>();
  }

  /* ===================================================== */
  /* LIFECYCLE HOOKS */
  /* ===================================================== */

  ngOnInit(): void {
    this.initializeComponent();
    this.setupScrollBehavior();
    this.setupMessageTracking();
  }

  ngAfterViewChecked(): void {
    this.handleAutoScroll();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialQuestion'] && this.initialQuestion) {
      if (this.practiceMode) {
        this.practiceQuestion = this.initialQuestion;
      } else {
        setTimeout(() => this.sendUserMessage(this.initialQuestion || ''), 100);
      }
      this.initialQuestion = null;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* ===================================================== */
  /* VIEWCHILD REFS */
  /* ===================================================== */

  @ViewChild('chatBody') chatBody!: ElementRef<HTMLDivElement>;
  @ViewChild('inputField') inputField!: ElementRef<HTMLInputElement>;
  @ViewChild('messageContainer') messageContainer!: ElementRef<HTMLDivElement>;

  /* ===================================================== */
  /* INPUTS / OUTPUTS */
  /* ===================================================== */

  @Input() practiceMode = false;
  @Input() initialQuestion: string | null = null;
  @Input() diagnosis: string | null = null;
  @Input() maxMessageLength = 5000;

  @Output() engaged = new EventEmitter<void>();
  @Output() modeChanged = new EventEmitter<'learn' | 'practice' | 'mock' | null>();
  @Output() messageAdded = new EventEmitter<ChatMessage>();

  /* ===================================================== */
  /* CORE STATE */
  /* ===================================================== */

  messages: ChatMessage[] = [];
  interactionMode: 'learn' | 'problems' = 'learn';
uiMode: 'chat' | 'practice' = 'chat';
  isLearningMode = false;
  currentTopic = '';
  selectedBoard: string = 'CBSE';

  /* ===================================================== */
  /* LOADING STATE */
  /* ===================================================== */

  private loadingState: LoadingState = {
    isBotTyping: false,
    isEvaluating: false,
    currentMessageId: null
  };

  get isBotTyping(): boolean {
    return this.loadingState.isBotTyping;
  }

  get isEvaluating(): boolean {
    return this.loadingState.isEvaluating;
  }

  /* ===================================================== */
  /* SCROLL STATE */
  /* ===================================================== */

  private scrollState: ScrollState = {
    isAutoScroll: true,
    shouldScroll: false,
    isUserScrolling: false
  };

  private messageCountSnapshot = 0;
  private destroy$: Subject<void>;
  private scrollDebounce$ = new Subject<void>();
  private subscriptions: Subscription[] = [];

  /* ===================================================== */
  /* GUIDED TUTOR MODE */
  /* ===================================================== */

  guidedMode = false;
  attemptText = '';
  solutionUnlocked = false;
  attemptCount = 0;

  /* ===================================================== */
  /* PRACTICE STATE */
  /* ===================================================== */

  practiceQuestion: string | null = null;
  practiceAnswer: string = '';
  practiceAttempts = 0;

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

  /* ===================================================== */
  /* ENGAGEMENT & UI STATE */
  /* ===================================================== */

  private hasEmittedEngaged = false;
  showEmptyState = true;
  inputError: string | null = null;

  /* ===================================================== */
  /* INITIALIZATION */
  /* ===================================================== */

  private initializeComponent(): void {
    this.isLearningMode = true;
    this.currentTopic = '';
    this.messageCountSnapshot = 0;

    // Add welcome message
    this.addBotMessage(
      'Hello! I\'m your Conceptra tutor. Ask me anything about math or science, or try a practice question.',
      'chat'
    );
  }

  /* ===================================================== */
  /* SCROLL BEHAVIOR SETUP */
  /* ===================================================== */

  private setupScrollBehavior(): void {
    this.scrollDebounce$
      .pipe(
        debounceTime(150),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.scrollState.isUserScrolling = false;
      });
  }

  /* ===================================================== */
  /* MESSAGE TRACKING */
  /* ===================================================== */

  private setupMessageTracking(): void {
    // Track message count for auto-scroll detection
    const messageMonitor = setInterval(() => {
      if (this.messages.length !== this.messageCountSnapshot) {
        this.scrollState.shouldScroll = true;
        this.messageCountSnapshot = this.messages.length;
      }
    }, 100);

    this.subscriptions.push(
      new Subscription(() => clearInterval(messageMonitor))
    );
  }

  /* ===================================================== */
  /* SCROLL LOGIC */
  /* ===================================================== */

  private handleAutoScroll(): void {
    if (!this.chatBody || !this.scrollState.isAutoScroll) return;

    if (this.scrollState.shouldScroll && !this.scrollState.isUserScrolling) {
      this.ngZone.runOutsideAngular(() => {
        requestAnimationFrame(() => {
          const el = this.chatBody.nativeElement;
          el.scrollTo({
            top: el.scrollHeight,
            behavior: 'smooth'
          });
          this.scrollState.shouldScroll = false;
        });
      });
    }
  }

  onChatScroll(event: Event): void {
    const el = event.target as HTMLDivElement;
    const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;

    this.scrollState.isUserScrolling = !isAtBottom;
    this.scrollDebounce$.next();
  }

  /* ===================================================== */
  /* MESSAGE CREATION HELPERS */
  /* ===================================================== */

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addUserMessage(text: string): ChatMessage {
    const message: ChatMessage = {
      id: this.generateMessageId(),
      role: 'user',
      text: text.trim(),
      type: 'chat',
      timestamp: Date.now()
    };

    this.messages.push(message);
    this.messageAdded.emit(message);
    this.showEmptyState = false;

    return message;
  }

  private addBotMessage(
    text: string,
    type: 'chat' | 'concept' = 'chat',
    inputMode?: 'short' | 'mcq',
    options?: string[]
  ): ChatMessage {
    const message: ChatMessage = {
      id: this.generateMessageId(),
      role: 'bot',
      text,
      type,
      input_mode: inputMode,
      options,
      timestamp: Date.now()
    };

    this.messages.push(message);
    this.messageAdded.emit(message);

    return message;
  }

  /* ===================================================== */
  /* MESSAGE SEND LOGIC */
  /* ===================================================== */

  sendUserMessage(rawText: string): void {
    // Validation
    const text = rawText?.trim();

    if (!text) {
      this.inputError = 'Please enter a message.';
      setTimeout(() => this.inputError = null, 3000);
      return;
    }

    if (text.length > this.maxMessageLength) {
      this.inputError = `Message exceeds ${this.maxMessageLength} characters.`;
      return;
    }

    if (this.isBotTyping || this.isEvaluating) {
      this.inputError = 'Please wait for the previous response.';
      return;
    }

    // Reset error state
    this.inputError = null;

    // Force chat mode and reset practice
    this.uiMode = 'chat';
    this.resetPracticeState();

    // Set topic once
    if (this.interactionMode === 'learn' && !this.currentTopic) {
      this.currentTopic = text;
    }

    this.emitEngagedOnce();

    // Add user message
    this.addUserMessage(text);

    // Update loading state
    this.loadingState.isBotTyping = true;
    this.loadingState.currentMessageId = this.generateMessageId();
    this.scrollState.shouldScroll = true;

    this.cdr.detectChanges();

    // API call
    const diagnosisToSend =
      this.messages.filter(m => m.role === 'bot').length === 1
        ? this.diagnosis ?? undefined
        : undefined;

let request$;

if (this.interactionMode === 'learn') {
  request$ = this.chatService.learnMessage(
    text,
    this.selectedBoard,
    this.currentTopic
  );
} else {
  request$ = this.chatService.problemsMessage(
    text,
    this.selectedBoard
  );
}

    this.subscriptions.push(
      request$
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: ChatResponse) => this.handleChatResponse(res),
          error: (err) => this.handleChatError(err)
        })
    );
  }


  switchMode(newMode: 'learn' | 'problems') {
 if (this.interactionMode === newMode) return;

this.interactionMode = newMode;

  // reset session context
  this.messages = [];
  this.currentTopic = '';
  this.guidedMode = false;

  this.addBotMessage(
    newMode === 'learn'
      ? 'Switched to learning mode. What do you want to learn?'
      : 'Switched to problem-solving mode. Enter your problem.',
    'chat'
  );
}

  /* ===================================================== */
  /* RESPONSE HANDLING */
  /* ===================================================== */

  private handleChatResponse(res: ChatResponse): void {
    this.loadingState.isBotTyping = false;

    const reply = res?.reply || '';
    let formatted = reply;
    let type: 'chat' | 'concept' = 'chat';

    // Concept detection
    try {
      const parsed = JSON.parse(reply);
      if (parsed?.title && parsed?.definition) {
        formatted = this.renderConcept(parsed);
        type = 'concept';
      }
    } catch {
      // Not JSON, treat as regular chat
    }

    // Add bot message
    const botMessage = this.addBotMessage(
      formatted,
      type,
      res?.metadata?.input_mode || 'short',
      res?.metadata?.options || []
    );

    // Check for guided mode triggers
    const lowerReply = reply.toLowerCase();
    if (
      lowerReply.includes('try solving') ||
      lowerReply.includes('write your attempt') ||
      lowerReply.includes('solve this')
    ) {
      this.guidedMode = true;
      this.attemptCount = 0;
    }

    // Solution unlock
    if (
      lowerReply.includes('correct answer') ||
      lowerReply.includes('step-by-step solution')
    ) {
      this.solutionUnlocked = true;
    }

    this.scrollState.shouldScroll = true;
    this.cdr.detectChanges();
  }

  private handleChatError(err: any): void {
    console.error('Chat error:', err);
    this.loadingState.isBotTyping = false;

    const errorMessage = err?.error?.message
      || err?.message
      || 'Something went wrong. Please try again.';

    this.addBotMessage(errorMessage, 'chat');
    this.scrollState.shouldScroll = true;
    this.cdr.detectChanges();
  }

  /* ===================================================== */
  /* CONCEPT RENDERING */
  /* ===================================================== */

  renderConcept(data: any): string {
    if (!data) return '';

    const sections: string[] = [];

    if (data.title) {
      sections.push(`<div class="concept-title-main">${this.escapeHtml(data.title)}</div>`);
    }

    if (data.intro) {
      sections.push(`<div class="concept-intro">${data.intro}</div>`);
    }

    if (data.definition) {
      sections.push(`
        <div class="concept-section">
          <div class="concept-title">📘 Definition</div>
          <div class="concept-body">${data.definition}</div>
        </div>
      `);
    }

    if (data.key_points?.length) {
      sections.push(`
        <div class="concept-section">
          <div class="concept-title">Key Points</div>
          <ul>
            ${data.key_points.map((p: any) => `<li>${p}</li>`).join('')}
          </ul>
        </div>
      `);
    }

    if (data.formula?.equation) {
      sections.push(`
        <div class="concept-section">
          <div class="concept-title">📐 Formula</div>
          <div class="concept-body">${data.formula.equation}</div>
        </div>
      `);
    }

    if (data.example?.problem) {
      sections.push(`
        <div class="concept-section">
          <div class="concept-title">🔬 Example</div>
          <div>${data.example.problem}</div>
        </div>
      `);
    }

    if (data.exam_tip) {
      sections.push(`
        <div class="concept-section">
          <div class="concept-title">⚡ Exam Tip</div>
          <div>${data.exam_tip}</div>
        </div>
      `);
    }

    if (data.reflective_question) {
      sections.push(`
        <div class="concept-section">
          <div class="concept-title">🎯 Think About This</div>
          <div>${data.reflective_question}</div>
        </div>
      `);
    }

    return sections.join('');
  }

  /* ===================================================== */
  /* RESPONSE FORMATTING */
  /* ===================================================== */

  formatTutorResponse(text: string): string {
    if (!text) return '';

    return text
      .replace(/^Verdict:/gm, '<strong class="verdict-label">🎯 Verdict:</strong>')
      .replace(/^Explanation:/gm, '<strong class="explanation-label">📝 Explanation:</strong>')
      .replace(/^Correct Answer:/gm, '<strong class="correct-label">✓ Correct Answer:</strong>')
      .replace(/^Exam Tip:/gm, '<strong class="tip-label">⚡ Exam Tip:</strong>')
      .replace(/\n/g, '<br>');
  }

  /* ===================================================== */
  /* ATTEMPT & HINT LOGIC */
  /* ===================================================== */

  submitAttempt(): void {
    const attempt = this.attemptText.trim();

    if (!attempt || this.isBotTyping) return;

    this.addUserMessage(attempt);
    this.loadingState.isBotTyping = true;
    this.attemptCount++;
    this.scrollState.shouldScroll = true;
    this.cdr.detectChanges();

    this.subscriptions.push(
      this.chatService
        .sendMessage(attempt, this.selectedBoard)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.loadingState.isBotTyping = false;
            this.addBotMessage(res.reply, 'chat');

            if (this.attemptCount >= 2) {
              this.solutionUnlocked = true;
            }

            this.scrollState.shouldScroll = true;
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.loadingState.isBotTyping = false;
            this.addBotMessage('Evaluation failed. Please try again.', 'chat');
            this.cdr.detectChanges();
          }
        })
    );

    this.attemptText = '';
  }

  requestHint(): void {
    this.addUserMessage('💡 I need a hint');
    this.loadingState.isBotTyping = true;
    this.scrollState.shouldScroll = true;
    this.cdr.detectChanges();

    this.subscriptions.push(
      this.chatService
        .sendMessage('hint', this.selectedBoard)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.loadingState.isBotTyping = false;
            this.addBotMessage(res.reply, 'chat');
            this.scrollState.shouldScroll = true;
            this.cdr.detectChanges();
          },
          error: () => {
            this.loadingState.isBotTyping = false;
            this.addBotMessage('Failed to fetch hint.', 'chat');
            this.cdr.detectChanges();
          }
        })
    );
  }

  requestSolution(): void {
    this.addUserMessage('🔓 Show solution');
    this.loadingState.isBotTyping = true;
    this.scrollState.shouldScroll = true;
    this.cdr.detectChanges();

    this.subscriptions.push(
      this.chatService
        .sendMessage('show solution', this.selectedBoard)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.loadingState.isBotTyping = false;
            this.addBotMessage(res.reply, 'chat');

            this.guidedMode = false;
            this.solutionUnlocked = false;
            this.attemptCount = 0;

            this.scrollState.shouldScroll = true;
            this.cdr.detectChanges();
          },
          error: () => {
            this.loadingState.isBotTyping = false;
            this.addBotMessage('Failed to fetch solution.', 'chat');
            this.cdr.detectChanges();
          }
        })
    );
  }

  /* ===================================================== */
  /* PRACTICE MODE */
  /* ===================================================== */

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

  submitPracticeAnswer(): void {
    const answer = this.practiceAnswer?.trim();

    if (!answer || this.isEvaluating) return;

    this.uiMode = 'practice';
    this.loadingState.isEvaluating = true;
    this.practiceAttempts++;
    this.cdr.detectChanges();

    const evaluationPrompt = `
Question: ${this.practiceQuestion}
Student Answer: ${answer}

Provide a strict evaluation with:
- Score (x/10)
- Strengths
- Missing Concepts
- Improvement Advice
- Ideal Full-Mark Answer
`;

    this.subscriptions.push(
      this.chatService
        .sendMessage(evaluationPrompt, this.selectedBoard, false)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            try {
              this.parsePracticeFeedback(res?.reply || '');
            } catch (e) {
              console.error('Feedback parsing error:', e);
              this.practiceAdvice = 'Error parsing evaluation.';
            }

            // Force change detection
            this.practiceStrengths = [...this.practiceStrengths];
            this.practiceMissing = [...this.practiceMissing];
            this.weaknessTags = [...this.weaknessTags];

            this.loadingState.isEvaluating = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Practice evaluation error:', err);
            this.practiceAdvice = 'Evaluation failed. Please try again.';
            this.loadingState.isEvaluating = false;
            this.cdr.detectChanges();
          }
        })
    );
  }

  /* ===================================================== */
  /* FEEDBACK PARSER */
  /* ===================================================== */

  private parsePracticeFeedback(text: string): void {
    if (!text) return;

    // Parse score
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
      }

      this.previousScoreValue = obtained;
      this.attemptHistory.push(`${obtained}/${total}`);
    }

    // Parse strengths
    const strengthsMatch = text.match(/Strengths:?\s*([\s\S]*?)(?:Missing|Improvement|$)/i);
    if (strengthsMatch) {
      const strengths = strengthsMatch[1]
        .split('\n')
        .filter(s => s.trim().startsWith('-'))
        .map(s => s.trim().substring(1).trim())
        .filter(s => s.length > 0);
      this.practiceStrengths = strengths;
    }

    // Parse missing concepts
    const missingMatch = text.match(/Missing Concepts:?\s*([\s\S]*?)(?:Improvement|Ideal|$)/i);
    if (missingMatch) {
      const missing = missingMatch[1]
        .split('\n')
        .filter(s => s.trim().startsWith('-'))
        .map(s => s.trim().substring(1).trim())
        .filter(s => s.length > 0);
      this.practiceMissing = missing;
      this.weaknessTags = missing.slice(0, 3).map(m => m.split(':')[0].trim());
    }

    // Parse improvement advice
    const adviceMatch = text.match(/Improvement Advice:?\s*([\s\S]*?)(?:Ideal|$)/i);
    if (adviceMatch) {
      this.practiceAdvice = adviceMatch[1].trim().split('\n')[0];
    }

    // Parse ideal answer
    const idealMatch = text.match(/Ideal Full-Mark Answer:?\s*([\s\S]*?)$/i);
    if (idealMatch) {
      this.practiceIdeal = idealMatch[1].trim();
    }
  }

  /* ===================================================== */
  /* RESET & CLEANUP */
  /* ===================================================== */

  resetChat(): void {
    if (this.isBotTyping) return;

    this.subscriptions.push(
      this.chatService.resetSession()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.messages = [];
            this.hasEmittedEngaged = false;
            this.guidedMode = false;
            this.solutionUnlocked = false;
            this.attemptCount = 0;
            this.showEmptyState = true;

            this.addBotMessage(
              'Chat reset! Ask me any question about math or science.',
              'chat'
            );

            this.scrollState.shouldScroll = true;
            this.cdr.detectChanges();
          },
          error: () => {
            this.addBotMessage('Failed to reset chat.', 'chat');
            this.cdr.detectChanges();
          }
        })
    );
  }

  prepareRefinement(): void {
    this.practiceAnswer = '';

    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      textarea?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (textarea as HTMLTextAreaElement)?.focus();
    }, 100);
  }

  resetPractice(): void {
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
    this.cdr.detectChanges();
  }

  private resetPracticeState(): void {
    this.practiceScore = null;
    this.practiceMissing = [];
    this.practiceAdvice = '';
    this.practiceIdeal = '';
    this.practiceStrengths = [];
    this.weaknessTags = [];
    this.scoreDelta = null;
    this.loadingState.isEvaluating = false;
  }

  /* ===================================================== */
  /* UTILITY METHODS */
  /* ===================================================== */

  private emitEngagedOnce(): void {
    if (this.hasEmittedEngaged) return;
    this.hasEmittedEngaged = true;
    this.engaged.emit();
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getLoadingMessage(): string {
    return this.isEvaluating
      ? 'Evaluating your answer...'
      : 'Conceptra is thinking...';
  }

  getLongTextWarning(text: string): boolean {
    const words = text.split(/\s+/).length;
    return words > 200; // Warn if > 200 words
  }

}