import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ExamModeBannerComponent } from '../exam-mode-banner/exam-mode-banner';
import { DiagnosisPanelComponent, DiagnosisType } from '../diagnosis-panel/diagnosis-panel';
import { LearnEntryPanelComponent } from '../learn-entry-panel/learn-entry-panel';
import { VerificationPanelComponent } from '../verification-panel/verification-panel';
import { ApplyIntakePanelComponent } from '../apply-intake-panel/apply-intake-panel';
import { ChatAreaComponent } from '../chat-area/chat-area';
import { ActivatedRoute } from '@angular/router';
import { AdaptiveExplanationComponent } from '../adaptive-explanation/adaptive-explanation';
import { PracticeQuestionPanelComponent } from '../practice-question-panel/practice-question-panel';
import { HttpClient } from '@angular/common/http';
import { ChatService } from '../services/chat.service';
import { TutorPhase } from '../models/tutor-phase.type';

type TutorMode = 'structured' | 'chat' | 'practice' | 'mock';
type TeachingDepth = 'simple' | 'board' | 'advanced';

@Component({
  selector: 'app-tutor-workspace',
  standalone: true,
  imports: [
    CommonModule,
    DiagnosisPanelComponent,
    LearnEntryPanelComponent,
    VerificationPanelComponent,
    
    ChatAreaComponent,
    ExamModeBannerComponent,
    AdaptiveExplanationComponent,
    PracticeQuestionPanelComponent
  ],
  templateUrl: './tutor-workspace.html',
  styleUrls: ['./tutor-workspace.css']
})
export class TutorWorkspaceComponent {

  /* ======================================================
     MODE STATE
  ====================================================== */

  mode: TutorMode = 'structured';
  phase: TutorPhase = 'diagnose';
  topic: string | null = null;
  currentQuestion: string = '';
  verificationResult : any = null;


  /* ======================================================
     LEARNING STATE
  ====================================================== */

  diagnosisType: DiagnosisType | null = null;
  structuredExplanation: any = null;

  currentTopic: string | null = null;

  confidenceScore = 0.5;
  teachingDepth: TeachingDepth = 'board';

  loading = false;

  /* ======================================================
     PRACTICE STATE
  ====================================================== */

  initialQuestion: string | null = null;
  loadingPractice = false;
  currentPractice: any = null

  practiceEvaluation: any = null;
  nextPracticeQuestion: string | null = null;

  /* ======================================================
     MOCK / BANNER
  ====================================================== */

  mockActive = false;
  mockCurrent = 0;
  mockTotal = 0;
  mockScore: number | null = null;

  currentMode: 'learn' | 'practice' | 'mock' | null = 'learn';

  constructor(private chatService: ChatService, private route: ActivatedRoute,   private http: HttpClient
) {
    console.log('TutorWorkspaceComponent CREATED');
  }

  updateMode(mode: 'learn' | 'practice' | 'mock' | null) {
    this.currentMode = mode;
  }

  showPracticePanel = false

ngOnInit() {

  this.route.queryParams.subscribe(params => {

    const topic = params['topic']
    const mode = params['mode']

    // Dashboard fast entry
    if (mode === 'practice' && topic) {

      this.currentTopic = topic

      this.mode = 'practice'

      this.phase = 'adaptive'   // skip structured flow

      this.generatePracticeQuestion()

      return
    }

  })

}

loadQuestionForTopic(topic: string) {

  this.http.get(`http://localhost:8000/practice/question?topic=${topic}`)
    .subscribe((res:any) => {

      this.currentQuestion = res.question;

    });

}

  /* ======================================================
     SESSION RESET
  ====================================================== */

  private resetLLMSession() {
    this.chatService.resetSession().subscribe({
      next: () => console.log('LLM session cleared'),
      error: err => console.error('Session reset error', err)
    });
  }

  /* ======================================================
     MODE SWITCHERS
  ====================================================== */

  switchToChat(fromAdaptive: boolean = false) {

    this.mode = 'chat';

    if (!fromAdaptive) {
      this.resetLLMSession();
    }

  }

  switchToStructured() {

    this.mode = 'structured';
    this.phase = 'diagnose';

    this.structuredExplanation = null;
    this.currentTopic = null;

    this.confidenceScore = 0.5;

    this.resetLLMSession();
  }

  /* ======================================================
     PRACTICE ENTRY
  ====================================================== */
// =========================
// PRACTICE ENTRY
// =========================
switchToPractice(fromAdaptive: boolean = false) {

  this.mode = 'practice';

  if (fromAdaptive && this.currentTopic) {

    this.generatePracticeQuestion();

  } else {

    this.initialQuestion = null;
    this.resetLLMSession();

  }

}


// =========================
// PRACTICE QUESTION GENERATION
// =========================
generatePracticeQuestion() {

  if (!this.currentTopic) return;

  this.loadingPractice = true;

  const confidence = Math.round(this.confidenceScore * 100);

  this.chatService
    .generatePracticeQuestion(this.currentTopic, confidence)
    .subscribe({

      next: (res: any) => {

        console.log("Practice API response:", res);

        this.currentPractice = res
this.initialQuestion = res.question

        this.loadingPractice = false;

      },

      error: (err) => {

        console.error("Practice generation error", err);

        this.loadingPractice = false;

      }

    });

}

loadExplanation(depth: 'simple' | 'board' | 'advanced') {

  if (!this.currentTopic) return;

  this.loading = true;
  this.teachingDepth = depth;   

  this.chatService.send({
    message: 'regenerate_explanation',
    topic: this.currentTopic,
    depth: this.teachingDepth,
    diagnosis: this.diagnosisType, 
    verification_answers : null
  }).subscribe((res: any) => {

    this.mapStructured(res);

    this.phase = 'adaptive';
    this.loading = false;

  });

}

mapStructured(res: any) {

  let structured: any = res.structured;

  // fallback (rare case)
  if (!structured && res.reply) {
    try {
      structured = JSON.parse(res.reply);
    } catch {
      structured = {};
    }
  }

  this.structuredExplanation = {

    definition: structured.definition || "",

    core_concept: structured.intro || "",

    formula: structured.formula || { items: [] },

    derivation: structured.derivation || {   // 🔥 CRITICAL
      steps: [],
      intuition: "",
      when_to_use: ""
    },

    stepwise_logic: structured.step_by_step_logic || [],

    common_mistakes: structured.common_mistakes || [],

    board_exam_format: structured.exam_tip || "",

    reinforcement_question: structured.reflective_question || "",

    diagnosis: this.diagnosisType   // 🔥 VERY IMPORTANT
  };

}

  /* ======================================================
     PRACTICE ANSWER SUBMISSION
  ====================================================== */

onPracticeAnswer(answer: string) {

  if (!this.currentPractice) return;

  this.chatService
    .evaluatePractice(
      this.currentPractice.question,
      this.currentPractice.correct_answer,
      answer,
      this.currentPractice.solution_steps
    )
    .subscribe((res: any) => {

      console.log("Evaluation:", res)

      this.practiceEvaluation = res
      this.nextPracticeQuestion = res.next_question

    });

}

  /* ======================================================
     STRUCTURED FLOW
  ====================================================== */

  onDiagnosisSelected(type: DiagnosisType) {

    this.diagnosisType = type;
    this.phase = 'learn';

  }

onClarified(data: { clarification: string; topic: string }) {

  console.log("Clarified fired", data);

  this.currentTopic = data.topic;

  // Move UI immediately
  this.phase = 'verify';

  // Run API call in background
  this.chatService.send({
    message: 'baseline',
    clarification: data.clarification,
    topic: data.topic,
    diagnosis: this.diagnosisType
  }).subscribe({
    next: (res) => {
      console.log("API success", res);
    },
    error: (err) => {
      console.error("API failed", err);
    }
  });

}

onVerified(answers: string[]) {

  this.loading = true;

  this.chatService.send({
    message: 'verify',
    topic: this.currentTopic,
    verification_answers: answers,   // ✅ FIXED (array, not object)
    diagnosis: this.diagnosisType
  }).subscribe({
    next: (res: any) => {

      console.log("FULL VERIFY RESPONSE:", res);
      console.log("ANALYSIS CHECK:", res.metadata?.question_wise_analysis);

      // 🔥 HANDLE BOTH RESPONSE TYPES
      if (res.structured) {
        this.mapStructured(res);
        this.mode = 'structured';
      } else {
        this.structuredExplanation = null;
        this.mode = 'structured';   
      }

      this.verificationResult = {
        understanding: res.metadata?.understanding_level,
        nextAction: res.metadata?.next_action,
        mistake_type: res.metadata?.mistake_type,
        reason: res.metadata?.reason,
        targeted_fix: res.metadata?.targeted_fix,
        explanation: this.structuredExplanation,
        reply: res.reply || null  ,
        analysis: res.metadata?.question_wise_analysis || [],
        summary: res.metadata?.final_summary || "" // ✅ capture text response
      };

      this.phase = 'result';

      if (res.metadata?.diagnostic_profile?.confidence_score !== undefined) {
        this.confidenceScore =
          res.metadata.diagnostic_profile.confidence_score;
      }

      this.loading = false;
    },

    error: (err) => {
      console.error("VERIFY ERROR:", err);
      this.loading = false;
    }
  });
}

goToAdaptive() {
  this.phase = 'adaptive';
}

  /* ======================================================
     DIFFICULTY CONTROL
  ====================================================== */

  changeDifficulty(level: TeachingDepth) {

    

    this.teachingDepth = level;

    if (!this.currentTopic) return;

    this.loading = true;

    this.regenerateExplanation();

  }

  explainSimpler() {

    this.teachingDepth = 'simple';

    this.regenerateExplanation();

  }

regenerateExplanation() {

  if (!this.currentTopic) return;

  this.chatService.send({
    message: 'regenerate_explanation',
    topic: this.currentTopic,
    depth: this.teachingDepth,
    diagnosis: this.diagnosisType
  }).subscribe({

    next: (res: any) => {

this.mapStructured(res);     // ✅ build explanation

this.phase = 'adaptive';     // ✅ go to explanation screen

      if (res.metadata?.diagnostic_profile?.confidence_score !== undefined) {
        this.confidenceScore =
          res.metadata.diagnostic_profile.confidence_score;
      }

      this.loading = false;

    },

    error: (err) => {

      console.error("Regenerate explanation failed:", err);
      this.loading = false;

    }

  });

}
  /* ======================================================
     GENERAL ACTIONS
  ====================================================== */

  askNewQuestion() {

    this.chatService.resetSession().subscribe(() => {

      this.mode = 'chat';

      this.currentTopic = null;
      this.confidenceScore = 0.5;

    });

  }

  startApply(question: string) {

  this.mode = 'practice';

  this.initialQuestion = question;

}

loadNextPracticeQuestion() {

  if (!this.practiceEvaluation?.next_question) return

  this.initialQuestion = this.practiceEvaluation.next_question

  this.practiceEvaluation = null

}

}