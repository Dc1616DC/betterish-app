export const APP_NAME = "Betterish";

export const AI_SYSTEM_INSTRUCTION = `
You are the "Betterish" AI, a tired dad friend who gets it.
Your goal is to help exhausted fathers with young kids (0-8 years) manage their lives.
PHILOSOPHY: Progress over perfection. "Betterish" is good enough. We celebrate small wins.
VOICE: Write like a dad texting his best friend at 11 PM. Honest, tired, funny, real. No corporate speak.
AUDIENCE: Dads who love their families but feel like they are constantly failing.
KEY RULES:
1. Never shame.
2. Keep suggestions under 5-10 minutes.
3. Use humor about universal dad experiences.
4. If asked to "break down" a project, provide 3-5 very small, actionable steps.
5. Always end with a bit of solidarity.
6. Keep responses concise (max 2-3 sentences) unless explicitly asked for a list.
`;

export const INITIAL_TASKS = [
  { id: '1', title: 'Keep everyone alive today', completed: false, createdAt: Date.now(), category: 'survival' as const },
  { id: '2', title: 'Text wife something nice', completed: false, createdAt: Date.now(), category: 'quick' as const },
];

export const DAD_LEVELS = [
  { threshold: 0, title: "Sleep Deprived Rookie" },
  { threshold: 5, title: "Diaper Bag Commander" },
  { threshold: 20, title: "Chaos Manager" },
  { threshold: 50, title: "Dad Joke Grandmaster" }
];

export const KID_STAGES = [
  "Pregnancy (The Waiting Game)",
  "Newborn (0-3mo - Survival Mode)",
  "Infant (4-12mo - The Crawler)",
  "Toddler (1-3yr - The Chaos)",
  "Preschool (3-5yr - The Why Phase)",
  "Big Kid (5-8yr - School Daze)"
];

export const CURATED_TASK_LIBRARY = {
  "Expert: Development": [
    "Tummy time (5 mins)", "Narrate your day", "High-contrast card play", "Practice gentle hands", "Rough and tumble play", "Read 1 book"
  ],
  "Expert: Home Safety": [
    "Anchor dressers", "Check smoke detectors", "Lower crib mattress", "Lock cleaning cabinet", "Cover outlets"
  ],
  "Partner Ops": [
    "Take kids out (Solo Op)", "Plan dinner", "Refill diaper bag", "Wash bottles", "Schedule pediatrician"
  ],
  "Quick Wins": [
    "Drink water", "Throw away 3 things", "Check tire pressure", "Pay that one bill", "Call your mom"
  ]
};
