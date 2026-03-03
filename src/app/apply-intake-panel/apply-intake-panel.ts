import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'apply-intake-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apply-intake-panel.html',
  styleUrls: ['./apply-intake-panel.css']
})
export class ApplyIntakePanelComponent {

  @Output() submitted = new EventEmitter<string>();

  questionText = '';

  submit() {
    const trimmed = this.questionText.trim();

    if (trimmed.length > 0) {
      this.submitted.emit(trimmed);
      this.questionText = ''; // optional reset
    }
  }
}