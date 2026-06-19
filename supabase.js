// ══════════════════════════════════════════════════════════════════════════
// GSMI RMIS — Supabase integration
// Remplace localStorage par une base de données cloud centralisée.
// Toutes les soumissions de tous les professeurs arrivent ici.
// ══════════════════════════════════════════════════════════════════════════

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY

// ── Client Supabase léger (sans SDK — fetch natif) ─────────────────────
function headers() {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer': 'return=representation',
  }
}

async function query(table, method = 'GET', body = null, params = '') {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('Supabase non configuré — utilisation du localStorage')
    return null
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
      method,
      headers: headers(),
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const err = await res.text()
      console.error(`Supabase error [${method} ${table}]:`, err)
      return null
    }
    const text = await res.text()
    return text ? JSON.parse(text) : []
  } catch (e) {
    console.error('Supabase fetch error:', e)
    return null
  }
}

// ── UPSERT générique ───────────────────────────────────────────────────
async function upsert(table, data, conflictCol) {
  return query(table, 'POST', data, `?on_conflict=${conflictCol}`)
}

// ══════════════════════════════════════════════════════════════════════════
// SOUMISSIONS — table principale qui reçoit toutes les saisies
// Schema Supabase à créer (voir guide ci-dessous) :
//   id          uuid default gen_random_uuid() primary key
//   email       text not null
//   nom         text
//   prenom      text
//   grade       text
//   axe         text
//   annee       text
//   mode        text  -- 'profil' | 'prevision' | 'revision' | 'details'
//   payload     jsonb -- toutes les données du formulaire
//   created_at  timestamptz default now()
//   updated_at  timestamptz default now()
// ══════════════════════════════════════════════════════════════════════════

export async function saveToSupabase(email, nom, prenom, grade, axe, annee, mode, payload) {
  const data = {
    email,
    nom,
    prenom,
    grade,
    axe,
    annee,
    mode,
    payload,
    updated_at: new Date().toISOString(),
  }
  // Upsert sur (email, annee, mode) — une seule ligne par prof/année/mode
  const result = await query(
    'gsmi_submissions',
    'POST',
    data,
    '?on_conflict=email,annee,mode'
  )
  return result !== null
}

export async function loadAllFromSupabase() {
  const data = await query('gsmi_submissions', 'GET', null, '?order=updated_at.desc')
  return data || []
}

export async function loadByEmail(email) {
  const data = await query('gsmi_submissions', 'GET', null, `?email=eq.${encodeURIComponent(email)}&order=updated_at.desc`)
  return data || []
}

export function isSupabaseConfigured() {
  return !!(SUPABASE_URL && SUPABASE_KEY)
}
