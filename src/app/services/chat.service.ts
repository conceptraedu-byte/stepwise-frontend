import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/* =========================
   RESPONSE TYPE (IMPORTANT)
========================= */
export interface ChatResponse {
  reply: string;
  structured?: any;
  metadata?: any;
  session_id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {

private BASE_URL = 'https://stepwise-backend-1.onrender.com';

private API_URL = `${this.BASE_URL}/chat`;
private LEARN_URL = `${this.BASE_URL}/learn`;
private STREAM_URL = `${this.BASE_URL}/chat/stream`;
private RESET_URL = `${this.BASE_URL}/chat/reset`;

  private abortController: AbortController | null = null;

  private sessionId: string;

  constructor(private http: HttpClient) {
    this.sessionId = this.getOrCreateSessionId();
  }

  /* =========================
     SESSION ID
  ========================= */
  private getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem('stepwise_session_id');

    if (!sessionId) {
      sessionId =
        'web_' +
        Date.now() +
        '_' +
        Math.random().toString(36).substring(2, 11);

      localStorage.setItem('stepwise_session_id', sessionId);
    }

    return sessionId;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  /* =========================
     GENERIC SEND
  ========================= */
  send(payload: any): Observable<any> {
    return this.http.post<any>(this.API_URL, {
      board: 'CBSE',
      reset: false,
      ...payload,
      session_id: this.sessionId
    });
  }

  /* =========================
     NORMAL CHAT (/chat)
  ========================= */
  sendMessage(
    message: string,
    board: string = 'CBSE',
    reset: boolean = false,
    diagnosis?: string
  ): Observable<ChatResponse> {

    return this.http.post<ChatResponse>(
      this.API_URL,
      {
        message,
        board,
        reset,
        session_id: this.sessionId,
        diagnosis
      }
    );
  }

  /* =========================
     LEARNING MODE (/learn)
  ========================= */
  learnMessage(
    message: string,
    board: string,
    topic: string
  ): Observable<ChatResponse> {

    return this.http.post<ChatResponse>(
      this.LEARN_URL,
      {
        message,
        board,
        topic,
        session_id: this.sessionId
      }
    );
  }

  /* =========================
     RESET SESSION
  ========================= */
  resetSession(): Observable<any> {

    const resetObs = this.http.post(this.RESET_URL, {
      session_id: this.sessionId
    });

    this.sessionId =
      'web_' +
      Date.now() +
      '_' +
      Math.random().toString(36).substring(2, 11);

    localStorage.setItem('stepwise_session_id', this.sessionId);

    return resetObs;
  }

  /* =========================
     STREAMING
  ========================= */
  async streamMessage(
    message: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (err: any) => void,
    board: string = 'CBSE'
  ) {
    try {
      this.stopStreaming();

      this.abortController = new AbortController();

      const response = await fetch(this.STREAM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          board,
          session_id: this.sessionId
        }),
        signal: this.abortController.signal
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        if (text) onChunk(text);
      }

      this.abortController = null;
      onComplete();

    } catch (err: any) {
      if (err.name === 'AbortError') return;

      console.error('Streaming error:', err);
      this.abortController = null;
      onError(err);
    }
  }

  stopStreaming() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /* =========================
     PRACTICE
  ========================= */

  generatePracticeQuestion(topic: string, confidence: number) {
  return this.http.post<any>(
    `${this.BASE_URL}/practice/generate`,
    {
      topic,
      confidence
    }
  );
}

problemsMessage(message: string, board: string) {
  return this.http.post<ChatResponse>(
    `${this.BASE_URL}/problems`,
    {
      message,
      board
    }
  );
}

  evaluatePractice(
    question: string,
    correctAnswer: string,
    studentAnswer: string,
    solutionSteps: string[]
  ) {
    return this.http.post<any>(
      '`${this.BASE_URL}/practice/evaluate`',
      {
        question,
        correct_answer: correctAnswer,
        student_answer: studentAnswer,
        solution_steps: solutionSteps
      }
    );
  }
}