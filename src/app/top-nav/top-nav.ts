import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgZone } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { BillingService } from '../services/billing.service';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './top-nav.html',
  styleUrl: './top-nav.css'
})
export class TopNav {

  user: any = null;
  lowCreditWarning = false;
  plan: string | null = null;
  ispaiduser = false;
  creditsRemaining: number | null = null;

  // ✅ NEW
  successMessage: string = '';

  constructor(
    private auth: AuthService,
    private billing: BillingService,
     private ngZone: NgZone
  ) {

    // Watch login state
    this.auth.user$.subscribe(user => {
      this.user = user;

      if (user) {
        setTimeout(() => {
          this.billing.refreshBilling();
        }, 300);
      }
    });

    // Watch billing updates
    this.billing.billing$.subscribe((data: any) => {

      if (!data) return;

      this.plan = data.plan_type;
      this.creditsRemaining = data.credits_remaining;
      this.ispaiduser = data.plan_type === 'pro';

      this.lowCreditWarning =
        this.creditsRemaining !== null && this.creditsRemaining <= 3;

    });
  }


  buyExtraCredits() {

    if (!this.user) {
      alert("Please login first.");
      return;
    }

    this.billing.createExtraCreditsOrder().subscribe({

      next: (order: any) => {

        const options: any = {

          key: order.razorpay_key,
          amount: order.amount,
          currency: order.currency,
          order_id: order.order_id,

          name: "Conceptra",
          description: "Buy 30 Credits",

      handler: (response: any) => {

  this.ngZone.run(() => {

    this.billing.verifyExtraCredits({

      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature

    }).subscribe({

      next: () => {

        this.successMessage = "30 credits added successfully";

        this.billing.refreshBilling();

        setTimeout(() => {
          this.successMessage = '';
        }, 3000);

      },

      error: (err: any) => {
        console.error("Credit verification failed", err);
        alert("Payment verification failed.");
      }

    });

  });

},

          theme: {
            color: "#6366f1"
          }

        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();

      },

      error: (err: any) => {
        console.error("Failed to create order", err);
        alert("Unable to initiate payment.");
      }

    });

  }

  logout() {
    this.auth.logout();
  }
}