import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BillingService } from '../services/billing.service';
import { map, of } from 'rxjs';

export const paidUserGuard = () => {

  const router = inject(Router);
  const billing = inject(BillingService);

  const token = localStorage.getItem('access_token');

  // visitor or logged out
  if (!token) {
    return true;
  }

  return billing.getBillingStatus().pipe(

    map((status: any) => {

      if (status.plan_type === 'pro') {
        router.navigate(['/dashboard']);
        return false;
      }

      return true;

    })

  );

};