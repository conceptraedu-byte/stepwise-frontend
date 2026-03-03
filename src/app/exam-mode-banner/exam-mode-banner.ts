import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-exam-mode-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-mode-banner.html',
  styleUrls: ['./exam-mode-banner.css']
})
export class ExamModeBannerComponent {

  @Input() mode: 'learn' | 'practice' | 'mock' | null = null;

  @Input() currentQuestion: number = 0;
  @Input() totalQuestions: number = 0;

  @Input() score: number | null = null;
}
