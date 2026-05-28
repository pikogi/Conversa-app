import { User, Speakeasy } from "./types";

export const CURRENT_USER: User = {
  id: "u1",
  name: "Martina",
  age: 38,
  city: "Buenos Aires",
  avatar: "M",
  bio: "Diseñadora. Viajera empedernida. Quiero practicar inglés para poder trabajar con clientes del exterior.",
};

export const USERS: User[] = [
  CURRENT_USER,
  { id: "u2", name: "Javier", age: 42, city: "Rosario", avatar: "J", bio: "Contador. Me gusta el cine y los viajes largos." },
  { id: "u3", name: "Luciana", age: 35, city: "Córdoba", avatar: "L", bio: "Médica. Quiero mejorar mi inglés para publicar investigaciones." },
  { id: "u4", name: "Rodrigo", age: 39, city: "Buenos Aires", avatar: "R", bio: "Músico. Fan de los 90s y del rock anglosajón." },
  { id: "u5", name: "Sofía", age: 33, city: "Mendoza", avatar: "S", bio: "Chef. Quiero poder seguir recetas en inglés y conocer gente nueva." },
  { id: "u6", name: "Andrés", age: 45, city: "Buenos Aires", avatar: "A", bio: "IT Manager. Necesito mejorar el inglés para reuniones internacionales." },
];

export const SPEAKEASIES: Speakeasy[] = [
  {
    id: "sp1",
    title: "El viaje que soñás tener",
    topic: "viajes",
    description: "¿A dónde irías si pudieras ir a cualquier lugar mañana? Vamos a hablar de destinos soñados, experiencias de viaje y cómo manejarse en inglés fuera del país.",
    date: "2026-05-28",
    time: "19:00",
    meetingUrl: "https://meet.google.com/abc-defg-hij",
    facilitatorId: "u6",
    participants: ["u2", "u3"],
    maxParticipants: 4,
    level: "intermedio",
  },
  {
    id: "sp2",
    title: "Canciones que te cambiaron la vida",
    topic: "musica",
    description: "Una canción, una historia. Cada uno trae su canción favorita en inglés y cuenta por qué lo marcó. Vamos a hablar de letras, artistas y emociones.",
    date: "2026-05-29",
    time: "20:00",
    meetingUrl: "https://meet.google.com/xyz-uvwx-yz",
    facilitatorId: "u4",
    participants: ["u5"],
    maxParticipants: 4,
    level: "básico",
  },
  {
    id: "sp3",
    title: "¿Qué estás viendo ahora?",
    topic: "series",
    description: "Series, películas, documentales. ¿Qué estás mirando? ¿Qué recomendarías? Un espacio para opinar, debatir y practicar el inglés que usamos cuando hablamos de entretenimiento.",
    date: "2026-05-30",
    time: "21:00",
    meetingUrl: "https://meet.google.com/mnop-qrst-uv",
    facilitatorId: "u3",
    participants: ["u2", "u4", "u5"],
    maxParticipants: 4,
    level: "intermedio",
  },
  {
    id: "sp4",
    title: "Trabajar con el mundo",
    topic: "trabajo",
    description: "Inglés para reuniones, emails, entrevistas y negociaciones. Casos reales, situaciones concretas. Para los que quieren dar el salto al trabajo internacional.",
    date: "2026-06-02",
    time: "18:30",
    meetingUrl: "https://meet.google.com/abcd-efgh-ij",
    facilitatorId: "u6",
    participants: [],
    maxParticipants: 4,
    level: "avanzado",
  },
  {
    id: "sp5",
    title: "First dates & awkward silences",
    topic: "amor",
    description: "Citas, apps de dating, el amor después de los 30. Vamos a hablar de relaciones, expectativas y el inglés para coquetear (con gracia).",
    date: "2026-06-03",
    time: "20:30",
    meetingUrl: "https://meet.google.com/wxyz-abcd-ef",
    facilitatorId: "u2",
    participants: ["u3"],
    maxParticipants: 4,
    level: "básico",
  },
  {
    id: "sp6",
    title: "Vivir en otro país: la realidad",
    topic: "mundo",
    description: "¿Pensaste en irte a vivir afuera? ¿Ya lo hiciste? Vamos a hablar de la experiencia de vivir en otro país, el choque cultural y cómo el inglés abre puertas.",
    date: "2026-06-05",
    time: "19:30",
    meetingUrl: "https://meet.google.com/ghij-klmn-op",
    facilitatorId: "u5",
    participants: ["u6"],
    maxParticipants: 4,
    level: "intermedio",
  },
];

export const TOPIC_META: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  viajes:      { emoji: "✈️", label: "Viajes",    color: "#FF6B6B", bg: "#FFE4E1" },
  musica:      { emoji: "🎵", label: "Música",    color: "#845EC2", bg: "#E8E0FF" },
  series:      { emoji: "🍿", label: "Series",    color: "#FF9E4F", bg: "#FFF3E0" },
  trabajo:     { emoji: "💼", label: "Trabajo",   color: "#06D6A0", bg: "#E0F7F1" },
  amor:        { emoji: "❤️", label: "Amor",      color: "#FF6B6B", bg: "#FCE4EC" },
  mundo:       { emoji: "🌍", label: "Mundo",     color: "#845EC2", bg: "#E3F2FD" },
  gastronomia: { emoji: "🍳", label: "Gastronomía",color: "#FF9E4F", bg: "#FFF8E1" },
  deporte:     { emoji: "⚽", label: "Deporte",   color: "#06D6A0", bg: "#E8F5E9" },
};

export type IceBreakersSet = {
  warmup: string[];
  wouldYouRather: string[];
  hotTake: string[];
  story: string[];
  hypothetical: string[];
};

export const ICE_BREAKERS: Record<string, IceBreakersSet> = {
  viajes: {
    warmup: [
      "What's the most memorable trip you've ever taken?",
      "Do you prefer solo travel or going with others?",
      "What destination is still on your bucket list?",
      "What's the first thing you do when you arrive in a new city?",
    ],
    wouldYouRather: [
      "Would you rather explore a busy city or a remote natural area?",
      "Would you rather visit 20 countries briefly or 5 countries deeply?",
      "Would you rather travel by train across a continent or fly everywhere?",
      "Would you rather stay in a luxury hotel or backpack on a tight budget?",
    ],
    hotTake: [
      "Hot take: Tourist traps are actually worth visiting.",
      "Hot take: Traveling alone is better than traveling with friends.",
      "Hot take: You can't really experience a country without speaking the language.",
      "Hot take: All-inclusive resorts are a waste of travel opportunity.",
    ],
    story: [
      "Tell us about a time you had to improvise on a trip.",
      "Share a travel experience that changed how you see the world.",
      "Tell us about the best meal you had while traveling.",
      "Describe a moment when you connected with a local in an unexpected way.",
    ],
    hypothetical: [
      "If you could teleport anywhere right now, where would you go?",
      "If you had to live abroad for a year, where would you choose?",
      "If you had an unlimited travel budget for one month, what's your plan?",
      "If you could go back and re-take one trip, which one would it be?",
    ],
  },
  musica: {
    warmup: [
      "What song have you had on repeat lately?",
      "What was the first concert you ever went to?",
      "Do you play any instruments — or have you ever tried?",
      "What genre do you listen to when you need to focus?",
    ],
    wouldYouRather: [
      "Would you rather have perfect pitch or perfect rhythm?",
      "Would you rather go to a massive festival or an intimate live show?",
      "Would you rather only listen to music from the 70s or only from the 2010s?",
      "Would you rather be able to sing beautifully or play any instrument perfectly?",
    ],
    hotTake: [
      "Hot take: Live music is almost always better than the studio version.",
      "Hot take: Streaming has made music worse by rewarding short, forgettable songs.",
      "Hot take: Lyrics don't matter — it's all about the feeling.",
      "Hot take: Most modern pop music sounds exactly the same.",
    ],
    story: [
      "Tell us about a song that takes you back to a specific moment in your life.",
      "Describe a concert experience that stayed with you.",
      "Share a song you were embarrassed to like but secretly loved.",
      "Tell us about a time music helped you through something difficult.",
    ],
    hypothetical: [
      "If you could only listen to one artist forever, who would it be?",
      "If you could perform on stage with any musician, who would you choose?",
      "If you could bring back any band that broke up, who would it be?",
      "If you had written one famous song, which one would you want it to be?",
    ],
  },
  series: {
    warmup: [
      "What's the last show you binge-watched and couldn't stop?",
      "Do you prefer short limited series or long multi-season shows?",
      "Is there a show you've watched more than once?",
      "What show would you recommend to someone who has no idea what to watch?",
    ],
    wouldYouRather: [
      "Would you rather watch a show weekly or binge it all at once?",
      "Would you rather only watch comedies or only dramas for a year?",
      "Would you rather be a character in your favourite show or write an episode of it?",
      "Would you rather every show get a proper ending or keep going forever?",
    ],
    hotTake: [
      "Hot take: Most shows should end after two seasons.",
      "Hot take: Reality TV is more honest than scripted drama.",
      "Hot take: Dubbed versions are just as good as subtitles.",
      "Hot take: The book is never actually better than the adaptation.",
    ],
    story: [
      "Tell us about a show that genuinely surprised you.",
      "Describe a scene or moment in a series that made you emotional.",
      "Share a show you started watching as a joke and ended up loving.",
      "Tell us about a character you related to way more than you expected.",
    ],
    hypothetical: [
      "If you could live inside any TV show universe, which one would you pick?",
      "If you could rewrite the ending of one show, which one and how?",
      "If you had to play a character from any series, who would it be?",
      "If you could greenlight one cancelled show to come back, which one?",
    ],
  },
  trabajo: {
    warmup: [
      "What do you do for work — and what do you love most about it?",
      "What's the most interesting or unusual job you've ever had?",
      "Do you prefer working from home or from an office?",
      "What skill are you trying to develop right now in your career?",
    ],
    wouldYouRather: [
      "Would you rather have a job you love with an average salary or a job you hate with a great salary?",
      "Would you rather be your own boss or work for an inspiring company?",
      "Would you rather work 4 long days or 5 regular days?",
      "Would you rather have a clear routine or a different task every day?",
    ],
    hotTake: [
      "Hot take: Remote work has made people less creative, not more.",
      "Hot take: Passion for your job is overrated — work is just work.",
      "Hot take: A degree is no longer necessary for most careers.",
      "Hot take: 'Hustle culture' does more harm than good.",
    ],
    story: [
      "Tell us about a professional challenge that taught you the most.",
      "Describe a moment at work you're genuinely proud of.",
      "Share a time a colleague or mentor changed how you work.",
      "Tell us about a career decision you made that surprised even yourself.",
    ],
    hypothetical: [
      "If money wasn't a factor, what would your ideal job be?",
      "If you could switch careers tomorrow, what would you do?",
      "If you could go back and give your younger professional self one piece of advice, what would it be?",
      "If you could work anywhere in the world for a year, where would you go?",
    ],
  },
  amor: {
    warmup: [
      "How did you meet your partner — or what's your most memorable date story?",
      "Do you believe in love at first sight?",
      "What quality do you value most in a romantic partner?",
      "What would your idea of a perfect date look like?",
    ],
    wouldYouRather: [
      "Would you rather be with someone who makes you laugh or someone who makes you feel safe?",
      "Would you rather have one great love story or several meaningful relationships?",
      "Would you rather know when you'll meet your soulmate or be surprised?",
      "Would you rather fall in love slowly or instantly?",
    ],
    hotTake: [
      "Hot take: Friendship is a better foundation for love than attraction.",
      "Hot take: Long-distance relationships rarely work out.",
      "Hot take: Social media has made it harder to maintain healthy relationships.",
      "Hot take: People change too much for a relationship to truly last forever.",
    ],
    story: [
      "Tell us about a time you did something unexpectedly romantic.",
      "Share a story about a relationship that taught you something important about yourself.",
      "Tell us about a moment when you knew someone was special.",
      "Describe the most thoughtful thing anyone has ever done for you.",
    ],
    hypothetical: [
      "If you could write a letter to your younger self about love, what would it say?",
      "If a movie was made about your love life, what genre would it be?",
      "If you could go back and relive one romantic moment, what would it be?",
      "If you had to describe love in three words only, what would they be?",
    ],
  },
  mundo: {
    warmup: [
      "What world issue concerns you the most right now?",
      "Is there a country or culture that fascinates you and why?",
      "What recent news story surprised or moved you?",
      "Do you think the world is better or worse than it was 20 years ago?",
    ],
    wouldYouRather: [
      "Would you rather live in a world with no borders or one with stronger communities?",
      "Would you rather have access to all information or privacy from all tracking?",
      "Would you rather solve climate change or world hunger first?",
      "Would you rather live in the past (choose the era) or 100 years in the future?",
    ],
    hotTake: [
      "Hot take: Social media has done more harm than good for society.",
      "Hot take: Individual choices matter more than government policy for climate change.",
      "Hot take: Globalization has made cultures less interesting.",
      "Hot take: The news makes the world seem worse than it actually is.",
    ],
    story: [
      "Tell us about a moment that made you feel connected to people from another culture.",
      "Share an experience that changed your political or social view.",
      "Describe a time you witnessed something that gave you hope in humanity.",
      "Tell us about a global event that personally affected your life.",
    ],
    hypothetical: [
      "If you could change one law in the world, what would it be?",
      "If you could solve one global problem overnight, which one would you choose?",
      "If you were elected to lead your country tomorrow, what's the first thing you'd do?",
      "If you could meet any world leader or historical figure, who and why?",
    ],
  },
  gastronomia: {
    warmup: [
      "What's your go-to dish to cook when you want to impress someone?",
      "Do you have a family recipe that's been passed down to you?",
      "What cuisine from another country do you love the most?",
      "Are you more of a home cooking or restaurant person?",
    ],
    wouldYouRather: [
      "Would you rather eat only sweet or only savoury food for the rest of your life?",
      "Would you rather cook an elaborate meal or order from the best restaurant in town?",
      "Would you rather never eat your favourite food again or eat only that food forever?",
      "Would you rather be a world-class chef or a world-class food critic?",
    ],
    hotTake: [
      "Hot take: Fast food gets too much hate — some of it is genuinely great.",
      "Hot take: Wine pairings are mostly pretentious nonsense.",
      "Hot take: Brunch is overrated and overpriced.",
      "Hot take: The best food is always found at street stalls, not fancy restaurants.",
    ],
    story: [
      "Tell us about the best meal of your life — where, what, and with who.",
      "Describe a cooking disaster that turned into a funny story.",
      "Share a food experience abroad that genuinely surprised you.",
      "Tell us about a dish that reminds you of home or childhood.",
    ],
    hypothetical: [
      "If you could only eat food from one country forever, which would you choose?",
      "If you could have dinner with any chef in the world, who would it be?",
      "If you opened a restaurant, what would the concept be?",
      "If you could master one cuisine overnight, which one would you pick?",
    ],
  },
  deporte: {
    warmup: [
      "What sport do you play or follow most?",
      "What's the most exciting sports moment you've ever witnessed live?",
      "Do you prefer team sports or individual sports?",
      "Is there a sport you've always wanted to try but haven't yet?",
    ],
    wouldYouRather: [
      "Would you rather be the best player on a losing team or a decent player on a winning one?",
      "Would you rather be an elite athlete for 5 years or a good amateur forever?",
      "Would you rather watch sports live at the stadium or from home in perfect comfort?",
      "Would you rather win a gold medal alone or a championship with a team?",
    ],
    hotTake: [
      "Hot take: eSports are real sports and deserve the same respect.",
      "Hot take: Money has completely ruined elite football.",
      "Hot take: The Olympics have become more about politics than sport.",
      "Hot take: Fitness influencers do more harm than good.",
    ],
    story: [
      "Tell us about a sporting achievement you're really proud of — however small.",
      "Describe the most emotional sporting moment you've ever watched.",
      "Share a time sport taught you something important about yourself.",
      "Tell us about a sports hero of yours and why they inspire you.",
    ],
    hypothetical: [
      "If you could be a professional athlete in any sport, which one would you choose?",
      "If you could watch any sporting event from history live, which one?",
      "If you had to train for one year to compete in any sport, what would it be?",
      "If you could change one rule in any sport, what would it be?",
    ],
  },
};

export const LEVEL_META = {
  básico:     { label: "Básico",      color: "#06D6A0", bg: "rgba(6,214,160,.12)" },
  intermedio: { label: "Intermedio",  color: "#FF9E4F", bg: "rgba(255,158,79,.12)" },
  avanzado:   { label: "Avanzado",    color: "#845EC2", bg: "rgba(132,94,194,.12)" },
};
