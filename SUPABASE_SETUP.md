# Configuration Supabase — GSMI RMIS

## Étape 1 — Créer le compte
1. Aller sur https://supabase.com → "Start your project"
2. Se connecter avec Google
3. Cliquer "New project" → nom: `gsmi-rmis` → région: EU West

## Étape 2 — Créer la table
Dans Supabase → **SQL Editor** → coller et exécuter ce SQL :

```sql
create table gsmi_submissions (
  id          uuid default gen_random_uuid() primary key,
  email       text not null,
  nom         text,
  prenom      text,
  grade       text,
  axe         text,
  annee       text,
  mode        text,
  payload     jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(email, annee, mode)
);

-- Accès public en lecture/écriture (pour les formulaires)
alter table gsmi_submissions enable row level security;
create policy "Public insert" on gsmi_submissions for insert with check (true);
create policy "Public select" on gsmi_submissions for select using (true);
create policy "Public update" on gsmi_submissions for update using (true);
```

## Étape 3 — Copier les clés API
Settings → API → copier :
- **Project URL** → coller dans `VITE_SUPABASE_URL`
- **anon public key** → coller dans `VITE_SUPABASE_KEY`

## Étape 4 — Configurer Vercel
Dans Vercel → ton projet → Settings → Environment Variables :
- `VITE_SUPABASE_URL` = https://xxxxx.supabase.co
- `VITE_SUPABASE_KEY` = eyJhb...
- `VITE_ADMIN_CODE` = GSMI2025

Puis → Deployments → Redeploy.

## Résultat
- Chaque professeur remplit le formulaire sur profperf.vercel.app
- Ses données arrivent dans ton Supabase (visible dans Table Editor)
- Toi tu ouvres profperf.vercel.app → Accès Direction → tu vois TOUT
- Le bouton "☁ X réponses cloud" se rafraîchit à chaque ouverture admin
