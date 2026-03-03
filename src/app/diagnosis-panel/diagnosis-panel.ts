import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DiagnosisType =
  | 'concept'
  | 'formula'
  | 'application'
  | 'unknown';

@Component({
  selector: 'diagnosis-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diagnosis-panel.html',
  styleUrls: ['./diagnosis-panel.css']
})
export class DiagnosisPanelComponent {

  @Output() diagnosisSelected = new EventEmitter<DiagnosisType>();

  select(type: DiagnosisType) {
    this.diagnosisSelected.emit(type);
  }
}
