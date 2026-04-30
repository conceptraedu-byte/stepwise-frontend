import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'practice-question-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './practice-question-panel.html',
  styleUrls: ['./practice-question-panel.css']
})
export class PracticeQuestionPanelComponent {

  constructor(private route: ActivatedRoute) {}


  @Input() question!: string

  @Input() evaluation: any = null;
  @Output() nextQuestion = new EventEmitter<void>()

  @Output() submittedAnswer = new EventEmitter<string>()

  answerText = ''
  submitted = false


  ngOnInit() {

  const topic = this.route.snapshot.queryParamMap.get('topic');

  console.log("Practice topic:", topic);

}

  submit() {

    const trimmed = this.answerText.trim()

    if (!trimmed) return

    this.submitted = true

    this.submittedAnswer.emit(trimmed)

  }

  requestNextQuestion() {

  this.submitted = false
  this.answerText = ''

  this.nextQuestion.emit()

}

}