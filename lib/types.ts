// Tipo que viene de Supabase (snake_case, participants como objetos)
export interface DbSpeakeasy {
  id: string;
  title: string;
  topic: string;
  description: string;
  date: string;
  time: string;
  meeting_url: string;
  facilitator_id: string;
  level: string;
  max_participants: number;
  participants: { user_id: string; profiles: { avatar: string; name: string } | null }[];
  profiles: { name: string; avatar: string } | null; // facilitador
}

export type Topic =
  | "viajes"
  | "musica"
  | "mundo"
  | "series"
  | "trabajo"
  | "amor"
  | "gastronomia"
  | "deporte";

export interface User {
  id: string;
  name: string;
  age: number;
  city: string;
  avatar: string;
  bio: string;
}

export interface Speakeasy {
  id: string;
  title: string;
  topic: Topic;
  description: string;
  date: string;
  time: string;
  meetingUrl: string;
  facilitatorId: string;
  participants: string[];
  maxParticipants: 4;
  level: "básico" | "intermedio" | "avanzado";
}
