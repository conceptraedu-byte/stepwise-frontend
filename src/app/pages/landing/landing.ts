import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillingService, BillingPlan } from '../../services/billing.service';
import { Router, RouterModule } from '@angular/router';

interface ParticleEffect {
  x: number;
  y: number;
  life: number;
  vx: number;
  vy: number;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class Landing implements OnInit, OnDestroy {
  
  plans: BillingPlan[] = [];

  // user state
  isLoggedIn = false;
  currentPlan: string | null = null;
  canUpgrade = false;

  // animation state
  private scrollObserver: IntersectionObserver | null = null;
  private animationFrameId: number | null = null;
  private particles: ParticleEffect[] = [];

  constructor(private billingService: BillingService, private router: Router) {}

  ngOnInit(): void {
    this.loadPlans();
    this.loadUserBilling();
    this.initializeScrollAnimations();
    this.initializeInteractiveElements();
  }

  ngOnDestroy(): void {
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  /* ===== BILLING & PLANS ===== */

  loadPlans(): void {
    this.billingService.getPlans().subscribe({
      next: (res) => {
        this.plans = res.plans;
      },
      error: (err) => {
        console.error('Failed to load plans', err);
      }
    });
  }

  loadUserBilling(): void {
    const token = localStorage.getItem('access_token');

    if (!token) {
      this.isLoggedIn = false;
      this.currentPlan = null;
      this.canUpgrade = false;
      return;
    }

    this.isLoggedIn = true;

    this.billingService.getBillingStatus().subscribe({
      next: (status: any) => {
        this.currentPlan = (status.plan_type || 'free').toLowerCase();
        this.canUpgrade = this.currentPlan === 'free';
      },
      error: (err) => {
        console.error('Billing status error', err);
        this.currentPlan = 'free';
        this.canUpgrade = true;
      }
    });
  }

  upgradeToPro(): void {
    if (!this.isLoggedIn) {
      alert("Please login first.");
      return;
    }

    this.billingService.createOrder().subscribe({
      next: (order: any) => {
        const options: any = {
          key: order.razorpay_key,
          amount: order.amount,
          currency: order.currency,
          order_id: order.order_id,
          name: "Conceptra",
          description: "Pro Subscription",
          handler: (response: any) => {
            this.billingService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }).subscribe({
              next: () => {
                alert("Payment successful! Pro activated.");
                this.billingService.refreshBilling();
                this.loadUserBilling();
              },
              error: (err) => {
                console.error("Payment verification failed", err);
                alert("Payment verification failed.");
              }
            });
          },
          theme: {
            color: "#3b82f6"
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      },
      error: (err) => {
        console.error("Failed to create Razorpay order", err);
        alert("Unable to initiate payment.");
      }
    });
  }

  /* ===== ANIMATIONS ===== */

  private initializeScrollAnimations(): void {
    const observerOptions: IntersectionObserverInit = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px',
    };

    this.scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;

          if (element.classList.contains('user-segment-card') ||
              element.classList.contains('problem-card') ||
              element.classList.contains('step-item') ||
              element.classList.contains('feature-showcase-card') ||
              element.classList.contains('pricing-card')) {
            this.animateCardIn(element);
          }

          this.scrollObserver?.unobserve(element);
        }
      });
    }, observerOptions);

    document.querySelectorAll(
      '.user-segment-card, .problem-card, .step-item, .feature-showcase-card, .pricing-card'
    ).forEach((element) => {
      this.scrollObserver?.observe(element);
    });
  }

  private animateCardIn(element: HTMLElement): void {
    const parent = element.parentElement;
    const children = parent ? Array.from(parent.children) : [];
    const index = children.indexOf(element);

    element.style.animation = `fadeInUp 0.6s ease-out ${index * 0.1}s both`;
  }

  private initializeInteractiveElements(): void {
    this.setupButtonInteractions();
    this.setupCardHoverEffects();
    this.setupSmoothScroll();
  }

  private setupButtonInteractions(): void {
    const buttons = document.querySelectorAll('.btn');

    buttons.forEach((button) => {
      button.addEventListener('mouseenter', (e) => {
        this.createRippleEffect(e as MouseEvent);
      });

      button.addEventListener('click', (e) => {
        this.createParticleExplosion(e as MouseEvent);
      });
    });
  }

  private createRippleEffect(event: MouseEvent): void {
    const button = event.target as HTMLElement;
    if (!button.querySelector('.ripple')) {
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      ripple.style.left = `${event.clientX - button.getBoundingClientRect().left}px`;
      ripple.style.top = `${event.clientY - button.getBoundingClientRect().top}px`;
      button.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    }
  }

  private createParticleExplosion(event: MouseEvent): void {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      this.particles.push({
        x,
        y,
        life: 1,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
      });
    }

    if (!this.animationFrameId) {
      this.animateParticles();
    }
  }

  private animateParticles(): void {
    this.animationFrameId = requestAnimationFrame(() => {
      this.particles = this.particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life -= 0.02;
        return p.life > 0;
      });

      if (this.particles.length > 0) {
        this.animateParticles();
      } else {
        this.animationFrameId = null;
      }
    });
  }

  private setupCardHoverEffects(): void {
    const cards = document.querySelectorAll(
      '.user-segment-card, .problem-card, .step-item, .feature-showcase-card'
    );

    cards.forEach((card) => {
      card.addEventListener('mouseenter', (e) => {
        this.scaleNeighboringCards(e.target as HTMLElement, 0.95);
      });

      card.addEventListener('mouseleave', (e) => {
        this.scaleNeighboringCards(e.target as HTMLElement, 1);
      });
    });
  }

  private scaleNeighboringCards(hoveredCard: HTMLElement, scale: number): void {
    const parent = hoveredCard.parentElement;
    if (!parent) return;

    const siblings = Array.from(parent.children) as HTMLElement[];
    siblings.forEach((sibling) => {
      if (sibling !== hoveredCard) {
        sibling.style.transform = `scale(${scale})`;
        sibling.style.transition = 'all 0.3s ease-out';
      }
    });
  }

  private setupSmoothScroll(): void {
    document.querySelectorAll('a[routerLink]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).getAttribute('routerLink');
        if (target && target.startsWith('#')) {
          e.preventDefault();
          const element = document.querySelector(target);
          element?.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  // learnhow(){
  //   this.router.navigate('/dashboard/dashboard')
  // }
}