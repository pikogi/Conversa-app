"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Profile = {
  id: string;
  name: string;
  avatar: string;
  role: "user" | "facilitator";
  english_level: string;
};

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("profiles")
        .select("id, name, avatar, role, english_level, age, city, bio, topics")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
      } else {
        // Perfil no existe — lo creamos desde los metadatos del usuario
        const meta = user.user_metadata ?? {};
        const name = meta.name ?? user.email?.split("@")[0] ?? "Usuario";
        const { data: created } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            name,
            avatar: name.charAt(0).toUpperCase(),
            role: "user",
            english_level: meta.english_level ?? "básico",
          })
          .select("id, name, avatar, role, english_level")
          .single();
        setProfile(created);
      }

      setLoading(false);
    });
  }, []);

  return { profile, loading, isFacilitator: profile?.role === "facilitator" };
}
