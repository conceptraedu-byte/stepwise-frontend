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
  @Input() isLoading = false
  showDerivation = false;
  @Output() practice = new EventEmitter<void>();
  @Output() chat = new EventEmitter<void>();

  @Output() difficultyChange = new EventEmitter<TeachingDepth>();
  @Output() simplify = new EventEmitter<void>();

  // =========================
  // UI ACTIONS
  // =========================

   selectDifficulty(level: TeachingDepth) {

  console.log("Parent received difficulty:", level)

    this.difficultyChange.emit(level)
  }






  onDifficultyClick(level: TeachingDepth) {

  console.log("Difficulty clicked:", level);

  this.difficultyChange.emit(level);

}

toggleDerivation() {
  this.showDerivation = !this.showDerivation;
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