-- ============================================================
-- TAYA — Seed data for testing
-- Run this in the Supabase SQL Editor AFTER running schema.sql.
-- Creates 12 fake users, ~60 workouts, and follow relationships.
--
-- To undo: run supabase/seed-teardown.sql
-- ============================================================

BEGIN;

-- ── 1. Create fake auth users ──────────────────────────────
-- We insert directly into auth.users so profiles are auto-created
-- by the handle_new_user trigger. All test accounts share the
-- password "test" (hashed below).

INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES
  ('a1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test1@test.com', crypt('test', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW() - INTERVAL '30 days', NOW(), '', '', '', ''),
  ('a1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test2@test.com', crypt('test', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW() - INTERVAL '28 days', NOW(), '', '', '', ''),
  ('a1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test3@test.com', crypt('test', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW() - INTERVAL '25 days', NOW(), '', '', '', ''),
  ('a1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test4@test.com', crypt('test', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW() - INTERVAL '22 days', NOW(), '', '', '', ''),
  ('a1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test5@test.com', crypt('test', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW() - INTERVAL '20 days', NOW(), '', '', '', ''),
  ('a1000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test6@test.com', crypt('test', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW() - INTERVAL '18 days', NOW(), '', '', '', ''),
  ('a1000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test7@test.com', crypt('test', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW() - INTERVAL '15 days', NOW(), '', '', '', ''),
  ('a1000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test8@test.com', crypt('test', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW() - INTERVAL '12 days', NOW(), '', '', '', ''),
  ('a1000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test9@test.com', crypt('test', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW() - INTERVAL '10 days', NOW(), '', '', '', ''),
  ('a1000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test10@test.com', crypt('test', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW() - INTERVAL '8 days',  NOW(), '', '', '', ''),
  ('a1000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test11@test.com', crypt('test', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW() - INTERVAL '5 days',  NOW(), '', '', '', ''),
  ('a1000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test12@test.com', crypt('test', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW() - INTERVAL '3 days',  NOW(), '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- Also add identities so Supabase Auth login works for these users
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT id, id, email,
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  'email', NOW(), NOW(), NOW()
FROM auth.users
WHERE id IN (
  'a1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000005',
  'a1000000-0000-0000-0000-000000000006',
  'a1000000-0000-0000-0000-000000000007',
  'a1000000-0000-0000-0000-000000000008',
  'a1000000-0000-0000-0000-000000000009',
  'a1000000-0000-0000-0000-000000000010',
  'a1000000-0000-0000-0000-000000000011',
  'a1000000-0000-0000-0000-000000000012'
)
ON CONFLICT DO NOTHING;


-- ── 2. Update profiles with names, handles, avatars ────────
-- The trigger already created bare profile rows. Now fill them in.
-- Names span Nigerian, Italian, Indian, Japanese, Arab, Brazilian,
-- Swedish, Ghanaian, Chinese, Colombian, Kenyan, and Korean cultures.

UPDATE profiles SET name = 'Amara Okafor',    handle = 'amara',  avatar_url = '/profilephotos/user1.png',  email = 'test1@test.com',  onboarding_completed = true, location = 'Brooklyn, NY',           tagline = 'Run until it feels like flying.',        bio = 'Trail runner. Chasing horizons one mile at a time.',                   prompts = '[{"question":"If I had to pick one workout for life","answer":"A long trail run at sunrise."},{"question":"Currently chasing","answer":"Sub-4 hour marathon debut."},{"question":"Go to post-workout meal","answer":"Jollof rice and sweet plantains."},{"question":"On rest days, you''ll find me","answer":"Walking the neighborhood with no destination."}]'::jsonb WHERE id = 'a1000000-0000-0000-0000-000000000001';
UPDATE profiles SET name = 'Luca Moretti',    handle = 'luca',   avatar_url = '/profilephotos/user2.png',  email = 'test2@test.com',  onboarding_completed = true, location = 'Milan, Italy',            tagline = 'Lift heavy. Live simple.',               bio = 'Powerlifter turned CrossFitter. Still can''t decide.',                  prompts = '[{"question":"If I had to pick one workout for life","answer":"Back squat day, always."},{"question":"Currently chasing","answer":"A 500 lb deadlift."},{"question":"Go to post-workout meal","answer":"Pasta aglio e olio. Non-negotiable."},{"question":"On rest days, you''ll find me","answer":"Espresso, a long walk, and maybe a nap."}]'::jsonb WHERE id = 'a1000000-0000-0000-0000-000000000002';
UPDATE profiles SET name = 'Priya Sharma',    handle = 'priya',  avatar_url = '/profilephotos/user3.png',  email = 'test3@test.com',  onboarding_completed = true, location = 'San Francisco, CA',       tagline = 'Miles on two wheels. Laps in open water.', bio = 'Triathlete in progress. Fueled by chai and ambition.',                 prompts = '[{"question":"If I had to pick one workout for life","answer":"A 50-mile Sunday bike ride."},{"question":"Currently chasing","answer":"Finishing my first triathlon."},{"question":"Go to post-workout meal","answer":"Masala chai and a banana."},{"question":"On rest days, you''ll find me","answer":"Reading on my balcony."}]'::jsonb WHERE id = 'a1000000-0000-0000-0000-000000000003';
UPDATE profiles SET name = 'Yuki Tanaka',     handle = 'yuki',   avatar_url = '/profilephotos/user4.png',  email = 'test4@test.com',  onboarding_completed = true, location = 'Tokyo, Japan',            tagline = 'The mat is my church.',                  bio = 'Yoga teacher. Reformer convert. Breathe first, everything else second.', prompts = '[{"question":"If I had to pick one workout for life","answer":"Sunrise yin yoga, no exceptions."},{"question":"Currently chasing","answer":"A 30-day unbroken practice streak."},{"question":"Go to post-workout meal","answer":"Miso soup and steamed rice."},{"question":"On rest days, you''ll find me","answer":"Soaking in an onsen if I could."}]'::jsonb WHERE id = 'a1000000-0000-0000-0000-000000000004';
UPDATE profiles SET name = 'Fatima Al-Rashid', handle = 'fatima', avatar_url = '/profilephotos/user5.png',  email = 'test5@test.com',  onboarding_completed = true, location = 'Dubai, UAE',              tagline = 'Cross-court and cross-courtyard.',        bio = 'Tennis obsessive. Pickleball convert. Backhand is a work in progress.', prompts = '[{"question":"If I had to pick one workout for life","answer":"Singles tennis on clay."},{"question":"Currently chasing","answer":"Breaking into the 4.5 NTRP bracket."},{"question":"Go to post-workout meal","answer":"Dates, labneh, and a cold glass of water."},{"question":"On rest days, you''ll find me","answer":"At a rooftop café watching the city."}]'::jsonb WHERE id = 'a1000000-0000-0000-0000-000000000005';
UPDATE profiles SET name = 'Mateo Silva',     handle = 'mateo',  avatar_url = '/profilephotos/user6.jpg',  email = 'test6@test.com',  onboarding_completed = true, location = 'Rio de Janeiro, Brazil',  tagline = 'Ocean first. Everything else second.',   bio = 'Dawn patrol every morning. Bouldering gym every evening.',             prompts = '[{"question":"If I had to pick one workout for life","answer":"Dawn patrol surf, no contest."},{"question":"Currently chasing","answer":"Sending a V7 outdoors."},{"question":"Go to post-workout meal","answer":"Açaí bowl, always."},{"question":"On rest days, you''ll find me","answer":"In a hammock on the beach."}]'::jsonb WHERE id = 'a1000000-0000-0000-0000-000000000006';
UPDATE profiles SET name = 'Ingrid Lindqvist', handle = 'ingrid', avatar_url = '/profilephotos/user7.jpg',  email = 'test7@test.com',  onboarding_completed = true, location = 'Stockholm, Sweden',       tagline = 'All heart, no off-season.',              bio = 'Former college player. Now just vibes and pickup games.',              prompts = '[{"question":"If I had to pick one workout for life","answer":"Full-court 5v5. Nothing else comes close."},{"question":"Currently chasing","answer":"Dunking. Still working on the hops."},{"question":"Go to post-workout meal","answer":"Protein shake, then Swedish meatballs later."},{"question":"On rest days, you''ll find me","answer":"Sauna and a good podcast."}]'::jsonb WHERE id = 'a1000000-0000-0000-0000-000000000007';
UPDATE profiles SET name = 'Kofi Mensah',     handle = 'kofi',   avatar_url = '/profilephotos/user8.jpg',  email = 'test8@test.com',  onboarding_completed = true, location = 'Accra, Ghana',            tagline = 'Move like music. Hit like thunder.',     bio = 'Dance is my language. Boxing is my therapy.',                         prompts = '[{"question":"If I had to pick one workout for life","answer":"Boxing. It''s cardio, therapy, and art."},{"question":"Currently chasing","answer":"Choreographing a full 5-minute routine."},{"question":"Go to post-workout meal","answer":"Fufu and groundnut soup."},{"question":"On rest days, you''ll find me","answer":"At a live music show."}]'::jsonb WHERE id = 'a1000000-0000-0000-0000-000000000008';
UPDATE profiles SET name = 'Mei-Lin Zhang',   handle = 'meilin', avatar_url = '/profilephotos/user9.jpg',  email = 'test9@test.com',  onboarding_completed = true, location = 'Shanghai, China',         tagline = 'Goals, assists, and erg splits.',        bio = 'Left midfielder. Indoor rower. Always chasing the next PR.',           prompts = '[{"question":"If I had to pick one workout for life","answer":"Full-field soccer with no subs."},{"question":"Currently chasing","answer":"A sub-19 min 5k on the erg."},{"question":"Go to post-workout meal","answer":"Dan dan noodles."},{"question":"On rest days, you''ll find me","answer":"Tea ceremony and a long walk by the river."}]'::jsonb WHERE id = 'a1000000-0000-0000-0000-000000000009';
UPDATE profiles SET name = 'Santiago Reyes',  handle = 'santi',  avatar_url = '/profilephotos/user10.jpg', email = 'test10@test.com', onboarding_completed = true, location = 'Bogotá, Colombia',         tagline = 'Every sport is a good sport.',           bio = 'Generalist athlete. Never the best at any one thing. Fine with that.', prompts = '[{"question":"If I had to pick one workout for life","answer":"Beach volleyball. Sun included."},{"question":"Currently chasing","answer":"Playing every sport on every continent."},{"question":"Go to post-workout meal","answer":"Bandeja paisa. The full thing."},{"question":"On rest days, you''ll find me","answer":"On a golf cart, pretending I''m good at golf."}]'::jsonb WHERE id = 'a1000000-0000-0000-0000-000000000010';
UPDATE profiles SET name = 'Aisha Wanjiku',   handle = 'aisha',  avatar_url = '/profilephotos/user11.jpg', email = 'test11@test.com', onboarding_completed = true, location = 'Nairobi, Kenya',          tagline = 'Earn the powder. Earn the ride.',        bio = 'Peloton devotee in the city. Ski bum in the mountains.',               prompts = '[{"question":"If I had to pick one workout for life","answer":"Ski touring. Every ascent is earned."},{"question":"Currently chasing","answer":"A double black diamond without stopping."},{"question":"Go to post-workout meal","answer":"Ugali and sukuma wiki."},{"question":"On rest days, you''ll find me","answer":"Watching snow fall from a cozy lodge."}]'::jsonb WHERE id = 'a1000000-0000-0000-0000-000000000011';
UPDATE profiles SET name = 'Jin-Soo Park',    handle = 'jinsoo', avatar_url = '/profilephotos/user12.jpg', email = 'test12@test.com', onboarding_completed = true, location = 'Seoul, South Korea',      tagline = 'Miles and mindfulness.',                bio = 'Running clears my head. Yoga keeps it clear.',                        prompts = '[{"question":"If I had to pick one workout for life","answer":"Early morning run before anyone''s awake."},{"question":"Currently chasing","answer":"Sub-20 min 5k."},{"question":"Go to post-workout meal","answer":"Bibimbap with extra gochujang."},{"question":"On rest days, you''ll find me","answer":"Jjimjilbang, then a long nap."}]'::jsonb WHERE id = 'a1000000-0000-0000-0000-000000000012';


-- ── 3. Insert workouts ─────────────────────────────────────
-- Spread across the last 14 days with varied activity types.

INSERT INTO workouts (user_id, date, description, activity_type, created_at) VALUES
  -- Amara Okafor — runner & hiker
  ('a1000000-0000-0000-0000-000000000001', TO_CHAR(NOW() - INTERVAL '0 days', 'YYYY-MM-DD'), 'Easy 3-miler around the lake',                        'run',        NOW() - INTERVAL '2 hours'),
  ('a1000000-0000-0000-0000-000000000001', TO_CHAR(NOW() - INTERVAL '1 day',  'YYYY-MM-DD'), 'Tempo run — 6 miles with the last 2 at race pace',    'run',        NOW() - INTERVAL '1 day'),
  ('a1000000-0000-0000-0000-000000000001', TO_CHAR(NOW() - INTERVAL '3 days', 'YYYY-MM-DD'), 'Sunrise hike up Eagle Peak. Views were insane',        'hike',       NOW() - INTERVAL '3 days'),
  ('a1000000-0000-0000-0000-000000000001', TO_CHAR(NOW() - INTERVAL '5 days', 'YYYY-MM-DD'), 'Recovery jog + stretching',                            'run',        NOW() - INTERVAL '5 days'),
  ('a1000000-0000-0000-0000-000000000001', TO_CHAR(NOW() - INTERVAL '7 days', 'YYYY-MM-DD'), 'Long run — 10 miles. Felt strong the whole way',       'run',        NOW() - INTERVAL '7 days'),

  -- Luca Moretti — lifter & CrossFit
  ('a1000000-0000-0000-0000-000000000002', TO_CHAR(NOW() - INTERVAL '0 days', 'YYYY-MM-DD'), 'Push day: bench 225x5, OHP 135x8',                     'lift',       NOW() - INTERVAL '3 hours'),
  ('a1000000-0000-0000-0000-000000000002', TO_CHAR(NOW() - INTERVAL '1 day',  'YYYY-MM-DD'), 'Murph WOD — 34:22. New PR!',                           'crossfit',   NOW() - INTERVAL '1 day'),
  ('a1000000-0000-0000-0000-000000000002', TO_CHAR(NOW() - INTERVAL '2 days', 'YYYY-MM-DD'), 'Pull day: weighted pull-ups and barbell rows',          'lift',       NOW() - INTERVAL '2 days'),
  ('a1000000-0000-0000-0000-000000000002', TO_CHAR(NOW() - INTERVAL '4 days', 'YYYY-MM-DD'), 'Leg day — squats, lunges, leg press. Walking funny',   'lift',       NOW() - INTERVAL '4 days'),
  ('a1000000-0000-0000-0000-000000000002', TO_CHAR(NOW() - INTERVAL '6 days', 'YYYY-MM-DD'), 'CrossFit class — AMRAP 20 min',                        'crossfit',   NOW() - INTERVAL '6 days'),

  -- Priya Sharma — cyclist & swimmer
  ('a1000000-0000-0000-0000-000000000003', TO_CHAR(NOW() - INTERVAL '0 days', 'YYYY-MM-DD'), '40-mile ride through the valley',                      'cycle',      NOW() - INTERVAL '4 hours'),
  ('a1000000-0000-0000-0000-000000000003', TO_CHAR(NOW() - INTERVAL '2 days', 'YYYY-MM-DD'), 'Open water swim — 1500m at the reservoir',              'swim',       NOW() - INTERVAL '2 days'),
  ('a1000000-0000-0000-0000-000000000003', TO_CHAR(NOW() - INTERVAL '3 days', 'YYYY-MM-DD'), 'Hill repeats on the bike. Legs are toast',              'cycle',      NOW() - INTERVAL '3 days'),
  ('a1000000-0000-0000-0000-000000000003', TO_CHAR(NOW() - INTERVAL '5 days', 'YYYY-MM-DD'), 'Easy spin + coffee stop',                               'cycle',      NOW() - INTERVAL '5 days'),
  ('a1000000-0000-0000-0000-000000000003', TO_CHAR(NOW() - INTERVAL '8 days', 'YYYY-MM-DD'), 'Pool session: 2000m with pull buoy drills',             'swim',       NOW() - INTERVAL '8 days'),

  -- Yuki Tanaka — yoga & Pilates
  ('a1000000-0000-0000-0000-000000000004', TO_CHAR(NOW() - INTERVAL '0 days', 'YYYY-MM-DD'), 'Morning vinyasa flow — 60 min',                        'yoga',       NOW() - INTERVAL '1 hour'),
  ('a1000000-0000-0000-0000-000000000004', TO_CHAR(NOW() - INTERVAL '1 day',  'YYYY-MM-DD'), 'Pilates reformer class',                               'pilates',    NOW() - INTERVAL '1 day'),
  ('a1000000-0000-0000-0000-000000000004', TO_CHAR(NOW() - INTERVAL '2 days', 'YYYY-MM-DD'), 'Yin yoga before bed. So relaxing',                     'yoga',       NOW() - INTERVAL '2 days'),
  ('a1000000-0000-0000-0000-000000000004', TO_CHAR(NOW() - INTERVAL '4 days', 'YYYY-MM-DD'), 'Power yoga + core work',                               'yoga',       NOW() - INTERVAL '4 days'),
  ('a1000000-0000-0000-0000-000000000004', TO_CHAR(NOW() - INTERVAL '6 days', 'YYYY-MM-DD'), 'Mat Pilates — focused on obliques',                    'pilates',    NOW() - INTERVAL '6 days'),

  -- Fatima Al-Rashid — tennis & pickleball
  ('a1000000-0000-0000-0000-000000000005', TO_CHAR(NOW() - INTERVAL '0 days', 'YYYY-MM-DD'), 'Singles match vs. a 4.0 player. Won in 3 sets!',       'tennis',     NOW() - INTERVAL '5 hours'),
  ('a1000000-0000-0000-0000-000000000005', TO_CHAR(NOW() - INTERVAL '1 day',  'YYYY-MM-DD'), 'Pickleball doubles at the park',                       'pickleball', NOW() - INTERVAL '1 day'),
  ('a1000000-0000-0000-0000-000000000005', TO_CHAR(NOW() - INTERVAL '3 days', 'YYYY-MM-DD'), 'Hitting session — working on my backhand',              'tennis',     NOW() - INTERVAL '3 days'),
  ('a1000000-0000-0000-0000-000000000005', TO_CHAR(NOW() - INTERVAL '5 days', 'YYYY-MM-DD'), 'Pickleball tournament. Made it to semis',              'pickleball', NOW() - INTERVAL '5 days'),
  ('a1000000-0000-0000-0000-000000000005', TO_CHAR(NOW() - INTERVAL '7 days', 'YYYY-MM-DD'), 'Tennis drills + conditioning',                          'tennis',     NOW() - INTERVAL '7 days'),

  -- Mateo Silva — surfer & climber
  ('a1000000-0000-0000-0000-000000000006', TO_CHAR(NOW() - INTERVAL '0 days', 'YYYY-MM-DD'), 'Dawn patrol — overhead sets, glassy conditions',        'surf',       NOW() - INTERVAL '6 hours'),
  ('a1000000-0000-0000-0000-000000000006', TO_CHAR(NOW() - INTERVAL '2 days', 'YYYY-MM-DD'), 'Bouldering at the gym — sent a V6!',                   'climb',      NOW() - INTERVAL '2 days'),
  ('a1000000-0000-0000-0000-000000000006', TO_CHAR(NOW() - INTERVAL '3 days', 'YYYY-MM-DD'), 'Surfed for 2 hours. Small but fun',                    'surf',       NOW() - INTERVAL '3 days'),
  ('a1000000-0000-0000-0000-000000000006', TO_CHAR(NOW() - INTERVAL '6 days', 'YYYY-MM-DD'), 'Top-rope climbing outdoors',                            'climb',      NOW() - INTERVAL '6 days'),
  ('a1000000-0000-0000-0000-000000000006', TO_CHAR(NOW() - INTERVAL '9 days', 'YYYY-MM-DD'), 'Sunset surf session. Perfect way to end the day',      'surf',       NOW() - INTERVAL '9 days'),

  -- Ingrid Lindqvist — basketball & HIIT
  ('a1000000-0000-0000-0000-000000000007', TO_CHAR(NOW() - INTERVAL '0 days', 'YYYY-MM-DD'), 'Pickup game at the rec center. W.',                    'basketball', NOW() - INTERVAL '4 hours'),
  ('a1000000-0000-0000-0000-000000000007', TO_CHAR(NOW() - INTERVAL '1 day',  'YYYY-MM-DD'), '30 min HIIT circuit — burpees, box jumps, KB swings',  'hiit',       NOW() - INTERVAL '1 day'),
  ('a1000000-0000-0000-0000-000000000007', TO_CHAR(NOW() - INTERVAL '3 days', 'YYYY-MM-DD'), '5v5 game. Dropped 18 points',                          'basketball', NOW() - INTERVAL '3 days'),
  ('a1000000-0000-0000-0000-000000000007', TO_CHAR(NOW() - INTERVAL '5 days', 'YYYY-MM-DD'), 'Tabata workout — 4 rounds, fully gassed',              'hiit',       NOW() - INTERVAL '5 days'),
  ('a1000000-0000-0000-0000-000000000007', TO_CHAR(NOW() - INTERVAL '7 days', 'YYYY-MM-DD'), 'Shooting drills and free throws',                       'basketball', NOW() - INTERVAL '7 days'),

  -- Kofi Mensah — dancer & boxer
  ('a1000000-0000-0000-0000-000000000008', TO_CHAR(NOW() - INTERVAL '0 days', 'YYYY-MM-DD'), 'Hip-hop class — learned a new routine',                 'dance',      NOW() - INTERVAL '3 hours'),
  ('a1000000-0000-0000-0000-000000000008', TO_CHAR(NOW() - INTERVAL '1 day',  'YYYY-MM-DD'), 'Boxing — 8 rounds on the heavy bag',                   'boxing',     NOW() - INTERVAL '1 day'),
  ('a1000000-0000-0000-0000-000000000008', TO_CHAR(NOW() - INTERVAL '3 days', 'YYYY-MM-DD'), 'Contemporary dance rehearsal',                          'dance',      NOW() - INTERVAL '3 days'),
  ('a1000000-0000-0000-0000-000000000008', TO_CHAR(NOW() - INTERVAL '5 days', 'YYYY-MM-DD'), 'Sparring session. Coach says my jab is improving',     'boxing',     NOW() - INTERVAL '5 days'),
  ('a1000000-0000-0000-0000-000000000008', TO_CHAR(NOW() - INTERVAL '8 days', 'YYYY-MM-DD'), 'Salsa class. So much fun',                              'dance',      NOW() - INTERVAL '8 days'),

  -- Mei-Lin Zhang — soccer & rowing
  ('a1000000-0000-0000-0000-000000000009', TO_CHAR(NOW() - INTERVAL '0 days', 'YYYY-MM-DD'), 'Sunday league match — 2 assists',                      'soccer',     NOW() - INTERVAL '5 hours'),
  ('a1000000-0000-0000-0000-000000000009', TO_CHAR(NOW() - INTERVAL '2 days', 'YYYY-MM-DD'), '5k on the erg — 19:45 split',                          'rowing',     NOW() - INTERVAL '2 days'),
  ('a1000000-0000-0000-0000-000000000009', TO_CHAR(NOW() - INTERVAL '4 days', 'YYYY-MM-DD'), 'Small-sided game at the turf field',                   'soccer',     NOW() - INTERVAL '4 days'),
  ('a1000000-0000-0000-0000-000000000009', TO_CHAR(NOW() - INTERVAL '6 days', 'YYYY-MM-DD'), 'Rowing intervals: 500m x 6 with 90s rest',             'rowing',     NOW() - INTERVAL '6 days'),
  ('a1000000-0000-0000-0000-000000000009', TO_CHAR(NOW() - INTERVAL '9 days', 'YYYY-MM-DD'), 'Soccer practice — shooting and crosses',                'soccer',     NOW() - INTERVAL '9 days'),

  -- Santiago Reyes — all-around
  ('a1000000-0000-0000-0000-000000000010', TO_CHAR(NOW() - INTERVAL '0 days', 'YYYY-MM-DD'), 'Morning walk with the dog',                             'walk',       NOW() - INTERVAL '1 hour'),
  ('a1000000-0000-0000-0000-000000000010', TO_CHAR(NOW() - INTERVAL '1 day',  'YYYY-MM-DD'), 'Full-body stretch routine — 45 min',                   'stretch',    NOW() - INTERVAL '1 day'),
  ('a1000000-0000-0000-0000-000000000010', TO_CHAR(NOW() - INTERVAL '2 days', 'YYYY-MM-DD'), 'Golf — 18 holes. Shot an 87!',                         'golf',       NOW() - INTERVAL '2 days'),
  ('a1000000-0000-0000-0000-000000000010', TO_CHAR(NOW() - INTERVAL '4 days', 'YYYY-MM-DD'), 'Volleyball pickup on the beach',                       'volleyball', NOW() - INTERVAL '4 days'),
  ('a1000000-0000-0000-0000-000000000010', TO_CHAR(NOW() - INTERVAL '7 days', 'YYYY-MM-DD'), 'Martial arts class — working on roundhouse kicks',     'martial_arts', NOW() - INTERVAL '7 days'),

  -- Aisha Wanjiku — spin & ski
  ('a1000000-0000-0000-0000-000000000011', TO_CHAR(NOW() - INTERVAL '0 days', 'YYYY-MM-DD'), '45-min spin class. Instructor was brutal today',       'spin',       NOW() - INTERVAL '2 hours'),
  ('a1000000-0000-0000-0000-000000000011', TO_CHAR(NOW() - INTERVAL '2 days', 'YYYY-MM-DD'), 'Ski day — fresh powder, blue bird sky',                'ski',        NOW() - INTERVAL '2 days'),
  ('a1000000-0000-0000-0000-000000000011', TO_CHAR(NOW() - INTERVAL '4 days', 'YYYY-MM-DD'), 'Peloton ride: 30 min climb',                           'spin',       NOW() - INTERVAL '4 days'),
  ('a1000000-0000-0000-0000-000000000011', TO_CHAR(NOW() - INTERVAL '6 days', 'YYYY-MM-DD'), 'Backcountry skiing. Earned every turn',                'ski',        NOW() - INTERVAL '6 days'),
  ('a1000000-0000-0000-0000-000000000011', TO_CHAR(NOW() - INTERVAL '10 days','YYYY-MM-DD'), 'Spin + core combo class',                               'spin',       NOW() - INTERVAL '10 days'),

  -- Jin-Soo Park — runner & yoga
  ('a1000000-0000-0000-0000-000000000012', TO_CHAR(NOW() - INTERVAL '0 days', 'YYYY-MM-DD'), '5k at the track — 22:30. Getting faster',              'run',        NOW() - INTERVAL '3 hours'),
  ('a1000000-0000-0000-0000-000000000012', TO_CHAR(NOW() - INTERVAL '1 day',  'YYYY-MM-DD'), 'Hot yoga — survived the full 75 min',                  'yoga',       NOW() - INTERVAL '1 day'),
  ('a1000000-0000-0000-0000-000000000012', TO_CHAR(NOW() - INTERVAL '3 days', 'YYYY-MM-DD'), 'Interval run: 400m x 8 with 200m jog rest',            'run',        NOW() - INTERVAL '3 days'),
  ('a1000000-0000-0000-0000-000000000012', TO_CHAR(NOW() - INTERVAL '5 days', 'YYYY-MM-DD'), 'Restorative yoga + meditation',                         'yoga',       NOW() - INTERVAL '5 days'),
  ('a1000000-0000-0000-0000-000000000012', TO_CHAR(NOW() - INTERVAL '8 days', 'YYYY-MM-DD'), 'Long easy run — 7 miles, perfect weather',             'run',        NOW() - INTERVAL '8 days');


-- ── 4. Follow relationships ────────────────────────────────
-- Create a realistic social graph. Not everyone follows everyone.

INSERT INTO follows (follower_id, following_id) VALUES
  -- Amara follows Luca, Priya, Yuki, Fatima, Mateo
  ('a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002'),
  ('a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003'),
  ('a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004'),
  ('a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000005'),
  ('a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000006'),

  -- Luca follows Amara, Priya, Ingrid
  ('a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003'),
  ('a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000007'),

  -- Priya follows Amara, Yuki, Mateo, Mei-Lin
  ('a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000004'),
  ('a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000006'),
  ('a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000009'),

  -- Yuki follows Amara, Priya, Kofi, Santiago
  ('a1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000003'),
  ('a1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000008'),
  ('a1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000010'),

  -- Fatima follows Amara, Ingrid, Jin-Soo
  ('a1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000007'),
  ('a1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000012'),

  -- Mateo follows Priya, Mei-Lin, Aisha
  ('a1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000003'),
  ('a1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000009'),
  ('a1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000011'),

  -- Ingrid follows Luca, Fatima, Kofi, Mei-Lin
  ('a1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000002'),
  ('a1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000005'),
  ('a1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000008'),
  ('a1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000009'),

  -- Kofi follows Yuki, Ingrid, Santiago, Jin-Soo
  ('a1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000004'),
  ('a1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000007'),
  ('a1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000010'),
  ('a1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000012'),

  -- Mei-Lin follows Mateo, Ingrid, Aisha
  ('a1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000006'),
  ('a1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000007'),
  ('a1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000011'),

  -- Santiago follows Yuki, Kofi, Aisha, Jin-Soo
  ('a1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000004'),
  ('a1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000008'),
  ('a1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000011'),
  ('a1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000012'),

  -- Aisha follows Mateo, Santiago, Jin-Soo
  ('a1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000006'),
  ('a1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000010'),
  ('a1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000012'),

  -- Jin-Soo follows Amara, Fatima, Kofi, Santiago
  ('a1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000005'),
  ('a1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000008'),
  ('a1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000010')
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================
-- Done! You now have 12 users, 60 workouts, and 44 follow
-- relationships. Log in as any test user with:
--   Email: test1@test.com … test12@test.com
--   Password: test
-- ============================================================
