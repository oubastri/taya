-- ============================================================
-- TAYA — Add about-section fields to profiles
-- Run this in the Supabase SQL Editor once.
-- Adds: location, tagline, bio, prompts (JSONB)
-- Then back-fills all 12 test users with seed data.
-- ============================================================

-- ── 1. Add columns ──────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS tagline  TEXT,
  ADD COLUMN IF NOT EXISTS bio      TEXT,
  ADD COLUMN IF NOT EXISTS prompts  JSONB;


-- ── 2. Seed about data for all 12 test users ────────────────

-- Amara Okafor — runner & hiker
UPDATE profiles SET
  location = 'Brooklyn, NY',
  tagline  = 'Run until it feels like flying.',
  bio      = 'Trail runner. Chasing horizons one mile at a time.',
  prompts  = $$[
    {"question": "If I had to pick one workout for life",  "answer": "A long trail run at sunrise."},
    {"question": "Currently chasing",                      "answer": "Sub-4 hour marathon debut."},
    {"question": "Go to post-workout meal",                "answer": "Jollof rice and sweet plantains."},
    {"question": "On rest days, you'll find me",           "answer": "Walking the neighborhood with no destination."}
  ]$$::jsonb
WHERE id = 'a1000000-0000-0000-0000-000000000001';

-- Luca Moretti — lifter & CrossFit
UPDATE profiles SET
  location = 'Milan, Italy',
  tagline  = 'Lift heavy. Live simple.',
  bio      = 'Powerlifter turned CrossFitter. Still can''t decide.',
  prompts  = $$[
    {"question": "If I had to pick one workout for life",  "answer": "Back squat day, always."},
    {"question": "Currently chasing",                      "answer": "A 500 lb deadlift."},
    {"question": "Go to post-workout meal",                "answer": "Pasta aglio e olio. Non-negotiable."},
    {"question": "On rest days, you'll find me",           "answer": "Espresso, a long walk, and maybe a nap."}
  ]$$::jsonb
WHERE id = 'a1000000-0000-0000-0000-000000000002';

-- Priya Sharma — cyclist & swimmer
UPDATE profiles SET
  location = 'San Francisco, CA',
  tagline  = 'Miles on two wheels. Laps in open water.',
  bio      = 'Triathlete in progress. Fueled by chai and ambition.',
  prompts  = $$[
    {"question": "If I had to pick one workout for life",  "answer": "A 50-mile Sunday bike ride."},
    {"question": "Currently chasing",                      "answer": "Finishing my first triathlon."},
    {"question": "Go to post-workout meal",                "answer": "Masala chai and a banana."},
    {"question": "On rest days, you'll find me",           "answer": "Reading on my balcony."}
  ]$$::jsonb
WHERE id = 'a1000000-0000-0000-0000-000000000003';

-- Yuki Tanaka — yoga & Pilates
UPDATE profiles SET
  location = 'Tokyo, Japan',
  tagline  = 'The mat is my church.',
  bio      = 'Yoga teacher. Reformer convert. Breathe first, everything else second.',
  prompts  = $$[
    {"question": "If I had to pick one workout for life",  "answer": "Sunrise yin yoga, no exceptions."},
    {"question": "Currently chasing",                      "answer": "A 30-day unbroken practice streak."},
    {"question": "Go to post-workout meal",                "answer": "Miso soup and steamed rice."},
    {"question": "On rest days, you'll find me",           "answer": "Soaking in an onsen if I could."}
  ]$$::jsonb
WHERE id = 'a1000000-0000-0000-0000-000000000004';

-- Fatima Al-Rashid — tennis & pickleball
UPDATE profiles SET
  location = 'Dubai, UAE',
  tagline  = 'Cross-court and cross-courtyard.',
  bio      = 'Tennis obsessive. Pickleball convert. Backhand is a work in progress.',
  prompts  = $$[
    {"question": "If I had to pick one workout for life",  "answer": "Singles tennis on clay."},
    {"question": "Currently chasing",                      "answer": "Breaking into the 4.5 NTRP bracket."},
    {"question": "Go to post-workout meal",                "answer": "Dates, labneh, and a cold glass of water."},
    {"question": "On rest days, you'll find me",           "answer": "At a rooftop café watching the city."}
  ]$$::jsonb
WHERE id = 'a1000000-0000-0000-0000-000000000005';

-- Mateo Silva — surfer & climber
UPDATE profiles SET
  location = 'Rio de Janeiro, Brazil',
  tagline  = 'Ocean first. Everything else second.',
  bio      = 'Dawn patrol every morning. Bouldering gym every evening.',
  prompts  = $$[
    {"question": "If I had to pick one workout for life",  "answer": "Dawn patrol surf, no contest."},
    {"question": "Currently chasing",                      "answer": "Sending a V7 outdoors."},
    {"question": "Go to post-workout meal",                "answer": "Açaí bowl, always."},
    {"question": "On rest days, you'll find me",           "answer": "In a hammock on the beach."}
  ]$$::jsonb
WHERE id = 'a1000000-0000-0000-0000-000000000006';

-- Ingrid Lindqvist — basketball & HIIT
UPDATE profiles SET
  location = 'Stockholm, Sweden',
  tagline  = 'All heart, no off-season.',
  bio      = 'Former college player. Now just vibes and pickup games.',
  prompts  = $$[
    {"question": "If I had to pick one workout for life",  "answer": "Full-court 5v5. Nothing else comes close."},
    {"question": "Currently chasing",                      "answer": "Dunking. Still working on the hops."},
    {"question": "Go to post-workout meal",                "answer": "Protein shake, then Swedish meatballs later."},
    {"question": "On rest days, you'll find me",           "answer": "Sauna and a good podcast."}
  ]$$::jsonb
WHERE id = 'a1000000-0000-0000-0000-000000000007';

-- Kofi Mensah — dancer & boxer
UPDATE profiles SET
  location = 'Accra, Ghana',
  tagline  = 'Move like music. Hit like thunder.',
  bio      = 'Dance is my language. Boxing is my therapy.',
  prompts  = $$[
    {"question": "If I had to pick one workout for life",  "answer": "Boxing. It's cardio, therapy, and art."},
    {"question": "Currently chasing",                      "answer": "Choreographing a full 5-minute routine."},
    {"question": "Go to post-workout meal",                "answer": "Fufu and groundnut soup."},
    {"question": "On rest days, you'll find me",           "answer": "At a live music show."}
  ]$$::jsonb
WHERE id = 'a1000000-0000-0000-0000-000000000008';

-- Mei-Lin Zhang — soccer & rowing
UPDATE profiles SET
  location = 'Shanghai, China',
  tagline  = 'Goals, assists, and erg splits.',
  bio      = 'Left midfielder. Indoor rower. Always chasing the next PR.',
  prompts  = $$[
    {"question": "If I had to pick one workout for life",  "answer": "Full-field soccer with no subs."},
    {"question": "Currently chasing",                      "answer": "A sub-19 min 5k on the erg."},
    {"question": "Go to post-workout meal",                "answer": "Dan dan noodles."},
    {"question": "On rest days, you'll find me",           "answer": "Tea ceremony and a long walk by the river."}
  ]$$::jsonb
WHERE id = 'a1000000-0000-0000-0000-000000000009';

-- Santiago Reyes — all-around
UPDATE profiles SET
  location = 'Bogotá, Colombia',
  tagline  = 'Every sport is a good sport.',
  bio      = 'Generalist athlete. Never the best at any one thing. Fine with that.',
  prompts  = $$[
    {"question": "If I had to pick one workout for life",  "answer": "Beach volleyball. Sun included."},
    {"question": "Currently chasing",                      "answer": "Playing every sport on every continent."},
    {"question": "Go to post-workout meal",                "answer": "Bandeja paisa. The full thing."},
    {"question": "On rest days, you'll find me",           "answer": "On a golf cart, pretending I'm good at golf."}
  ]$$::jsonb
WHERE id = 'a1000000-0000-0000-0000-000000000010';

-- Aisha Wanjiku — spin & ski
UPDATE profiles SET
  location = 'Nairobi, Kenya',
  tagline  = 'Earn the powder. Earn the ride.',
  bio      = 'Peloton devotee in the city. Ski bum in the mountains.',
  prompts  = $$[
    {"question": "If I had to pick one workout for life",  "answer": "Ski touring. Every ascent is earned."},
    {"question": "Currently chasing",                      "answer": "A double black diamond without stopping."},
    {"question": "Go to post-workout meal",                "answer": "Ugali and sukuma wiki."},
    {"question": "On rest days, you'll find me",           "answer": "Watching snow fall from a cozy lodge."}
  ]$$::jsonb
WHERE id = 'a1000000-0000-0000-0000-000000000011';

-- Jin-Soo Park — runner & yoga
UPDATE profiles SET
  location = 'Seoul, South Korea',
  tagline  = 'Miles and mindfulness.',
  bio      = 'Running clears my head. Yoga keeps it clear.',
  prompts  = $$[
    {"question": "If I had to pick one workout for life",  "answer": "Early morning run before anyone's awake."},
    {"question": "Currently chasing",                      "answer": "Sub-20 min 5k."},
    {"question": "Go to post-workout meal",                "answer": "Bibimbap with extra gochujang."},
    {"question": "On rest days, you'll find me",           "answer": "Jjimjilbang, then a long nap."}
  ]$$::jsonb
WHERE id = 'a1000000-0000-0000-0000-000000000012';


-- ============================================================
-- Done! All 12 profiles now have location, tagline, bio,
-- and all 4 prompt answers filled in.
-- ============================================================
