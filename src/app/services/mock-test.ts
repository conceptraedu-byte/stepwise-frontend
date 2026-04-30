import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/* ================= INTERFACES ================= */

export interface MockQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface MockStartResponse {
  session_id: string;
  questions: MockQuestion[];
  selected_answers: { [questionId: string]: number };
  current_question_index: number;
  duration: number;      // in seconds
  started_at: number;    // UNIX timestamp (seconds)
}

export interface MockSubmitResponse {
  score: number;
  total: number;
  accuracy: number;
  results: any[];
}

/* ================= SERVICE ================= */

@Injectable({
  providedIn: 'root'
})
export class MockTestService {

  private baseUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  /* ================= START SESSION ================= */

  startMockSession(
    count: number,
    durationMinutes: number,
    subject: string,
    classLevel: number,
    chapter?: string
  ): Observable<MockStartResponse> {

    const token = localStorage.getItem('token');

    let url = `${this.baseUrl}/mock/start?count=${count}&duration=${durationMinutes}&subject=${subject}&class_level=${classLevel}`;

    if (chapter && chapter.trim() !== '') {
      url += `&chapter=${encodeURIComponent(chapter)}`;
    }

    return this.http.post<MockStartResponse>(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }



  resumeMockSession(): Observable<any> {

  const token = localStorage.getItem('token');

  return this.http.get<any>(
    `${this.baseUrl}/mock/resume`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
}


getMockHistory(): Observable<any[]> {

  const token = localStorage.getItem('token');

  return this.http.get<any[]>(
    `${this.baseUrl}/mock/history`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
}



/*================Save answer================*/

saveAnswer(
  sessionId: string,
  questionId: string,
  selectedOption: number,
  currentIndex: number
  
): Observable<any> {

  const token = localStorage.getItem('token');

  return this.http.post(
    `${this.baseUrl}/mock/save-answer`,
    {
      session_id: sessionId,
      question_id: questionId,
      selected_option: selectedOption,
      current_index: currentIndex
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
}

  /* ================= SUBMIT TEST ================= */

  submitMockTest(data: {
  session_id: string;
  answers: Record<string, number>;
}): Observable<MockSubmitResponse> {

  const token = localStorage.getItem('token');

  return this.http.post<MockSubmitResponse>(
    `${this.baseUrl}/mock-test/submit`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
}

}