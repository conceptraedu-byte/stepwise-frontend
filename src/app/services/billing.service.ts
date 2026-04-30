import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export interface BillingPlan {
  name: string;
  price: number;
  currency: string;
  credits: number;
  mock_limit: number | null;
  features: string[];
}

@Injectable({
  providedIn: 'root'
})
export class BillingService {

  private API = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  private billingState = new BehaviorSubject<any>(null);
  billing$ = this.billingState.asObservable();

  getPlans(): Observable<{ plans: BillingPlan[] }> {
    return this.http.get<{ plans: BillingPlan[] }>(
      `${this.API}/billing/plans`
    );
  }

  getBillingStatus() {
    return this.http.get(`${this.API}/billing/status`);
  }

  canUpgrade() {
    return this.http.get(`${this.API}/billing/can-upgrade`);
  }

  createOrder() {
  return this.http.post<any>(
    `${this.API}/billing/create-order`,
    {}
  );
}

verifyPayment(data:any) {
  return this.http.post<any>(
    `${this.API}/billing/verify-payment`,
    data
  );
}

createExtraCreditsOrder() {
  return this.http.post(
    "http://localhost:8000/billing/create-extra-credits-order",
    {}
  );
}

verifyExtraCredits(data: any) {
  return this.http.post(
    "http://localhost:8000/billing/verify-extra-credits",
    data
  );
}

  refreshBilling() {
    this.getBillingStatus().subscribe({
      next: (res) => {
        this.billingState.next(res);
      }
    });
  }
}