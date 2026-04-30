import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

interface ParticleEffect {
  x: number;
  y: number;
  life: number;
  vx: number;
  vy: number;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About implements OnInit, OnDestroy {
  private scrollObserver: IntersectionObserver | null = null;
  private animationFrameId: number | null = null;
  private particles: ParticleEffect[] = [];

  ngOnInit(): void {
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

  /**
   * Initialize intersection observer for scroll-triggered animations
   */
  private initializeScrollAnimations(): void {
    const observerOptions: IntersectionObserverInit = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px',
    };

    this.scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;

          // Add staggered animation to cards
          if (element.classList.contains('value-card')) {
            this.animateCardIn(element);
          }
          if (element.classList.contains('feature-card')) {
            this.animateCardIn(element);
          }
          if (element.classList.contains('step-card')) {
            this.animateCardIn(element);
          }
          if (element.classList.contains('user-card')) {
            this.animateCardIn(element);
          }

          // Stop observing after animation
          this.scrollObserver?.unobserve(element);
        }
      });
    }, observerOptions);

    // Observe all animated elements
    document.querySelectorAll(
      '.value-card, .feature-card, .step-card, .user-card'
    ).forEach((element) => {
      this.scrollObserver?.observe(element);
    });
  }

  /**
   * Animate cards in with stagger effect
   */
  private animateCardIn(element: HTMLElement): void {
    const parent = element.parentElement;
    const children = parent ? Array.from(parent.children) : [];
    const index = children.indexOf(element);

    // Add animation with delay
    element.style.animation = `fadeInUp 0.6s ease-out ${index * 0.1}s both`;
  }

  /**
   * Initialize interactive hover effects and particle generation
   */
  private initializeInteractiveElements(): void {
    // Enhanced button interactions
    this.setupButtonInteractions();

    // Card hover effects
    this.setupCardHoverEffects();

    // Smooth scroll behavior
    this.setupSmoothScroll();
  }

  /**
   * Setup interactive button behaviors
   */
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

  /**
   * Create ripple effect on button hover
   */
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

  /**
   * Create particle explosion effect on button click
   */
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

  /**
   * Animate particles using requestAnimationFrame
   */
  private animateParticles(): void {
    this.animationFrameId = requestAnimationFrame(() => {
      this.particles = this.particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
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

  /**
   * Setup card hover effects with enhanced visual feedback
   */
  private setupCardHoverEffects(): void {
    const cards = document.querySelectorAll(
      '.value-card, .feature-card, .step-card, .user-card'
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

  /**
   * Scale neighboring cards when one is hovered
   */
  private scaleNeighboringCards(hoveredCard: HTMLElement, scale: number): void {
    const parent = hoveredCard.parentElement;
    if (!parent) return;

    const siblings = Array.from(parent.children) as HTMLElement[];
    siblings.forEach((sibling) => {
      if (sibling !== hoveredCard && sibling.classList.contains('user-card')) {
        sibling.style.transform = `scale(${scale})`;
        sibling.style.transition = 'all 0.3s ease-out';
      }
    });
  }

  /**
   * Setup smooth scroll behavior for anchor links
   */
  private setupSmoothScroll(): void {
    document.querySelectorAll('a[routerLink]').forEach((link) => {
      link.addEventListener('click', (e) => {
        // Smooth scroll happens naturally with CSS, but we can add custom logic here
        const target = (e.target as HTMLElement).getAttribute('routerLink');
        if (target && target.startsWith('#')) {
          e.preventDefault();
          const element = document.querySelector(target);
          element?.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  /**
   * Handle external navigation
   */
  navigateToRegister(): void {
    // Navigation handled by routerLink
  }

  navigateToMockTest(): void {
    // Navigation handled by routerLink
  }
}