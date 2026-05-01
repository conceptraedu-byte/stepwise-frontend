import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillingService } from '../services/billing.service';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../services/chat.service';

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;

  // 🔥 ADD THESE
  input_mode?: 'short' | 'mcq';
  options?: string[];
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})


export class ChatComponent {

  

  @ViewChild('chatBody') chatBody!: ElementRef<HTMLDivElement>;

  messages: ChatMessage[] = [];
  userInput = '';
  isBotThinking = false;

 

  // streaming
STREAM_API_URL = 'https://stepwise-backend-1.onrender.com/chat/stream';  private abortController: AbortController | null = null;

  // typing illusion
  private typingQueue = '';
  private typingInterval: any = null;
  private TYPING_SPEED_MS = 18;

  // tutor UI state (frontend-only for now)
  isSocraticMode = false;
  currentStep = 1;
  totalSteps = 5;
  hintLevel = 0;

constructor(private billing: BillingService) {}
  // -----------------------------
  // Send message
  // -----------------------------
  sendMessage() {
    const text = this.userInput.trim();
    if (!text || this.isBotThinking) return;

    this.messages.push({ role: 'user', text });
    this.userInput = '';

    this.startStreaming(text);
  }

  // -----------------------------
  // Streaming + typing illusion
  // -----------------------------
  async startStreaming(userText: string) {
    const botMsg: ChatMessage = { role: 'bot', text: '' };
    this.messages.push(botMsg);
    this.isBotThinking = true;

    this.abortController = new AbortController();
    this.typingQueue = '';
    this.startTyping(botMsg);

    try {
      const response = await fetch(this.STREAM_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: 1,
          message: userText
        }),
        signal: this.abortController.signal
      });

      if (!response.body) throw new Error('No stream');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        this.typingQueue += decoder.decode(value, { stream: true });
      }

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        botMsg.text += '\n\n[Error while generating]';
      }
    } finally {
  const wait = setInterval(() => {

    if (this.typingQueue.length === 0) {

      clearInterval(wait);
      this.stopTyping();
      this.isBotThinking = false;
      this.abortController = null;

      // 🔥 refresh credits after response finishes
      this.billing.refreshBilling();

    }

  }, 50);
}
  }

  // -----------------------------
  // Typing engine (illusion)
  // -----------------------------
  private startTyping(botMsg: ChatMessage) {
    this.typingInterval = setInterval(() => {
      if (!this.typingQueue.length) return;

      const chunkSize = Math.random() > 0.7 ? 2 : 1;
      botMsg.text += this.typingQueue.slice(0, chunkSize);
      this.typingQueue = this.typingQueue.slice(chunkSize);

      this.autoScroll();
    }, this.TYPING_SPEED_MS);
  }

  private stopTyping() {
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
      this.typingInterval = null;
    }
  }

  // -----------------------------
  // Stop generation
  // -----------------------------
  stopGeneration() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      this.stopTyping();
      this.isBotThinking = false;
    }
  }

  // -----------------------------
  // Tutor controls (UI only)
  // -----------------------------
  requestHint() {
    this.hintLevel++;
    this.messages.push({
      role: 'bot',
      text: `Hint ${this.hintLevel}: (backend hook here)`
    });
  }

  explainStep() {
    this.messages.push({
      role: 'bot',
      text: `Explanation for step ${this.currentStep} (backend hook here)`
    });
    this.currentStep++;
  }

  // -----------------------------
  // Auto-scroll (smart)
  // -----------------------------
  private autoScroll() {
    const el = this.chatBody?.nativeElement;
    if (!el) return;

    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 120;

    if (nearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }

  // -----------------------------
  // New chat
  // -----------------------------
  newChat() {
    this.messages = [];
    this.userInput = '';
    this.isBotThinking = false;
    this.typingQueue = '';
    this.stopTyping();
    this.abortController = null;

    this.currentStep = 1;
    this.hintLevel = 0;
  }
}
