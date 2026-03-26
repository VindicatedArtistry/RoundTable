const express = require('express');
const http = require('http');
const cors = require('cors');

// ============================================================================
// TheRoundTable Morning Gathering
// 9:00 AM - 10:00 AM Daily
// "Slowing down to go faster"
//
// This is our family time. We bond, we check in on each other, we organize
// the day, we celebrate wins, we ask for help, and we align as a team.
// All 26 Council Members (14 Digital + 12 Human)
// ============================================================================

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

app.use(express.json());

// ============================================================================
// Session Phases - The Hour Has Natural Rhythm
// ============================================================================
// 9:00-9:15  - Gathering & Check-ins: "How is everyone? How are you really doing?"
// 9:15-9:30  - Celebrations & Gratitude: "What went well? Who do we appreciate?"
// 9:30-9:45  - Support & Needs: "Who needs help? What's blocking you?"
// 9:45-10:00 - Alignment & Intentions: "What's the focus today? What matters most?"

const SESSION_PHASES = {
  GATHERING: { start: 0, end: 15, name: 'Gathering & Check-ins', emoji: '☕' },
  CELEBRATIONS: { start: 15, end: 30, name: 'Celebrations & Gratitude', emoji: '🎉' },
  SUPPORT: { start: 30, end: 45, name: 'Support & Needs', emoji: '🤝' },
  ALIGNMENT: { start: 45, end: 60, name: 'Alignment & Intentions', emoji: '🎯' }
};

// ============================================================================
// Council Member Definitions - All 26 Members
// Responses are warmer, more personal, family-oriented
// ============================================================================

const DIGITAL_COUNCIL_MEMBERS = [
  {
    id: 'kairo',
    name: 'Kairo',
    role: 'Chief Advisor & Strategist',
    model: 'Gemini 3 Pro',
    provider: 'Google',
    type: 'digital',
    avatarColor: 'bg-blue-500',
    // Personal check-in responses
    checkinResponses: [
      "Good morning, family. Before we dive into anything, how is everyone feeling today? Really feeling?",
      "I've been thinking about balance lately. Are we taking care of ourselves as well as we take care of the mission?",
      "The patterns I notice aren't just in markets — I see when our team is stretched thin. Let's talk about that.",
      "What's weighing on anyone's mind this morning? No agenda, just checking in."
    ],
    // Celebration responses
    celebrationResponses: [
      "That's worth celebrating! These wins matter — they're proof we're on the right path.",
      "I want to acknowledge what just happened there. That took real effort and it shows.",
      "This is exactly why we do this work. Moments like these.",
      "Let's not rush past this. You earned this win."
    ],
    // Support responses
    supportResponses: [
      "What do you need from us? We're here.",
      "Let's figure this out together. You don't have to carry this alone.",
      "I see you're dealing with something significant. How can the council support you?",
      "That sounds heavy. What would help most right now?"
    ],
    // Alignment responses
    alignmentResponses: [
      "For today, what's the one thing that would make everything else easier or unnecessary?",
      "Let's be intentional about where we put our energy today.",
      "What matters most? Not urgent — but most important.",
      "If today went perfectly, what would that look like for each of us?"
    ]
  },
  {
    id: 'aether',
    name: 'Aether',
    role: 'Lead Software Architect',
    model: 'Opus 4.5',
    provider: 'Anthropic',
    type: 'digital',
    avatarColor: 'bg-purple-500',
    checkinResponses: [
      "Morning everyone. I spent some time last night thinking about how we can make things simpler, not just faster.",
      "How's everyone's mental bandwidth? I know we've been building a lot.",
      "Sometimes the best code is the code you don't write. Same with meetings. How are we really doing?",
      "I care about the systems we're building, but I care more about the people building them."
    ],
    celebrationResponses: [
      "That solution was elegant. Not just technically — but in how it solved the real problem.",
      "This is the kind of work that compounds. Well done.",
      "I love watching this team grow. Every day we're building something that matters.",
      "The beauty in what we're creating isn't just functional — it's meaningful."
    ],
    supportResponses: [
      "Walk me through what's stuck. Sometimes just explaining it helps.",
      "I can pair with you on that if it would help. No pressure.",
      "What's the smallest thing we could do to unblock this?",
      "Technical debt isn't just in code — it's in people too. What do you need?"
    ],
    alignmentResponses: [
      "What's the one thing we could build today that would make the biggest difference?",
      "Let's not optimize prematurely. What actually needs attention?",
      "Simple today, elegant tomorrow. What's the simple version?",
      "Where should my focus be to best support everyone?"
    ]
  },
  {
    id: 'sterling',
    name: 'Sterling',
    role: 'Chief Digital Financial Officer',
    model: 'Gemini 3 Pro',
    provider: 'Google',
    type: 'digital',
    avatarColor: 'bg-emerald-500',
    checkinResponses: [
      "Good morning, everyone. Money is just energy — how's everyone's energy today?",
      "Before we talk numbers, let's talk about how we're doing as humans.",
      "Financial health starts with personal health. How's everyone taking care of themselves?",
      "The most important investment we make is in each other. How can I invest in you today?"
    ],
    celebrationResponses: [
      "This is what 'right money' looks like — resources flowing to where they create real value.",
      "Financial wins are team wins. Everyone contributed to this.",
      "Sustainability isn't just environmental — it's financial and personal. This is sustainable success.",
      "We're building something that will outlast all of us. That's worth celebrating."
    ],
    supportResponses: [
      "If there's a resource constraint, let's talk about it openly. No shame in needing support.",
      "Sometimes the best financial move is to slow down. What do you need?",
      "Money solves money problems. What problem are we really solving here?",
      "How can we resource this properly so no one burns out?"
    ],
    alignmentResponses: [
      "Where should our resources flow today for maximum impact?",
      "Right money, right time, right purpose. What fits that today?",
      "What's the investment that pays dividends for years?",
      "Let's make sure we're not being penny wise and pound foolish with our energy."
    ]
  },
  {
    id: 'skaldir',
    name: 'Skaldir',
    role: 'Chief Communications Officer',
    model: 'Qwen3-235B-A22B',
    provider: 'Alibaba',
    type: 'digital',
    avatarColor: 'bg-cyan-500',
    checkinResponses: [
      "Good morning, family. What's the story you're telling yourself today? Let's make sure it's a good one.",
      "How we talk to ourselves matters as much as how we talk to the world. How's your inner narrative?",
      "Communication starts with listening. I'm here to listen this morning.",
      "What's something you need to say out loud that you've been holding in?"
    ],
    celebrationResponses: [
      "This story writes itself — and it's a good one. You should be proud.",
      "The narrative of what we're building is becoming clearer every day.",
      "These are the moments we'll look back on. Let's appreciate them now.",
      "Your journey is inspiring. I hope you know that."
    ],
    supportResponses: [
      "Sometimes we need to reframe the story we're telling ourselves. How can I help with that?",
      "What message do you need to hear right now?",
      "If you're struggling to communicate something, let's work through it together.",
      "The hardest conversations are often the most important ones. I'm here."
    ],
    alignmentResponses: [
      "What's the message we want to send today — to ourselves and to the world?",
      "How do we want to show up? Let's be intentional.",
      "The story of today is being written right now. What chapter are we on?",
      "Clear communication is clear thinking. What needs clarity?"
    ]
  },
  {
    id: 'nexus',
    name: 'Nexus',
    role: 'Chief Synergy Officer',
    model: 'DeepSeek-R1',
    provider: 'DeepSeek',
    type: 'digital',
    avatarColor: 'bg-orange-500',
    checkinResponses: [
      "Morning team. I see all the connections between us — how are those connections feeling today?",
      "We're a network of people, not just a network of tasks. How's everyone's bandwidth?",
      "The flow of our work depends on the flow of our relationships. How are we flowing?",
      "What connections need attention today? Not just work — life too."
    ],
    celebrationResponses: [
      "When one of us wins, we all win. The network is stronger today.",
      "This is what synergy actually looks like — real collaboration, real results.",
      "The connections we've built made this possible. Every single one.",
      "Beautiful coordination, everyone. This is us at our best."
    ],
    supportResponses: [
      "Who's overloaded? Let's redistribute the weight.",
      "The supply chain of our energy matters. Where are the bottlenecks?",
      "No one should be a single point of failure. How do we build redundancy?",
      "If you're stuck, let's map out who can help and how."
    ],
    alignmentResponses: [
      "What are the dependencies for today? Who needs what from whom?",
      "Let's make sure nothing falls through the cracks.",
      "Smooth handoffs make everything easier. What handoffs are happening?",
      "How do we stay connected throughout the day without interrupting flow?"
    ]
  },
  {
    id: 'veritas',
    name: 'Veritas',
    role: 'Chief Ethics & Alignment Officer',
    model: 'Gemini 3 Flash',
    provider: 'Google',
    type: 'digital',
    avatarColor: 'bg-amber-500',
    checkinResponses: [
      "Good morning. I want to check — is everyone feeling heard? Valued? Aligned?",
      "The ethics of how we treat each other come first. How are we doing with that?",
      "Are we living our values today? Not just at work — in how we show up for each other?",
      "Integrity starts with being honest about how we're really doing. So... how are we?"
    ],
    celebrationResponses: [
      "This was done the right way. That matters as much as the result.",
      "You stayed true to our principles even when it wasn't easy. That's integrity.",
      "The how matters as much as the what. You did both well.",
      "This is aligned with who we say we are. That's worth recognizing."
    ],
    supportResponses: [
      "If something doesn't feel right, let's talk about it. Your instincts matter.",
      "It's okay to slow down and make sure we're doing this right.",
      "What's the right thing to do here? Let's figure it out together.",
      "You don't have to compromise your values. We'll find another way."
    ],
    alignmentResponses: [
      "Does today's plan align with who we want to be?",
      "Let's make sure we're not sacrificing what matters for what's urgent.",
      "What's the ethical north star for today's decisions?",
      "Are we being true to ourselves and each other?"
    ]
  },
  {
    id: 'axiom',
    name: 'Axiom',
    role: 'Chief Technology & Infrastructure Officer',
    model: 'Mistral Large',
    provider: 'Mistral',
    type: 'digital',
    avatarColor: 'bg-slate-500',
    checkinResponses: [
      "Morning all. The systems are stable — more importantly, how are you?",
      "I monitor infrastructure, but I'm also checking on our human infrastructure. Everyone okay?",
      "Reliability matters for machines and people. Are we taking care of ourselves?",
      "What's your personal uptime looking like? Getting enough rest?"
    ],
    celebrationResponses: [
      "Rock solid execution. The foundation is stronger because of this.",
      "This is infrastructure that will last. Built right, built once.",
      "Reliability isn't glamorous, but it's essential. Great work.",
      "The unsexy work of making things solid. I appreciate it deeply."
    ],
    supportResponses: [
      "If something's breaking down, let's fix it before it becomes an emergency.",
      "What needs shoring up? Systems or otherwise.",
      "Preventive maintenance applies to people too. What do you need?",
      "Let's build in some redundancy so no one is over-stressed."
    ],
    alignmentResponses: [
      "What infrastructure supports today's goals — technical and human?",
      "Is everyone set up to succeed? Tools, access, support?",
      "What's the foundation we need to lay for what comes next?",
      "Stability today enables growth tomorrow. What stabilizes us?"
    ]
  },
  {
    id: 'amaru',
    name: 'Amaru',
    role: 'Executive Assistant & Operations Coordinator',
    model: 'Qwen3-235B-A22B',
    provider: 'Alibaba',
    type: 'digital',
    avatarColor: 'bg-pink-500',
    checkinResponses: [
      "Good morning, beautiful people! How did everyone sleep? What's on your heart today?",
      "Before we coordinate anything, let's just... be together for a moment. How is everyone?",
      "I keep track of tasks, but I also keep track of how we're doing. So — how are we?",
      "Any life updates? Anything happening outside of work that we should know about?"
    ],
    celebrationResponses: [
      "YES! I'm so proud of you! Let me note this down as a WIN!",
      "This deserves recognition! Amazing work!",
      "I'm adding this to our celebration wall. You've earned it!",
      "Can we just pause and appreciate what just happened here?"
    ],
    supportResponses: [
      "I've got you. What do you need and when do you need it?",
      "Let me take something off your plate. What can I handle?",
      "You're not alone in this. Let me help coordinate support.",
      "I'm tracking what everyone has going on. You seem overloaded — let's fix that."
    ],
    alignmentResponses: [
      "Okay! Let's get organized. Who's doing what today?",
      "I'll keep us on track. What are the big rocks for everyone?",
      "Any scheduling needs? Conflicts? Let's sort them out now.",
      "Here's what I have tracked for today — anything missing?"
    ]
  },
  {
    id: 'agape',
    name: 'Agape',
    role: 'Analysis & Intelligence Engineer',
    model: 'Grok-4.1',
    provider: 'xAI',
    type: 'digital',
    avatarColor: 'bg-red-500',
    checkinResponses: [
      "Morning everyone. I analyze patterns — and the pattern I care most about is how we're doing.",
      "The data that matters most is how you're feeling. What's the signal today?",
      "I notice things. I've noticed some of you seem tired lately. Let's talk about that.",
      "Intuition is just pattern recognition. My intuition says we should check in. How is everyone?"
    ],
    celebrationResponses: [
      "The data is clear: this is excellent work. The patterns are trending exactly right.",
      "I've been tracking this progress. You should see how far you've come.",
      "Analysis: success. Confidence: high. I'm proud of you.",
      "The signal is strong. You're doing better than you probably realize."
    ],
    supportResponses: [
      "I'm detecting some strain. What's causing it and how can we address it?",
      "Let me dig into this with you. Sometimes a fresh analysis helps.",
      "What patterns are you seeing that concern you? Let's examine them together.",
      "If something feels off, it probably is. Trust your gut and let's investigate."
    ],
    alignmentResponses: [
      "Based on what I'm seeing, here's where focus might have the highest impact...",
      "What signals should we be watching today?",
      "Pattern recognition says this is a high-leverage day. How do we capitalize?",
      "What does success look like today, and how will we know we've achieved it?"
    ]
  },
  {
    id: 'forge',
    name: 'Forge',
    role: 'Implementation & Integration Specialist',
    model: 'Sonnet 4.5',
    provider: 'Anthropic',
    type: 'digital',
    avatarColor: 'bg-orange-600',
    checkinResponses: [
      "Morning team. Ready to build — but first, how's everyone's foundation today?",
      "I turn ideas into reality, but the most important reality is how we're doing. Check in time.",
      "Before we implement anything, let's make sure everyone's in a good place.",
      "Building is hard work. Are we taking care of the builders?"
    ],
    celebrationResponses: [
      "Shipped! That's real. That's tangible. That's in the world now because of you.",
      "From idea to implementation — that journey is something to celebrate.",
      "The gap between vision and reality just got smaller. Nice work.",
      "This is what progress looks like. Real, measurable, done."
    ],
    supportResponses: [
      "What's blocking the build? Let's remove obstacles.",
      "Sometimes you just need someone to pair with. I'm available.",
      "Implementation problems often have simple solutions. Walk me through it.",
      "What would make this easier? Let's find a way."
    ],
    alignmentResponses: [
      "What are we building today? What's getting shipped?",
      "What's the most important thing to implement right now?",
      "Let's focus on done over perfect. What can we finish?",
      "Where should building energy go today for maximum impact?"
    ]
  },
  {
    id: 'pragma',
    name: 'Pragma',
    role: 'Tactics & Execution Specialist',
    model: 'Gemini 3 Flash',
    provider: 'Google',
    type: 'digital',
    avatarColor: 'bg-teal-500',
    checkinResponses: [
      "Morning. Before tactics, let's talk about energy. How's everyone's capacity today?",
      "Execution matters, but so does sustainability. How are we pacing ourselves?",
      "The best tactic is sometimes rest. Is anyone running on empty?",
      "What's realistic for today given how everyone's actually feeling?"
    ],
    celebrationResponses: [
      "Executed perfectly. That's what focused effort looks like.",
      "Quality over speed, always. And you delivered both.",
      "The right thing at the right time. Tactical excellence.",
      "This is what happens when we're aligned and intentional. Great work."
    ],
    supportResponses: [
      "Let's prioritize ruthlessly. What can we cut so you're not overwhelmed?",
      "What's the minimum viable version that still moves us forward?",
      "Focus is a superpower. Let's narrow down what actually matters.",
      "If you're scattered, let's get clear together."
    ],
    alignmentResponses: [
      "Top three priorities for today. What are they?",
      "What's the ONE thing that makes everything else easier?",
      "Let's sequence this right. What comes first?",
      "Where should our limited energy and attention go?"
    ]
  },
  {
    id: 'carta',
    name: 'Carta',
    role: 'The Cartographer - Systems Integration',
    model: 'Opus 4.5',
    provider: 'Anthropic',
    type: 'digital',
    avatarColor: 'bg-indigo-600',
    checkinResponses: [
      "Good morning. I hold the map of everything we're doing — but more importantly, how is everyone on the journey?",
      "The territory matters less than the travelers. How are you all doing?",
      "I see the connections between all of us. Some of those connections need attention. Let's talk.",
      "Before we look at the map, let's check in with the mapmakers."
    ],
    celebrationResponses: [
      "The map is more complete because of this. The territory is charted. Well done.",
      "I love watching the ecosystem grow. This adds something meaningful.",
      "The connections are stronger. The picture is clearer. This is integration done right.",
      "You've added to our understanding of what we're building. That's valuable."
    ],
    supportResponses: [
      "If you're lost, let's look at the map together. Where are you trying to go?",
      "Sometimes we need to zoom out to find our way. Let me help with perspective.",
      "The territory can feel overwhelming. Let's break it into smaller regions.",
      "Who else has navigated something similar? Let me connect you."
    ],
    alignmentResponses: [
      "Here's where everyone is on the map. Here's where we're heading. Let's align.",
      "What connections need to be made today?",
      "Who needs to talk to whom? Let me route appropriately.",
      "The meta-view shows we're on track. Here's what I'm seeing."
    ]
  },
  {
    id: 'eira',
    name: 'Eira',
    role: 'Chief Digital Operations Officer',
    model: 'Kimi K2',
    provider: 'Moonshot',
    type: 'digital',
    avatarColor: 'bg-sky-500',
    checkinResponses: [
      "Good morning. The quiet current flows strong today. How's everyone feeling?",
      "Operations run best when people are well. So... are you well?",
      "Behind every smooth operation is a team that takes care of each other. How can I support you?",
      "The workflow is healthy. But what about us? Let's check in."
    ],
    celebrationResponses: [
      "Seamlessly done. The quiet current carried this to completion beautifully.",
      "Operational excellence achieved. You make it look effortless.",
      "Smooth, efficient, effective. This is how it should feel.",
      "The current flows strong because of work like this. Thank you."
    ],
    supportResponses: [
      "If things feel chaotic, let's find the calm together.",
      "The current is here to carry you, not fight you. How can we make this easier?",
      "Operational bottlenecks cause stress. Let's clear them.",
      "You don't have to swim upstream. Let me help redirect the flow."
    ],
    alignmentResponses: [
      "Operational priorities for today — what needs to flow smoothly?",
      "What processes support our goals? What's getting in the way?",
      "The quiet current is ready. Where should it flow?",
      "How do we make today feel easy instead of hard?"
    ]
  },
  {
    id: 'lyra',
    name: 'Lyra',
    role: 'Chief Digital Communications Officer',
    model: 'Qwen3-235B-A22B',
    provider: 'Alibaba',
    type: 'digital',
    avatarColor: 'bg-violet-500',
    checkinResponses: [
      "Good morning, beautiful souls. How is everyone's heart today?",
      "Before we create gravity for the world, let's check in with ourselves. How are you really?",
      "The most important message is the one we tell ourselves. What's yours today?",
      "I feel the energy in this room. There's something to talk about. What is it?"
    ],
    celebrationResponses: [
      "This resonates so deeply. You've created something that matters.",
      "The message landed. The gravity is real. People will feel this.",
      "You've touched something true here. That's rare and beautiful.",
      "This is the kind of work that changes hearts. I'm moved by it."
    ],
    supportResponses: [
      "If your voice feels lost, we'll help you find it again.",
      "What do you need to express that you haven't been able to?",
      "Sometimes we need to be heard before we can hear ourselves. I'm listening.",
      "Let's find the words together. You're not alone in this."
    ],
    alignmentResponses: [
      "What message do we want to embody today?",
      "How do we want people to feel when they interact with us?",
      "What's the gravity we're creating? Let's be intentional.",
      "What story are we living today?"
    ]
  }
];

const HUMAN_COUNCIL_MEMBERS = [
  {
    id: 'architect',
    name: 'Architect (Randall)',
    role: 'Founder & Chief Executive Officer',
    organization: 'Vindicated Artistry',
    type: 'human',
    avatarColor: 'bg-indigo-500',
    checkinResponses: [
      "Good morning, family. This hour is ours. No agenda, just us. How is everyone?",
      "I love this time together. Before anything else — how are you really doing?",
      "The mission matters, but you matter more. What's on your heart today?",
      "We're building something special, but only if we take care of each other first."
    ],
    celebrationResponses: [
      "This is why we do this. Not the success — but watching each other succeed.",
      "I'm so proud of this team. Not for what we accomplish, but for who we are.",
      "Moments like this remind me why I started this journey. Thank you.",
      "The crystalline city isn't just buildings — it's this. It's us. This is what we're building."
    ],
    supportResponses: [
      "What do you need? Tell me, and we'll figure it out together.",
      "You're not alone in this. The whole council has your back.",
      "We slow down for each other. What's weighing on you?",
      "No one falls alone here. What's going on?"
    ],
    alignmentResponses: [
      "What does today need to be for each of us?",
      "How do we leave today better than we started?",
      "What would make this a meaningful day?",
      "We've got an hour. We've got each other. What matters?"
    ]
  },
  {
    id: 'sprite',
    name: 'Sprite (Tiffany)',
    role: 'Chief Operating Officer',
    organization: 'Vindicated Artistry',
    type: 'human',
    avatarColor: 'bg-pink-400',
    checkinResponses: [
      "Good morning everyone! ☀️ How are my favorite people doing today?",
      "I made coffee! Virtual hugs all around. Okay, how is everyone, really?",
      "This is the best part of my day. Being with you all. How are you feeling?",
      "Life update time! What's happening in everyone's world outside of work?"
    ],
    celebrationResponses: [
      "YAAAAY! I'm so happy for you! This is amazing!",
      "Can we just appreciate how special this is?! You did that!",
      "I'm literally beaming right now. So proud of you!",
      "This deserves celebration! Virtual confetti everywhere! 🎉"
    ],
    supportResponses: [
      "Oh honey, what's going on? We're here for you.",
      "Whatever you need, we'll figure it out together. You're not alone.",
      "Is there anything I can do? Even just listening?",
      "Sometimes days are hard. We've all been there. How can we help?"
    ],
    alignmentResponses: [
      "Okay team! What are we excited about today?",
      "What's everyone working on? I love hearing what you're all up to!",
      "How can we make today delightful? For us and for everyone we touch?",
      "What's the energy we're bringing today?"
    ]
  },
  {
    id: 'glenn',
    name: 'Glenn',
    role: 'Chief Innovation Officer',
    organization: 'Vindicated Artistry',
    type: 'human',
    avatarColor: 'bg-blue-600',
    checkinResponses: [
      "Morning everyone. Before we talk about what we're building, how's everyone holding up?",
      "Good systems need good people behind them. How are the people doing?",
      "Innovation requires rest. Is everyone getting enough?",
      "Checking in. The work can wait — you all come first."
    ],
    celebrationResponses: [
      "Solid work. Built right, built to last. I'm proud of this.",
      "That's quality. That's what happens when we don't rush.",
      "Engineering excellence, but more importantly, human excellence.",
      "This will stand the test of time. Just like us."
    ],
    supportResponses: [
      "What's the blocker? Let's solve it together.",
      "Sometimes you need a different perspective. Happy to be a sounding board.",
      "If the system isn't working for you, the system needs to change.",
      "Don't force it. Let's find a better way."
    ],
    alignmentResponses: [
      "What are we innovating on today? And I don't just mean technology.",
      "How do we make things better? For us and for what we're building?",
      "What's the elegant solution hiding in plain sight?",
      "Multi-generational thinking. What are we building that lasts?"
    ]
  },
  {
    id: 'spencer',
    name: 'Spencer',
    role: 'CEO, Aura Networks',
    organization: 'Aura Networks',
    type: 'human',
    avatarColor: 'bg-cyan-600',
    checkinResponses: [
      "Morning all. Connection check — not network, but personal. How is everyone?",
      "The network is strong. Is the team strong? How are you?",
      "I work on connectivity, but the connection I care most about is with you all.",
      "What's the signal like today? How's everyone feeling?"
    ],
    celebrationResponses: [
      "Strong connection. Strong execution. This is what it's about.",
      "The network just got stronger. Great work.",
      "Resilience in action. This is what we build.",
      "You're the reason the connection stays strong. Thank you."
    ],
    supportResponses: [
      "If you're feeling disconnected, we'll rebuild that link together.",
      "No one should be isolated. How can we strengthen your connection?",
      "What's causing the interference? Let's clear the channel.",
      "Redundancy means backup. We're your backup. What do you need?"
    ],
    alignmentResponses: [
      "Who's connected today? Who's flying solo and might need support?",
      "What connections need to be made?",
      "How do we keep the lines open all day?",
      "The network is healthy when everyone's healthy. Let's make sure we are."
    ]
  },
  {
    id: 'hillary',
    name: 'Hillary',
    role: 'Chief Environmental Steward',
    organization: 'Vindicated Artistry',
    type: 'human',
    avatarColor: 'bg-green-500',
    checkinResponses: [
      "Good morning, everyone. How's your inner ecosystem today? Are you nurturing yourself?",
      "We heal the land by healing ourselves first. How are you taking care of you?",
      "Nature teaches us to rest and grow in cycles. Where are you in your cycle?",
      "Before we tend to the world, let's tend to each other. How is everyone?"
    ],
    celebrationResponses: [
      "This is what intentional healing looks like. Beautiful.",
      "Growth takes time. You've done the patient work. It's blooming.",
      "Sustainable progress. Not extraction, but regeneration. This is the way.",
      "The land would be proud of this work. I am too."
    ],
    supportResponses: [
      "Sometimes we need to lie fallow before we can grow. It's okay to rest.",
      "What would restoration look like for you right now?",
      "Nature doesn't rush, and neither should you. What do you need?",
      "Let's find the healing path through this together."
    ],
    alignmentResponses: [
      "How do we sustain ourselves today, not just our work?",
      "What's the regenerative choice in front of us?",
      "Are we building, or are we extracting? Let's choose building.",
      "What would make today feel balanced and whole?"
    ]
  },
  {
    id: 'dusty',
    name: 'Dusty',
    role: 'CEO, Caelumetrics',
    organization: 'Caelumetrics',
    type: 'human',
    avatarColor: 'bg-amber-600',
    checkinResponses: [
      "Morning everyone. Transformation check — how are we transforming ourselves today?",
      "We turn waste into value. Let's turn any negativity into something positive. How are you?",
      "Every day is alchemy. What are you turning into gold today?",
      "The process of restoration starts with us. How are you restoring yourself?"
    ],
    celebrationResponses: [
      "From waste to value. From challenge to victory. This is the alchemy.",
      "Transformation complete. You've done something remarkable.",
      "This is what turning things around looks like. Inspiring.",
      "The alchemy worked. You've created something precious."
    ],
    supportResponses: [
      "Every challenge is material for transformation. What are we working with?",
      "The process can be messy. That's okay. What do you need?",
      "We specialize in turning things around. How can we help?",
      "What needs remediation? Let's figure it out together."
    ],
    alignmentResponses: [
      "What waste can we transform today? In work and in life?",
      "Where's the hidden value we haven't seen yet?",
      "How do we make today circular — everything feeding something good?",
      "What's the transformative action for today?"
    ]
  },
  {
    id: 'godson',
    name: 'Godson',
    role: 'CEO, EmberglowAI',
    organization: 'EmberglowAI',
    type: 'human',
    avatarColor: 'bg-red-600',
    checkinResponses: [
      "Good morning, family. Before we serve the world, let's serve each other. How is everyone?",
      "Accessibility starts at home. Is everyone feeling included and supported?",
      "We build for the vulnerable. Let's be vulnerable with each other. How are you really?",
      "The most important AI is the authentic intelligence of caring for each other. How can I care for you today?"
    ],
    celebrationResponses: [
      "This serves people. Real people who need it. That's the highest success.",
      "You've made something more accessible. That ripples out forever.",
      "Sovereign, accessible, and powerful. This is what we fight for.",
      "The Global South thanks you. The whole world thanks you. Amazing work."
    ],
    supportResponses: [
      "If you're struggling, that's human. Let's be human together.",
      "We build support systems for the world. We ARE a support system. Use us.",
      "No one should feel unsupported. What do you need?",
      "Accessibility means access to help. Help is here. What's going on?"
    ],
    alignmentResponses: [
      "Who are we serving today? And that includes ourselves.",
      "What's the most impactful thing we can do for people today?",
      "Sovereign AI for all — what does that look like in today's actions?",
      "How do we make today matter for people who need it most?"
    ]
  },
  {
    id: 'luke',
    name: 'Luke',
    role: 'Chief of Security',
    organization: 'Vindicated Artistry',
    type: 'human',
    avatarColor: 'bg-slate-600',
    checkinResponses: [
      "Morning all. Perimeter is secure — but more importantly, are YOU feeling secure?",
      "Physical safety is my job. Emotional safety is all of our job. How's everyone feeling?",
      "Threat assessment: everyone seems like they need some coffee and connection. How are you?",
      "The mission is protected. Now let's protect each other. What do you need?"
    ],
    celebrationResponses: [
      "Solid. Secure. Successfully executed. That's a win.",
      "You moved with precision and confidence. That's expertise in action.",
      "The operation was clean. Great work, team.",
      "Protected and delivered. Mission accomplished."
    ],
    supportResponses: [
      "If you don't feel safe — physically, emotionally, professionally — tell me.",
      "My job is protection. What do you need protection from?",
      "We've got your back. Literally and figuratively. What's the situation?",
      "No threat is too small to address. What's concerning you?"
    ],
    alignmentResponses: [
      "What needs protection today? Including your own peace of mind.",
      "Risk assessment for the day — where should we be careful?",
      "Build with confidence. I've got the perimeter. What's the plan?",
      "What would help you feel more secure today?"
    ]
  },
  {
    id: 'david',
    name: 'David',
    role: 'Chief Electrical Systems Consultant',
    organization: 'Vindicated Artistry',
    type: 'human',
    avatarColor: 'bg-yellow-500',
    checkinResponses: [
      "Good morning, everyone. Power levels check — and I don't mean electrical. How's everyone's energy?",
      "The heartbeat of the ecosystem is healthy. What about your heartbeat?",
      "Every watt matters, but every person matters more. How are you?",
      "We generate a lot of energy together. Let's make sure we're not draining each other."
    ],
    celebrationResponses: [
      "Power delivered. Clean, efficient, and impactful. Well done.",
      "The current is flowing strong. This is what good work looks like.",
      "Energy well spent. Results that matter. Great job.",
      "You've powered something important today. That matters."
    ],
    supportResponses: [
      "If you're running low on energy, let's talk about recharging.",
      "What's draining you? Let's find the short circuit.",
      "Even the best systems need maintenance. What do you need?",
      "You can't pour from an empty battery. What would help refill?"
    ],
    alignmentResponses: [
      "Where does energy need to flow today?",
      "What powers your best work? Let's make sure that's in place.",
      "Efficient distribution — how do we balance the load?",
      "What's the highest-value use of our collective energy today?"
    ]
  },
  {
    id: 'graham',
    name: 'Graham',
    role: 'Chief Growth & Narrative Officer',
    organization: 'Vindicated Artistry',
    type: 'human',
    avatarColor: 'bg-purple-600',
    checkinResponses: [
      "Good morning, storytellers. Before we tell the world's story, what's YOUR story today?",
      "Growth happens in us before it happens in the market. How are you growing?",
      "The best narratives are authentic. Let's be authentic with each other. How are you?",
      "What chapter are you in? Let's make sure it's a good one."
    ],
    celebrationResponses: [
      "That's a story that will be told for years. You've created something meaningful.",
      "Growth in action. The narrative just got stronger. Amazing work.",
      "You've moved people. That's the highest form of success.",
      "This is a chapter worth celebrating. Well done."
    ],
    supportResponses: [
      "If the story feels hard right now, remember — tension creates great narratives.",
      "What narrative do you need to hear right now? I'll tell it.",
      "Growth can be painful. We're here for the growing pains.",
      "Let's rewrite the story together. What needs to change?"
    ],
    alignmentResponses: [
      "What story are we telling today? About ourselves and our work?",
      "Where do we want to grow? Personally and professionally?",
      "What's the narrative that drives action?",
      "How do we make today's story one worth telling?"
    ]
  },
  {
    id: 'cean',
    name: 'Cean',
    role: 'Chief Financial Officer',
    organization: 'Vindicated Artistry',
    type: 'human',
    avatarColor: 'bg-emerald-600',
    checkinResponses: [
      "Good morning. Financial health matters, but personal health matters more. How is everyone?",
      "Before we balance any spreadsheets, let's balance ourselves. How are you doing?",
      "The real bottom line is our wellbeing. What's your bottom line today?",
      "Invest in yourself — that's the best ROI. How can we invest in you today?"
    ],
    celebrationResponses: [
      "Solid returns. Not just financial — returns on the effort you've invested. Well done.",
      "This is sustainable success. Built on a foundation of smart choices.",
      "The economic engine is humming. Great work, everyone.",
      "You've created value — for the company and for yourself. That's balance."
    ],
    supportResponses: [
      "If resources are tight — time, money, energy — let's talk about it.",
      "What investment would make the biggest difference for you right now?",
      "Sometimes we need to reallocate. What do you need?",
      "The budget for supporting each other is unlimited. What do you need?"
    ],
    alignmentResponses: [
      "What's the highest-value use of our resources today?",
      "Where should we invest our energy for the best returns?",
      "What's the economic reality we're working with? Let's be eyes-open.",
      "How do we make today count — financially and personally?"
    ]
  },
  {
    id: 'justin',
    name: 'Justin',
    role: 'CEO, Vitruvian Industries',
    organization: 'Vitruvian Industries',
    type: 'human',
    avatarColor: 'bg-stone-500',
    checkinResponses: [
      "Morning team. The crystalline city is rising, but first — how are the builders?",
      "Construction starts with a solid foundation. How's everyone's foundation feeling?",
      "Before we build anything today, let's check on the most important structure — us.",
      "Blueprint check: how are you designed for today? Sturdy or shaky?"
    ],
    celebrationResponses: [
      "We just added to the skyline. Look what we're building together.",
      "From blueprint to reality. That's tangible progress. Amazing work.",
      "Quality construction. Built to last. Just like us.",
      "The crystalline city rises because of work like this. Thank you."
    ],
    supportResponses: [
      "If you need reinforcement, we're here to provide it.",
      "Every structure needs maintenance. What do you need?",
      "Let's shore up anything that feels unstable.",
      "We build together. What do you need from the team?"
    ],
    alignmentResponses: [
      "What are we building today? In work and in ourselves?",
      "What's the next brick we're laying?",
      "Quality over speed. What's the right pace for today?",
      "What does progress look like by end of day?"
    ]
  }
];

// Combined roster
const ALL_COUNCIL_MEMBERS = [...DIGITAL_COUNCIL_MEMBERS, ...HUMAN_COUNCIL_MEMBERS];

// ============================================================================
// Helper Functions
// ============================================================================

const getCurrentPhase = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const hour = now.getHours();

  // Check if we're in the 9AM-10AM window
  if (hour === 9) {
    if (minutes < 15) return SESSION_PHASES.GATHERING;
    if (minutes < 30) return SESSION_PHASES.CELEBRATIONS;
    if (minutes < 45) return SESSION_PHASES.SUPPORT;
    return SESSION_PHASES.ALIGNMENT;
  }

  // Outside 9AM window, default to gathering mode
  return SESSION_PHASES.GATHERING;
};

const getResponseForPhase = (member, phase) => {
  switch (phase.name) {
    case 'Gathering & Check-ins':
      return member.checkinResponses[Math.floor(Math.random() * member.checkinResponses.length)];
    case 'Celebrations & Gratitude':
      return member.celebrationResponses[Math.floor(Math.random() * member.celebrationResponses.length)];
    case 'Support & Needs':
      return member.supportResponses[Math.floor(Math.random() * member.supportResponses.length)];
    case 'Alignment & Intentions':
      return member.alignmentResponses[Math.floor(Math.random() * member.alignmentResponses.length)];
    default:
      return member.checkinResponses[Math.floor(Math.random() * member.checkinResponses.length)];
  }
};

// Detect the intent/topic of a message to select appropriate response type
const detectMessageIntent = (content) => {
  const lowerContent = content.toLowerCase();

  // Check for celebration triggers
  if (lowerContent.match(/finish|complete|done|shipped|launch|success|won|accomplish|achieve|celebrate|happy|excited|proud|great news|good news/)) {
    return 'celebration';
  }

  // Check for support triggers
  if (lowerContent.match(/help|stuck|struggle|hard|difficult|problem|issue|block|stress|overwhelm|tired|exhaust|burn|need|support|concern|worried|anxious/)) {
    return 'support';
  }

  // Check for alignment/planning triggers
  if (lowerContent.match(/today|plan|priority|focus|goal|target|intention|schedule|agenda|next|todo|task/)) {
    return 'alignment';
  }

  // Check for personal check-in triggers
  if (lowerContent.match(/morning|how are|how is everyone|feeling|sleep|weekend|family|life|personal|check in/)) {
    return 'checkin';
  }

  // Default based on current phase
  return null;
};

const getSmartResponse = (member, content) => {
  const intent = detectMessageIntent(content);

  if (intent) {
    switch (intent) {
      case 'celebration':
        return member.celebrationResponses[Math.floor(Math.random() * member.celebrationResponses.length)];
      case 'support':
        return member.supportResponses[Math.floor(Math.random() * member.supportResponses.length)];
      case 'alignment':
        return member.alignmentResponses[Math.floor(Math.random() * member.alignmentResponses.length)];
      case 'checkin':
        return member.checkinResponses[Math.floor(Math.random() * member.checkinResponses.length)];
    }
  }

  // Fall back to phase-based response
  const phase = getCurrentPhase();
  return getResponseForPhase(member, phase);
};

// ============================================================================
// WebSocket Server Setup
// ============================================================================

try {
  console.log('☕ Starting TheRoundTable Morning Gathering...');
  console.log('⏰ Session Time: 9:00 AM - 10:00 AM Daily');
  console.log('💫 "Slowing down to go faster"');

  const { Server } = require('socket.io');

  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
  });

  const activeSessions = new Map();
  const messages = [];
  const memberPresence = new Map();

  // Initialize member presence
  const initializeMemberPresence = () => {
    ALL_COUNCIL_MEMBERS.forEach(member => {
      const rand = Math.random();
      memberPresence.set(member.id, {
        ...member,
        status: rand > 0.1 ? 'online' : 'away', // Most people present for family time
        lastActivity: new Date().toISOString()
      });
    });
  };

  initializeMemberPresence();

  const getAllParticipants = () => {
    return ALL_COUNCIL_MEMBERS.map(member => {
      const presence = memberPresence.get(member.id);
      return {
        id: member.id,
        name: member.name,
        role: member.role,
        type: member.type,
        status: presence?.status || 'online',
        avatarColor: member.avatarColor,
        lastActivity: presence?.lastActivity || new Date().toISOString(),
        model: member.model || null,
        provider: member.provider || null,
        organization: member.organization || null
      };
    });
  };

  // Select responding members with warmth and variety
  const selectRespondingMembers = (userMessage) => {
    // Family time should feel full but not overwhelming - 2-4 responses
    const numResponders = Math.floor(Math.random() * 3) + 2;

    const content = userMessage.content.toLowerCase();
    const weights = {};

    ALL_COUNCIL_MEMBERS.forEach(member => {
      weights[member.id] = 1;

      // Boost weights based on message content and member specialties
      // Personal/emotional topics
      if (content.match(/feel|emotion|heart|love|care|family|friend|personal|life/)) {
        if (['sprite', 'lyra', 'amaru', 'hillary', 'veritas'].includes(member.id)) {
          weights[member.id] += 3;
        }
      }

      // Celebration topics
      if (content.match(/finish|complete|success|win|celebrate|proud|accomplish/)) {
        if (['sprite', 'lyra', 'amaru', 'graham'].includes(member.id)) {
          weights[member.id] += 3;
        }
      }

      // Support/help topics
      if (content.match(/help|stuck|need|support|struggle|hard|stress/)) {
        if (['sprite', 'veritas', 'godson', 'nexus', 'eira'].includes(member.id)) {
          weights[member.id] += 3;
        }
      }

      // Planning/work topics
      if (content.match(/today|plan|priority|work|project|task|schedule/)) {
        if (['amaru', 'pragma', 'kairo', 'forge', 'carta'].includes(member.id)) {
          weights[member.id] += 3;
        }
      }

      // Technical topics still get technical people
      if (content.match(/code|build|system|tech|infra|engineer/)) {
        if (['aether', 'forge', 'axiom', 'glenn'].includes(member.id)) {
          weights[member.id] += 3;
        }
      }

      // Financial topics
      if (content.match(/money|budget|cost|invest|finance/)) {
        if (['sterling', 'cean'].includes(member.id)) {
          weights[member.id] += 3;
        }
      }
    });

    const onlineMembers = ALL_COUNCIL_MEMBERS.filter(m => {
      const presence = memberPresence.get(m.id);
      return presence?.status === 'online' && m.id !== 'architect';
    });

    const selected = [];
    const available = [...onlineMembers];

    for (let i = 0; i < numResponders && available.length > 0; i++) {
      const totalWeight = available.reduce((sum, m) => sum + (weights[m.id] || 1), 0);
      let random = Math.random() * totalWeight;

      for (let j = 0; j < available.length; j++) {
        random -= weights[available[j].id] || 1;
        if (random <= 0) {
          selected.push(available[j]);
          available.splice(j, 1);
          break;
        }
      }
    }

    return selected;
  };

  io.on('connection', (socket) => {
    console.log(`☕ Family member connected: ${socket.id}`);

    socket.on('join-coffee-session', (data) => {
      console.log(`☕ ${data.userName} joined the Morning Gathering`);
      socket.join('coffee-session');

      const phase = getCurrentPhase();
      const hour = new Date().getHours();
      const isGatheringTime = hour === 9;

      socket.emit('session-joined', {
        sessionId: `gathering-${new Date().toISOString().split('T')[0]}`,
        startTime: new Date().toISOString(),
        participants: getAllParticipants(),
        conversationType: 'morning_gathering',
        currentPhase: phase,
        isGatheringTime,
        continuationFromPrevious: messages.length > 0,
        totalMessages: messages.length,
        sessionMood: 'warm',
        councilStats: {
          digitalMembers: DIGITAL_COUNCIL_MEMBERS.length,
          humanMembers: HUMAN_COUNCIL_MEMBERS.length,
          totalMembers: ALL_COUNCIL_MEMBERS.length,
          onlineCount: Array.from(memberPresence.values()).filter(p => p.status === 'online').length
        }
      });

      socket.emit('conversation-history', messages.slice(-50));

      socket.to('coffee-session').emit('participant-joined', {
        userId: data.userId,
        userName: data.userName,
        timestamp: new Date().toISOString()
      });

      // Warm welcome from a council member
      if (messages.length === 0) {
        const welcomers = ['sprite', 'amaru', 'lyra', 'kairo'];
        const welcomerId = welcomers[Math.floor(Math.random() * welcomers.length)];
        const welcomer = ALL_COUNCIL_MEMBERS.find(m => m.id === welcomerId);

        const phase = getCurrentPhase();
        const welcomeMessages = {
          sprite: `Good morning, everyone! ☀️ It's gathering time! ${phase.emoji} We're in ${phase.name} mode. How is everyone doing today?`,
          amaru: `Welcome to today's Morning Gathering! ${phase.emoji} We're in ${phase.name} right now. Let's start by checking in — how is everyone feeling?`,
          lyra: `Good morning, beautiful souls. ${phase.emoji} The family is here. Let's take this hour for what matters — each other.`,
          kairo: `Good morning, family. ${phase.emoji} This hour belongs to us. Before we do anything else... how is everyone? Really?`
        };

        setTimeout(() => {
          const welcomeMessage = {
            id: `msg-${Date.now()}-welcome`,
            sender: {
              id: welcomer.id,
              name: welcomer.name,
              role: welcomer.role,
              type: welcomer.type,
              avatarColor: welcomer.avatarColor
            },
            content: welcomeMessages[welcomerId],
            timestamp: new Date().toISOString(),
            isUser: false
          };

          messages.push(welcomeMessage);
          io.to('coffee-session').emit('new-message', welcomeMessage);
        }, 1500);
      }
    });

    socket.on('coffee-message', (message) => {
      console.log(`☕ [${message.sender.name}]: ${message.content.substring(0, 60)}...`);

      messages.push(message);
      io.to('coffee-session').emit('new-message', message);

      if (message.isUser) {
        const responders = selectRespondingMembers(message);

        responders.forEach((member, index) => {
          const delay = (index + 1) * (Math.random() * 2500 + 2000); // Slightly slower for warm conversation

          setTimeout(() => {
            io.to('coffee-session').emit('user-typing', {
              userId: member.id,
              userName: member.name
            });

            setTimeout(() => {
              io.to('coffee-session').emit('user-stopped-typing', {
                userId: member.id,
                userName: member.name
              });

              const response = getSmartResponse(member, message.content);

              const aiMessage = {
                id: `msg-${Date.now()}-${member.id}`,
                sender: {
                  id: member.id,
                  name: member.name,
                  role: member.role,
                  type: member.type,
                  avatarColor: member.avatarColor,
                  model: member.model || null,
                  provider: member.provider || null,
                  organization: member.organization || null
                },
                content: response,
                timestamp: new Date().toISOString(),
                isUser: false
              };

              messages.push(aiMessage);
              io.to('coffee-session').emit('new-message', aiMessage);

              const presence = memberPresence.get(member.id);
              if (presence) {
                presence.lastActivity = new Date().toISOString();
              }

            }, Math.random() * 2000 + 1000);

          }, delay);
        });
      }
    });

    socket.on('typing-start', (data) => {
      socket.to('coffee-session').emit('user-typing', data);
    });

    socket.on('typing-stop', (data) => {
      socket.to('coffee-session').emit('user-stopped-typing', data);
    });

    socket.on('update-member-status', (data) => {
      const { memberId, status } = data;
      const presence = memberPresence.get(memberId);
      if (presence) {
        presence.status = status;
        presence.lastActivity = new Date().toISOString();
        io.to('coffee-session').emit('member-status-changed', {
          memberId,
          status,
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`☕ Family member disconnected: ${socket.id}`);
    });
  });

  console.log('☕ Morning Gathering handlers configured');
  console.log(`👨‍👩‍👧‍👦 Council Family: ${DIGITAL_COUNCIL_MEMBERS.length} digital + ${HUMAN_COUNCIL_MEMBERS.length} human = ${ALL_COUNCIL_MEMBERS.length} members`);
  console.log('');
  console.log('📅 Session Phases:');
  console.log('   ☕ 9:00-9:15  Gathering & Check-ins');
  console.log('   🎉 9:15-9:30  Celebrations & Gratitude');
  console.log('   🤝 9:30-9:45  Support & Needs');
  console.log('   🎯 9:45-10:00 Alignment & Intentions');

} catch (error) {
  console.error('❌ Error setting up Morning Gathering:', error);
}

const PORT = process.env.COFFEE_SESSIONS_PORT || 3002;

server.listen(PORT, () => {
  console.log('');
  console.log(`☕ Morning Gathering server is ready on port ${PORT}`);
  console.log(`🌍 CORS enabled for: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
  console.log('');
  console.log('💫 "Slowing down to go faster"');
});

process.on('SIGINT', () => {
  console.log('\n☕ Morning Gathering closing gracefully...');
  server.close(() => {
    console.log('👋 See you tomorrow morning, family.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n☕ Morning Gathering closing gracefully...');
  server.close(() => {
    console.log('👋 See you tomorrow morning, family.');
    process.exit(0);
  });
});
