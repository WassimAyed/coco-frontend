import { Component, input, signal, computed, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  imagePreview?: string;
  timestamp: Date;
}

const FAQ: Array<{ keywords: string[]; answer: string }> = [
  {
    keywords: ['livraison', 'livrer', 'delivery', '7 dt', 'frais'],
    answer: 'Livraison Syrine Delivery : 7 DT pour les petits articles partout en Tunisie. Pour les articles volumineux le prix est negociable — envoyez une photo et on vous fait une offre sous 1h !'
  },
  {
    keywords: ['promo', 'code promo', 'reduction', 'discount', 'coupon'],
    answer: 'Codes promo disponibles : PROMO10 (-10%), FLASH20 (-20%), WELCOME15 (-15%), SYRINE5 (-5%). Entrez le code dans la barre "Code Promo" sur la page de l article !'
  },
  {
    keywords: ['reserver', 'reservation', 'reserve', 'bloquer'],
    answer: 'Pour reserver un article, cliquez sur "Reserver" sur la fiche produit. En section Vetements, chaque utilisateur peut reserver 1 seul article par session. Votre reservation est valable 24h.'
  },
  {
    keywords: ['contacter', 'vendeur', 'contact', 'whatsapp', 'telephone', 'message'],
    answer: 'Pour contacter un vendeur, cliquez sur "Contacter le vendeur" sur la fiche produit. Vous pourrez le joindre via WhatsApp ou email directement.'
  },
  {
    keywords: ['small business', 'business', 'grossiste', 'lot', 'professionnel', 'revendeur'],
    answer: 'Notre espace Small Business & Grow Up propose des lots a prix tres bas pour aider les petits entrepreneurs. Rendez-vous dans Speciaux > Small Business !'
  },
  {
    keywords: ['vente flash', 'flash', 'promotion', 'soldes', '50%', 'rabais'],
    answer: 'Notre Vente Flash MODE & BEAUTE offre -50% sur une selection de vetements, bijoux et accessoires pendant 24h ! Rendez-vous sur /flash-sales. Stocks tres limites !'
  },
  {
    keywords: ['speciaux', 'special', 'occasion', 'importation', 'importe'],
    answer: 'L espace Speciaux propose : Small Business, Accessoires Filles, Vetements (erreur de taille) et articles d Importation. Tous a prix tres accessibles !'
  },
  {
    keywords: ['payer', 'paiement', 'cib', 'virement', 'cash', 'carte'],
    answer: 'Methodes de paiement acceptees : CIB (STB, BNA, BIAT, Attijari, BH), Virement bancaire, Cash a la livraison (via Syrine Delivery ou contact vendeur).'
  },
  {
    keywords: ['signaler', 'probleme', 'arnaque', 'fraude', 'report'],
    answer: 'Pour signaler un article suspect, cliquez sur "Signaler" sur la fiche produit. Notre equipe verifie sous 24h et supprime tout contenu non conforme.'
  },
  {
    keywords: ['avis', 'note', 'evaluation', 'review', 'commentaire'],
    answer: 'Vous pouvez laisser un avis sur chaque article via le bouton "Avis". Les avis aident la communaute a faire les meilleurs choix !'
  },
  {
    keywords: ['photo', 'image', 'envoyer photo'],
    answer: 'Photo recue ! Je transmets ca a notre equipe Syrine Delivery. Vous recevrez une estimation de prix de livraison dans les plus brefs delais (generalement sous 30 min).'
  },
  {
    keywords: ['bonjour', 'salut', 'hello', 'bonsoir', 'salam'],
    answer: 'Bonjour ! Je suis l Assistant Coco Market. Je peux vous aider avec la livraison, les codes promo, les reservations, les paiements et bien plus encore. Par quoi puis-je commencer ?'
  },
  {
    keywords: ['merci', 'parfait', 'super', 'nickel'],
    answer: 'Avec plaisir ! N hesitez pas a revenir si vous avez d autres questions. Bonne navigation sur Coco Market !'
  },
];

const DEFAULT_REPLY = "Je n ai pas bien compris votre question. Vous pouvez me demander a propos de : livraison, codes promo, reservation, paiement, contact vendeur, vente flash, ou articles speciaux. Ou envoyez une photo de l article !";

@Component({
  selector: 'app-syrine-delivery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './syrine-delivery.component.html',
  styleUrls: ['./syrine-delivery.component.scss']
})
export class SyrineDeliveryComponent implements AfterViewChecked {
  @ViewChild('chatBody') chatBodyRef?: ElementRef<HTMLDivElement>;

  readonly isLargeItem = input<boolean>(false);

  readonly showModal = signal(false);
  readonly messages = signal<ChatMessage[]>([]);
  readonly userInput = signal('');
  readonly botTyping = signal(false);

  readonly deliveryCost = computed(() => this.isLargeItem() ? null : 7);

  private scrollPending = false;

  ngAfterViewChecked(): void {
    if (this.scrollPending) {
      this.scrollToBottom();
      this.scrollPending = false;
    }
  }

  openChat(): void {
    this.showModal.set(true);
    if (this.messages().length === 0) {
      setTimeout(() => {
        this.addBotMessage('Bonjour ! Je suis l Assistant Coco Market. Je peux vous aider avec la livraison, les codes promo, les reservations, les paiements et bien plus encore. Par quoi puis-je commencer ?');
      }, 400);
    }
  }

  closeChat(): void {
    this.showModal.set(false);
  }

  setInput(val: string): void {
    this.userInput.set(val);
  }

  send(): void {
    const text = this.userInput().trim();
    if (!text) return;
    this.addUserMessage(text);
    this.userInput.set('');
    this.botTyping.set(true);
    setTimeout(() => this.addBotMessage(this.getReply(text)), 900);
  }

  private readonly aiDetectionMessages = [
    '\uD83D\uDD0D Analyse IA : article de salon detecte. Livraison : 12 DT. Disponible sous 2h !',
    '\uD83E\uDD16 IA : article volumineux (Chambre). Livraison 2 livreurs : 18 DT. Sous 24h.',
    '\uD83D\uDCF8 Photo analysee ! Style vintage detecte. Livraison soignee : 15 DT. Emballage bulle inclus.',
    '\uD83D\uDE9A Dimensions estimees : article moyen. Syrine Express : 9 DT. Livraison J+1.',
    '\u2728 IA Coco : article fragile. Livraison premium avec assurance : 20 DT. Nos soins garantis !',
  ];
  private aiDetectionIndex = 0;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      this.addUserMessage('Photo envoyee', preview);
      this.botTyping.set(true);
      const aiMsg = this.aiDetectionMessages[this.aiDetectionIndex % this.aiDetectionMessages.length];
      this.aiDetectionIndex++;
      setTimeout(() => this.addBotMessage(aiMsg), 1400);
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  private getReply(text: string): string {
    const lower = text.toLowerCase();
    for (const faq of FAQ) {
      if (faq.keywords.some(k => lower.includes(k))) {
        return faq.answer;
      }
    }
    return DEFAULT_REPLY;
  }

  private addUserMessage(text: string, imagePreview?: string): void {
    this.messages.update(msgs => [...msgs, { role: 'user', text, imagePreview, timestamp: new Date() }]);
    this.scrollPending = true;
  }

  private addBotMessage(text: string): void {
    this.messages.update(msgs => [...msgs, { role: 'bot', text, timestamp: new Date() }]);
    this.botTyping.set(false);
    this.scrollPending = true;
  }

  private scrollToBottom(): void {
    const el = this.chatBodyRef?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
