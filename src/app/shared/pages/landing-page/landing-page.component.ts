import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  ArrowRight,
  Briefcase,
  Calendar,
  Car,
  ChevronDown,
  Home,
  Lock,
  MessageCircle,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Users,
  Zap,
  AlertCircle,
} from 'lucide-angular';
import { UserService } from '../../../user-security/services/user.service';
import { UserProfile } from '../../../user-security/models/user.model';
import {
  catchError,
  distinctUntilChanged,
  EMPTY,
  filter,
  map,
  merge,
  switchMap,
  tap,
} from 'rxjs';

function sameViewer(a: UserProfile | null, b: UserProfile | null): boolean {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.id === b.id && a.email === b.email;
}

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
})
export class LandingPageComponent {
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  readonly showProfileBanner = signal(false);

  readonly ArrowRightIcon = ArrowRight;
  readonly AlertCircleIcon = AlertCircle;
  readonly LockIcon = Lock;
  readonly ShieldIcon = Shield;
  readonly UsersIcon = Users;
  readonly SparklesIcon = Sparkles;
  readonly StarIcon = Star;
  readonly ChevronDownIcon = ChevronDown;

  readonly features = [
    {
      icon: Car,
      title: 'Carpooling',
      description:
        'Share rides with fellow ESPRIT students. Save money, reduce carbon footprint, and make new connections.',
      image:
        'https://images.unsplash.com/photo-1568225738236-9905545aa783?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZW9wbGUlMjBjYXJwb29saW5nJTIwY2FyJTIwcmlkZSUyMHNoYXJpbmd8ZW58MXx8fHwxNzczODczNjkzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      icon: Home,
      title: 'Colocation',
      description:
        'Find the perfect roommate match using our AI-powered compatibility system. Safe, verified, student-only housing.',
      image:
        'https://images.unsplash.com/photo-1701946147341-4a664af4325e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjByb29tbWF0ZXMlMjBsaXZpbmd8ZW58MXx8fHwxNzczODczNjkzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      icon: ShoppingBag,
      title: 'Marketplace',
      description:
        'Buy and sell student items securely. From textbooks to electronics, all within the trusted ESPRIT community.',
      image:
        'https://images.unsplash.com/photo-1638443436690-db587cc66f12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwbWFya2V0cGxhY2UlMjBib29rcyUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzczODczNjk0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      icon: Briefcase,
      title: 'Student Services',
      description:
        'Access tutoring, printing, delivery, and more. Students helping students succeed.',
      image:
        'https://images.unsplash.com/photo-1758270704524-596810e891b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwc3R1ZGVudHMlMjB1bml2ZXJzaXR5JTIwY2FtcHVzfGVufDF8fHx8MTc3Mzg0NDE1Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      icon: Calendar,
      title: 'Events',
      description:
        "Discover and join student events, workshops, and social gatherings. Never miss what's happening on campus.",
      image:
        'https://images.unsplash.com/photo-1701709304274-bd9e5402d979?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwZXZlbnQlMjBzdHVkZW50cyUyMGdhdGhlcmluZ3xlbnwxfHx8fDE3NzM4NzM2OTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      icon: MessageCircle,
      title: 'Real-time Chat',
      description:
        'Communicate instantly with verified students. Secure messaging for coordinating rides, viewings, and deals.',
      image:
        'https://images.unsplash.com/photo-1758270704524-596810e891b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwc3R1ZGVudHMlMjB1bml2ZXJzaXR5JTIwY2FtcHVzfGVufDF8fHx8MTc3Mzg0NDE1Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    },
  ];

  readonly aiFeatures = [
    {
      icon: Sparkles,
      title: 'Smart Matching',
      description:
        'AI-powered roommate and carpool matching based on preferences, schedules, and compatibility.',
    },
    {
      icon: Shield,
      title: 'Fraud Detection',
      description:
        'Advanced AI monitors all transactions and listings to protect you from scams and suspicious activity.',
    },
    {
      icon: Zap,
      title: 'Personalized Recommendations',
      description:
        'Get intelligent suggestions for services, events, and connections tailored to your student life.',
    },
  ];

  readonly steps = [
    {
      number: '01',
      title: 'Register with ESPRIT Email',
      description: 'Sign up using your official ESPRIT student email address.',
    },
    {
      number: '02',
      title: 'Admin Verification',
      description: 'Wait for admin approval to ensure a safe, students-only environment.',
    },
    {
      number: '03',
      title: 'Complete Your Profile',
      description: 'Add your preferences, schedule, and interests for better matches.',
    },
    {
      number: '04',
      title: 'Start Connecting',
      description: 'Find rides, roommates, deals, and events within the ESPRIT community.',
    },
  ];

  readonly testimonials = [
    {
      name: 'Sarah M.',
      role: 'Engineering Student',
      content:
        "Found my perfect roommate through ESPRIT Life! The AI matching really works - we're still living together after 2 years.",
      rating: 5,
    },
    {
      name: 'Ahmed K.',
      role: 'Business Student',
      content:
        "Saved over 500 DT this semester on carpooling alone. Plus I've made great friends along the way!",
      rating: 5,
    },
    {
      name: 'Leila B.',
      role: 'CS Student',
      content:
        'The marketplace is incredible. Sold my old laptop in 2 days and bought textbooks at half price. Totally trustworthy.',
      rating: 5,
    },
  ];

  readonly faqs = [
    {
      question: 'Who can join ESPRIT Life?',
      answer:
        'Only ESPRIT students with a valid @esprit.tn email address. All registrations are verified by our admin team to ensure a safe, students-only environment.',
    },
    {
      question: 'How does the AI matching work?',
      answer:
        'Our AI analyzes your preferences, schedule, personality traits, and habits to suggest the most compatible roommates and carpool partners. It learns from successful matches to improve recommendations.',
    },
    {
      question: 'Is my payment information secure?',
      answer:
        'Yes! We use Stripe, a industry-leading payment processor with bank-level security. We never store your card details on our servers.',
    },
    {
      question: 'What if I encounter a problem with another user?',
      answer:
        'You can report any user or listing through our platform. Our admin team reviews all reports within 24 hours and takes appropriate action, including account suspension if needed.',
    },
    {
      question: 'How much does it cost?',
      answer:
        'Basic access is free! Premium subscriptions unlock additional features like priority matching, unlimited messages, and advanced analytics. Check our pricing page for details.',
    },
    {
      question: 'Can I use ESPRIT Life on mobile?',
      answer:
        'Yes! Our platform is fully responsive and works seamlessly on all devices - phone, tablet, and desktop.',
    },
  ];

  readonly openFaq = signal<number | null>(null);

  constructor() {
    const userChanges$ = toObservable(this.userService.currentUser).pipe(
      distinctUntilChanged(sameViewer),
    );

    const homeNav$ = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      filter((e) => {
        const raw = e.urlAfterRedirects.split(/[?#]/)[0] || '/';
        const path = raw.replace(/\/+$/, '') || '/';
        return path === '/' || path === '';
      }),
      map(() => undefined),
    );

    merge(userChanges$, homeNav$)
      .pipe(
        switchMap(() => {
          const user = this.userService.currentUser();

          if (!user?.id) {
            this.showProfileBanner.set(false);
            return EMPTY;
          }

          const userId = Number(user.id);
          if (!Number.isFinite(userId)) {
            this.showProfileBanner.set(false);
            return EMPTY;
          }

          // HARD FORCE FOLLOWING
          try {
            if (localStorage.getItem(`coco_profile_ok_${user.id}`) === 'true') {
              this.showProfileBanner.set(false);
              return EMPTY;
            }
          } catch {}

          return this.userService.checkProfileExists(userId).pipe(
            tap((exists) => {
              this.showProfileBanner.set(!exists);
              try {
                localStorage.setItem(
                  `coco_profile_ok_${user.id}`,
                  exists ? 'true' : 'false',
                );
              } catch {
                // ignore
              }
            }),
            catchError((err: { status?: number }) => {
              console.error('Failed to check profile existence:', err);
              if (err?.status === 401) {
                void this.router.navigate(['/login']);
              } else {
                try {
                  const completed =
                    localStorage.getItem(`coco_profile_ok_${user.id}`) ===
                    'true';
                  this.showProfileBanner.set(!completed);
                } catch {
                  this.showProfileBanner.set(true);
                }
              }
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  toggleFaq(index: number): void {
    this.openFaq.update((value) => (value === index ? null : index));
  }

  ratingStars(rating: number): number[] {
    return Array.from({ length: rating }, (_, i) => i);
  }
}
