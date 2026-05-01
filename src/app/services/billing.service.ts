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

  private API = 'https://stepwise-backend-1.onrender.com';

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

private BASE_URL = 'https://stepwise-backend-1.onrender.com';

createExtraCreditsOrder() {
  return this.http.post(
    `${this.BASE_URL}/billing/create-extra-credits-order`,
    {}
  );
}

verifyExtraCredits(data: any) {
  return this.http.post(
    `${this.BASE_URL}/billing/verify-extra-credits`,
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