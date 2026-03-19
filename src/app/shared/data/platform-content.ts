export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
  accent: string;
  image: string;
}

export const platformFeatures: FeatureItem[] = [
  {
    icon: 'CP',
    title: 'Carpooling',
    description: 'Share rides with fellow ESPRIT students and cut costs with a safer, verified community.',
    accent: 'from-rose-100 to-rose-50',
    image: 'https://images.unsplash.com/photo-1568225738236-9905545aa783?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
  },
  {
    icon: 'CO',
    title: 'Colocation',
    description: 'Find the right roommate match with housing flows built for student life.',
    accent: 'from-amber-100 to-orange-50',
    image: 'https://images.unsplash.com/photo-1701946147341-4a664af4325e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
  },
  {
    icon: 'MK',
    title: 'Marketplace',
    description: 'Buy and sell books, devices, and essentials inside the trusted ESPRIT network.',
    accent: 'from-sky-100 to-cyan-50',
    image: 'https://images.unsplash.com/photo-1638443436690-db587cc66f12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
  },
  {
    icon: 'SV',
    title: 'Student Services',
    description: 'Access tutoring, printing, delivery, and peer-to-peer services in one place.',
    accent: 'from-emerald-100 to-teal-50',
    image: 'https://images.unsplash.com/photo-1758270704524-596810e891b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
  },
  {
    icon: 'EV',
    title: 'Events',
    description: 'Discover workshops, campus gatherings, and community moments you do not want to miss.',
    accent: 'from-violet-100 to-purple-50',
    image: 'https://images.unsplash.com/photo-1701709304274-bd9e5402d979?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
  },
  {
    icon: 'CH',
    title: 'Real-time Chat',
    description: 'Coordinate listings, rides, and plans quickly with a communication layer made for students.',
    accent: 'from-slate-200 to-slate-50',
    image: 'https://images.unsplash.com/photo-1758270704524-596810e891b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
  }
];

export const smartHighlights = [
  {
    title: 'Smart Matching',
    description: 'Recommendations for roommates and rides based on schedule, preferences, and compatibility.'
  },
  {
    title: 'Fraud Detection',
    description: 'Risk signals surface suspicious actions earlier to help keep listings and accounts clean.'
  },
  {
    title: 'Personalized Journey',
    description: 'A cleaner path to the right services, events, and trusted connections around campus.'
  }
];

export const onboardingSteps = [
  'Register with your ESPRIT email',
  'Wait for admin verification',
  'Complete your profile and preferences',
  'Start exploring services and communities'
];

export const testimonials = [
  {
    name: 'Sarah M.',
    role: 'Engineering Student',
    quote: 'The platform made it easier to find a roommate and manage student life in one place.'
  },
  {
    name: 'Ahmed K.',
    role: 'Business Student',
    quote: 'Carpooling alone saved me a real budget this semester, and the interface feels much clearer now.'
  },
  {
    name: 'Leila B.',
    role: 'CS Student',
    quote: 'Marketplace and events feel organized instead of scattered across separate tools.'
  }
];

export const faqItems = [
  {
    question: 'Who can join ESPRIT Life?',
    answer: 'Only users with an ESPRIT email can request access, and accounts go through verification.'
  },
  {
    question: 'Is the platform responsive?',
    answer: 'Yes, the layout has been structured to work on desktop, tablet, and mobile screens.'
  },
  {
    question: 'What happens after registration?',
    answer: 'The account remains pending until an admin validates the request, then the user is notified.'
  }
];

export const adminModules = [
  'Overview',
  'User Management',
  'Roles & Permissions',
  'Subscriptions',
  'Fraud Detection',
  'Carpooling',
  'Colocation',
  'Marketplace',
  'Services',
  'Events',
  'Chat Moderation',
  'Analytics'
];
