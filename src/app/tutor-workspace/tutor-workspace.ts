import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExamModeBannerComponent } from '../exam-mode-banner/exam-mode-banner';
import { TutorStepIndicatorComponent } from '../tutor-step-indicator/tutor-step-indicator';
import { DiagnosisPanelComponent, DiagnosisType } from '../diagnosis-panel/diagnosis-panel';
import { LearnEntryPanelComponent } from '../learn-entry-panel/learn-entry-panel';
import { VerificationPanelComponent } from '../verification-panel/verification-panel';
import { ApplyIntakePanelComponent } from '../apply-intake-panel/apply-intake-panel';
import { ChatAreaComponent } from '../chat-area/chat-area';
import { ChatService } from '../services/chat.service';
import { TutorPhase } from '../models/tutor-phase.type';
import { AdaptiveExplanationComponent } from '../adaptive-explanation/adaptive-explanation';

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
    ApplyIntakePanelComponent,
    ChatAreaComponent,
    ExamModeBannerComponent,
    AdaptiveExplanationComponent
],
  templateUrl: './tutor-workspace.html',
  styleUrls: ['./tutor-workspace.css']
})
export class TutorWorkspaceComponent {

  // =========================
  // MODE SYSTEM
  // =========================
  mode: TutorMode = 'structured';
  phase: TutorPhase = 'diagnose';

  // =========================
  // LEARNING STATE
  // =========================
  diagnosisType: DiagnosisType | null = null;
  structuredExplanation: any = null;

  currentTopic: string | null = null;
  confidenceScore: number = 0.5;
  teachingDepth: TeachingDepth = 'board';

  // =========================
  // PRACTICE
  // =========================
  applyStarted = false;
  initialQuestion: string | null = null;

  // =========================
  // MOCK / BANNER STATE
  // =========================
  mockActive = false;
  mockCurrent = 0;
  mockTotal = 0;
  mockScore: number | null = null;

  currentMode: 'learn' | 'practice' | 'mock' | null = 'learn';

  constructor(private chatService: ChatService) {
    console.log('TutorWorkspaceComponent CREATED');
  }

  updateMode(mode: 'learn' | 'practice' | 'mock' | null) {
    this.currentMode = mode;
  }

  // =========================
  // MODE SWITCHERS
  // =========================
private resetLLMSession() {
  this.chatService.resetSession().subscribe({
    next: () => console.log('LLM session cleared'),
    error: (err) => console.error('Session reset error', err)
  });
}

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

switchToPractice(fromAdaptive: boolean = false) {

  this.mode = 'practice';

  if (fromAdaptive && this.structuredExplanation) {
    // CONTEXTUAL PRACTICE
    this.applyStarted = true;

    // generate first question based on profile
    this.initialQuestion = this.generatePracticeFromProfile();

    // DO NOT reset session
  } else {
    // FRESH PRACTICE
    this.applyStarted = false;
    this.initialQuestion = null;
    this.resetLLMSession();
  }
}

private generatePracticeFromProfile(): string {

  const topic = this.currentTopic || 'this topic';
  const confidence = Math.round(this.confidenceScore * 100);

  return `Give me an application-level question on ${topic}.
Student confidence level: ${confidence}%.
Make it slightly challenging but exam-relevant.`;
}



  askNewQuestion() {
    this.chatService.resetSession().subscribe(() => {
      this.mode = 'chat';
      this.currentTopic = null;
      this.confidenceScore = 0.5;
    });
  }

  // =========================
  // DIFFICULTY CONTROL
  // =========================
  changeDifficulty(level: TeachingDepth) {
    this.teachingDepth = level;

    if (!this.currentTopic) return;

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
      depth: this.teachingDepth
    }).subscribe((res: any) => {

      this.structuredExplanation = res.structured;

      if (res.metadata?.diagnostic_profile?.confidence_score !== undefined) {
        this.confidenceScore =
          res.metadata.diagnostic_profile.confidence_score;
      }

    });
  }

  // =========================
  // STRUCTURED FLOW
  // =========================

  onDiagnosisSelected(type: DiagnosisType) {
    this.diagnosisType = type;
    this.phase = 'learn';
  }

  onClarified(data: { clarification: string; topic: string }) {

    this.currentTopic = data.topic;

    this.chatService.send({
      message: 'baseline',
      clarification: data.clarification,
      topic: data.topic,
      diagnosis: this.diagnosisType
    }).subscribe(() => {
      this.phase = 'verify';
    });
  }

  onVerified(answers: string[]) {

    this.chatService.send({
      message: 'baseline',
      verification_answers: {
        q1: answers[0],
        q2: answers[1],
        q3: answers[2]
      }
    }).subscribe((res: any) => {

      this.structuredExplanation = res.structured;
      this.phase = 'adaptive';
      this.mode = 'structured';

      if (res.metadata?.diagnostic_profile?.confidence_score !== undefined) {
        this.confidenceScore =
          res.metadata.diagnostic_profile.confidence_score;
      }

    });
  }

  // =========================
  // PRACTICE
  // =========================
  startApply(question: string) {
    this.applyStarted = true;
    this.initialQuestion = question;
  }
}