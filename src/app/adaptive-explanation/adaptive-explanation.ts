import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

type TeachingDepth = 'simple' | 'board' | 'advanced';

@Component({
  selector: 'adaptive-explanation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './adaptive-explanation.html',
  styleUrls: ['./adaptive-explanation.css']
})
export class AdaptiveExplanationComponent {

  @Input() data: any;

  @Input() currentDepth: TeachingDepth = 'board';

  @Output() practice = new EventEmitter<void>();
  @Output() chat = new EventEmitter<void>();

  @Output() difficultyChange = new EventEmitter<TeachingDepth>();
  @Output() simplify = new EventEmitter<void>();

  // =========================
  // UI ACTIONS
  // =========================

  selectDifficulty(level: TeachingDepth) {
    this.difficultyChange.emit(level);
  }

  explainSimpler() {
    this.simplify.emit();
  }

  goToPractice() {
    this.practice.emit();
  }

  goToChat() {
    this.chat.emit();
  }
}