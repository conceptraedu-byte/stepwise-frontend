import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private API_URL = 'http://localhost:8000/chat';
  private STREAM_URL = 'http://localhost:8000/chat/stream';
  private RESET_URL = 'http://localhost:8000/chat/reset';

  private abortController: AbortController | null = null;

  // 🔑 SESSION MANAGEMENT
  private sessionId: string;

  constructor(private http: HttpClient) {
    this.sessionId = this.getOrCreateSessionId();
  }

  /* =========================
     SESSION ID MANAGEMENT
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
     GENERIC SEND (NEW)
     This supports:
     - message
     - diagnosis
     - clarification
     - verification_answers
     - reset
     - board
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
     LEGACY SEND MESSAGE (KEEP)
     ========================= */
  sendMessage(
    message: string,
    board: string = 'CBSE',
    reset: boolean = false,
    diagnosis?: string
  ): Observable<{ reply: string; session_id?: number; metadata?: any }> {

    return this.http.post<{ reply: string; session_id?: number; metadata?: any }>(
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
     STREAMING CHAT
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

      if (!response.body) {
        throw new Error('No response body');
      }

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

  /* =========================
     STOP STREAMING
     ========================= */
  stopStreaming() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /* =========================
     METADATA
     ========================= */
  getSessionMetadata(): string {
    return this.sessionId;
  }
}