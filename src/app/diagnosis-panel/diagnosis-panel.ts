import { Component, EventEmitter, Output, OnInit } from '@angular/core';
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
export class DiagnosisPanelComponent implements OnInit {

  @Output() diagnosisSelected = new EventEmitter<DiagnosisType>();

  selectedDiagnosis: DiagnosisType | null = null;

  ngOnInit() {
    // restore from localStorage if exists
    const saved = localStorage.getItem('diagnosis');
    if (saved) {
      this.selectedDiagnosis = saved as DiagnosisType;
    }
  }

  select(type: DiagnosisType) {
    this.selectedDiagnosis = type;

    // persist
    localStorage.setItem('diagnosis', type);

    // emit to parent
    this.diagnosisSelected.emit(type);
  }
}