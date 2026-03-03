import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-input.html',
  styleUrls: ['./chat-input.css']
})
export class ChatInputComponent {

  userInput = '';

  /** Controlled by parent (ChatArea / Workspace) */
  @Input() disabled = false;

  /** Emits raw user intent */
  @Output() send = new EventEmitter<string>();

  onSend() {
    const text = this.userInput.trim();
    if (!text || this.disabled) return;

    this.send.emit(text);
    this.userInput = '';
  }
}
