import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="feedback-page">
      <div class="mesh-gradient"></div>
      <div class="noise-overlay"></div>

      <div class="feedback-container">
        <div class="feedback-card">
          <div class="icon-wrapper">
            <i class="bi bi-check-circle-fill"></i>
          </div>
          <h1>Paiement Réussi !</h1>
          <p>Votre abonnement CoCo est désormais actif. Profitez d'une visibilité maximale et propulsez votre activité au niveau supérieur.</p>
          
          <div class="divider"></div>

          <button class="btn btn-red" routerLink="/subs-payment">Consulter mes offres</button>
        </div>

        <div class="trust-bar">
          <div class="trust-item">
            <i class="bi bi-shield-lock"></i>
            <span>Sécurisé par Stripe</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .feedback-page {
      min-height: 100vh;
      background-color: #f5f5f3;
      font-family: 'DM Sans', sans-serif;
      color: #0a0a0a;
      position: relative;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .mesh-gradient {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      background: radial-gradient(circle at 100% 0%, rgba(230, 48, 48, 0.05) 0%, transparent 40%);
    }

    .noise-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      opacity: 0.02;
      pointer-events: none;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3%3Cfilter id='noiseFilter'%3%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    }

    .feedback-container {
      position: relative;
      z-index: 2;
      width: 100%;
      max-width: 500px;
      padding: 2rem;
      text-align: center;
    }

    .feedback-card {
      background: #ffffff;
      padding: 4rem 3rem;
      border-radius: 32px;
      border: 1px solid #e8e8e8;
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.05);
      animation: fadeUp 0.8s cubic-bezier(0.165, 0.84, 0.44, 1) both;
    }

    .icon-wrapper {
      width: 80px;
      height: 80px;
      background: rgba(230, 48, 48, 0.1);
      color: #e63030;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0 auto 2.5rem;
      font-size: 3rem;
      animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.4s both;
    }

    h1 {
      font-family: 'Syne', sans-serif;
      font-size: 2.5rem;
      font-weight: 800;
      letter-spacing: -1px;
      margin-bottom: 1.5rem;
    }

    p {
      color: #888;
      line-height: 1.6;
      margin-bottom: 2.5rem;
      font-size: 1.1rem;
    }

    .divider {
      height: 1px;
      background: #e8e8e8;
      margin-bottom: 2.5rem;
    }

    .btn-red {
      width: 100%;
      padding: 1.25rem;
      border-radius: 12px;
      border: none;
      background: #e63030;
      color: white;
      font-weight: 700;
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 10px 20px -5px rgba(230, 48, 48, 0.4);

      &:hover {
        background: #cc2a2a;
        transform: translateY(-3px);
        box-shadow: 0 15px 25px -5px rgba(230, 48, 48, 0.5);
      }
    }

    .trust-bar {
      margin-top: 3rem;
      color: #888;
      font-size: 0.9rem;
      font-weight: 500;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;

      i { color: #0a0a0a; font-size: 1.1rem; }
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes popIn {
      from { transform: scale(0); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class PaymentSuccessComponent { }
