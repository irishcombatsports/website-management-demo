export const clubConfig = {
  name: 'Training Club',
  tagline: 'Start Your Training Journey',
  address: '123 Main Street, Your Town',
  email: 'hello@trainingclub.example',
  instagram: '@trainingclub',
  primaryColor: '#8B2FC9',
  logoPath: '',
  paymentMode: 'offline',
  stripeEnabled: false,
  waitingListEnabled: false,
  schedule: [
    { day: 'Monday', classes: [{ time: '18:00', name: 'Fundamentals', level: 'Beginner friendly' }, { time: '19:00', name: 'Grappling', level: 'All levels' }] },
    { day: 'Wednesday', classes: [{ time: '18:00', name: 'Strength', level: 'All levels' }, { time: '19:00', name: 'Conditioning', level: 'Intermediate' }] },
    { day: 'Friday', classes: [{ time: '18:00', name: 'Mixed Training', level: 'All levels' }, { time: '19:00', name: 'Advanced Session', level: 'Coach approval' }] },
  ],
  memberships: [
    { type: 'free_class', label: 'Free Trial', price: 'Free', note: 'First class, confirmed by the club.' },
    { type: 'drop_in', label: 'Drop-In', price: 'Configurable', note: 'Single class where space is available.' },
    { type: 'monthly', label: 'Unlimited Monthly', price: 'Configurable', note: 'Runs to the end of the calendar month.', highlight: true },
    { type: 'limited_monthly', label: '2 Classes Weekly', price: 'Configurable', note: 'Two classes per week. Restricted sessions excluded.' },
  ],
};

export function applyTheme() {
  document.documentElement.style.setProperty('--primary', clubConfig.primaryColor);
}
