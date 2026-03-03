import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type DiagnosisType =
  | 'concept'
  | 'formula'
  | 'application'
  | 'unknown';

@Component({
  selector: 'verification-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verification-panel.html',
  styleUrls: ['./verification-panel.css']
})
export class VerificationPanelComponent {

  @Input() diagnosis!: DiagnosisType;

  // 🔥 FIXED — emit string[]
  @Output() verified = new EventEmitter<string[]>();

  answers: string[] = ['', '', ''];
    isVerifying = false

    
  get questions(): string[] {
    switch (this.diagnosis) {
      case 'concept':
        return [
          'Explain the definition in your own words.',
          'Why is this definition important?',
          'What would go wrong if this condition was ignored?'
        ];
      case 'formula':
        return [
          'Write the formula from memory.',
          'Explain what each term represents.',
          'When should this formula NOT be used?'
        ];
      case 'application':
        return [
          'What is the first step you would take?',
          'Why is that step necessary?',
          'What is the most common mistake here?'
        ];
      default:
        return [
          'What part feels confusing now?',
          'What do you think this topic is about?',
          'Where do you usually lose track?'
        ];
    }
  }

  submit() {
    const allAnswered = this.answers.every(a => a.trim().length > 0);

    if (allAnswered) {
      this.verified.emit(this.answers);
    }
  }
}