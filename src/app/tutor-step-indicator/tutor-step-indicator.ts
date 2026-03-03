import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutorPhase } from '../models/tutor-phase.type';

@Component({
  selector: 'tutor-step-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tutor-step-indicator.html',
  styleUrls: ['./tutor-step-indicator.css']
})
export class TutorStepIndicatorComponent {

  @Input() phase: TutorPhase = 'diagnose';

  // ✅ Updated phase order
  readonly steps: TutorPhase[] = [
    'diagnose',
    'learn',
    'verify',
    'adaptive',
    'workspace',
    'apply'
  ];

  // ✅ Updated labels
  readonly stepLabels: Record<TutorPhase, string> = {
    diagnose: 'Diagnose',
    learn: 'Learn',
    verify: 'Verify',
    adaptive: 'Tutor',
    apply: 'Apply',
    workspace: 'workspace'
  };

  get currentIndex(): number {
    return this.steps.indexOf(this.phase);
  }

  isCompleted(step: TutorPhase): boolean {
    return this.steps.indexOf(step) < this.currentIndex;
  }

  isActive(step: TutorPhase): boolean {
    return step === this.phase;
  }
}