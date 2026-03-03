import {
  Component,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type DiagnosisType =
  | 'concept'
  | 'formula'
  | 'application'
  | 'unknown';

@Component({
  selector: 'learn-entry-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './learn-entry-panel.html',
  styleUrls: ['./learn-entry-panel.css']
})
export class LearnEntryPanelComponent {

  // =========================
  // INPUT / OUTPUT
  // =========================

  @Input() diagnosis!: DiagnosisType;

  @Output()
  clarified = new EventEmitter<{
    clarification: string;
    topic: string;
  }>();

  // =========================
  // CORE MODEL STATE
  // =========================

  topicName: string = '';
  clarificationText: string = '';

  // =========================
  // UI STATE (SMART FEATURES)
  // =========================

  isFocusedTopic = false;
  isFocusedClarification = false;
  isTyping = false;

  private typingTimeout: any;

  // Suggested topic chips
  suggestedTopics: string[] = [
    // 'Gravitation',
    // 'Ohm’s Law',
    // 'Refraction',
    // 'Trigonometry',
    // 'Differentiation'
  ];

  // =========================
  // DYNAMIC HEADER
  // =========================

  get title(): string {
    switch (this.diagnosis) {
      case 'concept':
        return 'Conceptual Gap Identified';
      case 'formula':
        return 'Formula-Level Gap Identified';
      case 'application':
        return 'Application-Level Gap Identified';
      default:
        return 'Learning Gap Identified';
    }
  }

  get prompt(): string {
    switch (this.diagnosis) {
      case 'concept':
        return 'What exactly feels unclear — the definition or the reasoning?';
      case 'formula':
        return 'Which formula is confusing you?';
      case 'application':
        return 'At which step do you usually get stuck?';
      default:
        return 'Briefly describe what feels confusing.';
    }
  }

  // =========================
  // PROGRESS LOGIC
  // =========================

  get progress(): number {
    let score = 0;

    if (this.topicName.trim().length > 0) {
      score += 40;
    }

    if (this.clarificationText.trim().length > 10) {
      score += 60;
    }

    return score;
  }

  get clarificationLength(): number {
    return this.clarificationText.trim().length;
  }

  get isReady(): boolean {
    return this.progress === 100;
  }

  // =========================
  // DYNAMIC PLACEHOLDER
  // =========================

  get dynamicPlaceholder(): string {

    if (!this.topicName.trim()) {
      return 'Start by entering the topic above...';
    }

    switch (this.diagnosis) {
      case 'concept':
        return 'Explain which part of the concept feels unclear...';
      case 'formula':
        return 'Mention the formula or where it breaks for you...';
      case 'application':
        return 'Describe the step where you get stuck...';
      default:
        return 'Describe your confusion clearly...';
    }
  }

  // =========================
  // SMART SUGGESTION CHIP
  // =========================

  selectSuggestion(topic: string) {
    this.topicName = topic;
  }

  // =========================
  // AI TYPING SIMULATION
  // =========================

  onClarificationInput() {

    this.isTyping = true;

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      this.isTyping = false;
    }, 800);
  }

  // =========================
  // FORM SUBMISSION
  // =========================

  submit() {

    const topic = this.topicName.trim();
    const clarification = this.clarificationText.trim();

    if (!topic || !clarification) return;

    this.clarified.emit({
      clarification,
      topic
    });

    // Optional UX reset (if you want auto reset)
    // this.topicName = '';
    // this.clarificationText = '';
  }
}