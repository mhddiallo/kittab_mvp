-- Jeu de test pour la pagination du catalogue Kittab : 50 annonces.
-- A executer tel quel dans un client SQL connecte a la base.
-- Le bloc NETTOYAGE en bas du fichier retire tout ce qui a ete insere ici.

BEGIN;

-- 1) Vendeur de test (cree une seule fois)
INSERT INTO users (phone, first_name, last_name, username, address,
                   is_profile_complete, is_active, is_admin, created_at)
SELECT '+221000000001', 'Vendeur', 'Test', 'VendeurTest', 'Dakar, Senegal', true, true, false, NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '+221000000001');

-- 2) Les 50 annonces, rattachees a ce vendeur et a une categorie existante
INSERT INTO books (title, author, description, price, condition, book_type, is_pack, language,
                   location_label, is_available, is_sold, accepts_exchange,
                   accepts_whatsapp_contact, views, is_boosted, created_at, updated_at,
                   seller_id, category_id)
SELECT v.*,
       (SELECT id FROM users WHERE phone = '+221000000001'),
       (SELECT id FROM categories ORDER BY id LIMIT 1)
FROM (VALUES
  ('Une si longue lettre #1', 'Camara Laye', '[SEED-TEST] Annonce generee pour tester la pagination.', 5500.0, 'FAIR', 'OTHER', false, 'Français', 'Médina, Dakar, Sénégal', true, false, true, true, 93, true, NOW(), NOW()),
  ('L''Aventure ambiguë #2', 'Mariama Bâ', '[SEED-TEST] Annonce generee pour tester la pagination.', 17000.0, 'LIKE_NEW', 'TEXTBOOK', false, 'Français', 'Médina, Dakar, Sénégal', true, false, false, true, 23, true, NOW(), NOW()),
  ('Les Bouts de bois de Dieu #3', 'Yambo Ouologuem', '[SEED-TEST] Annonce generee pour tester la pagination.', 2500.0, 'NEW', 'NOVEL', false, 'Français', 'Ziguinchor, Sénégal', true, false, false, false, 147, true, NOW(), NOW()),
  ('Le Docker noir #4', 'Yambo Ouologuem', '[SEED-TEST] Annonce generee pour tester la pagination.', 2500.0, 'LIKE_NEW', 'TEXTBOOK', false, 'Français', 'Saint-Louis, Sénégal', true, false, false, true, 36, false, NOW(), NOW()),
  ('Xala #5', 'Cheikh Hamidou Kane', '[SEED-TEST] Annonce generee pour tester la pagination.', 19000.0, 'GOOD', 'HISTORY', false, 'Français', 'Ziguinchor, Sénégal', true, false, true, true, 163, false, NOW(), NOW()),
  ('Sous l''orage #6', 'Seydou Badian', '[SEED-TEST] Annonce generee pour tester la pagination.', 12500.0, 'NEW', 'HISTORY', false, 'Français', 'Ziguinchor, Sénégal', true, false, true, true, 52, false, NOW(), NOW()),
  ('Le Pauvre Christ de Bomba #7', 'Collectif', '[SEED-TEST] Annonce generee pour tester la pagination.', 22500.0, 'FAIR', 'AUTOBIOGRAPHY', false, 'Français', 'Thiès, Sénégal', true, false, false, true, 76, false, NOW(), NOW()),
  ('Ville cruelle #8', 'Seydou Badian', '[SEED-TEST] Annonce generee pour tester la pagination.', 6500.0, 'LIKE_NEW', 'TEXTBOOK', false, 'Français', 'Saint-Louis, Sénégal', true, false, true, true, 87, false, NOW(), NOW()),
  ('L''Enfant noir #9', 'Collectif', '[SEED-TEST] Annonce generee pour tester la pagination.', 10000.0, 'NEW', 'TEXTBOOK', false, 'Français', 'Saint-Louis, Sénégal', true, false, false, false, 38, false, NOW(), NOW()),
  ('Le Devoir de violence #10', 'Collectif', '[SEED-TEST] Annonce generee pour tester la pagination.', 14000.0, 'NEW', 'OTHER', false, 'Français', 'Médina, Dakar, Sénégal', true, false, false, true, 80, false, NOW(), NOW()),
  ('Mathématiques 3e #11', 'Camara Laye', '[SEED-TEST] Annonce generee pour tester la pagination.', 23000.0, 'GOOD', 'HISTORY', false, 'Français', 'Thiès, Sénégal', true, false, false, true, 23, false, NOW(), NOW()),
  ('Physique-Chimie Terminale #12', 'Mongo Beti', '[SEED-TEST] Annonce generee pour tester la pagination.', 16000.0, 'NEW', 'TEXTBOOK', false, 'Français', 'Ziguinchor, Sénégal', true, false, false, false, 174, false, NOW(), NOW()),
  ('SVT Première #13', 'Collectif', '[SEED-TEST] Annonce generee pour tester la pagination.', 10000.0, 'FAIR', 'OTHER', false, 'Français', 'Guédiawaye, Sénégal', true, false, true, true, 43, false, NOW(), NOW()),
  ('Histoire-Géographie 4e #14', 'Cheikh Hamidou Kane', '[SEED-TEST] Annonce generee pour tester la pagination.', 16500.0, 'NEW', 'NOVEL', false, 'Français', 'Guédiawaye, Sénégal', true, false, true, true, 100, false, NOW(), NOW()),
  ('Anglais 6e #15', 'Collectif', '[SEED-TEST] Annonce generee pour tester la pagination.', 3500.0, 'LIKE_NEW', 'SCIENCE', false, 'Français', 'Thiès, Sénégal', true, false, false, false, 110, false, NOW(), NOW()),
  ('Philosophie Terminale #16', 'Mongo Beti', '[SEED-TEST] Annonce generee pour tester la pagination.', 23500.0, 'FAIR', 'AUTOBIOGRAPHY', false, 'Français', 'Ziguinchor, Sénégal', true, false, false, false, 38, false, NOW(), NOW()),
  ('Introduction au droit #17', 'Cheikh Hamidou Kane', '[SEED-TEST] Annonce generee pour tester la pagination.', 6500.0, 'LIKE_NEW', 'NOVEL', false, 'Français', 'Ziguinchor, Sénégal', true, false, true, true, 150, false, NOW(), NOW()),
  ('Précis d''anatomie #18', 'Ousmane Sembène', '[SEED-TEST] Annonce generee pour tester la pagination.', 9000.0, 'GOOD', 'TEXTBOOK', false, 'Français', 'Plateau, Dakar, Sénégal', true, false, false, true, 144, false, NOW(), NOW()),
  ('Algèbre linéaire #19', 'Camara Laye', '[SEED-TEST] Annonce generee pour tester la pagination.', 5000.0, 'NEW', 'SCIENCE', false, 'Français', 'Ziguinchor, Sénégal', true, false, false, true, 102, false, NOW(), NOW()),
  ('Économie générale #20', 'Yambo Ouologuem', '[SEED-TEST] Annonce generee pour tester la pagination.', 4000.0, 'FAIR', 'OTHER', false, 'Français', 'Thiès, Sénégal', true, false, true, true, 53, false, NOW(), NOW()),
  ('Une si longue lettre #21', 'Collectif', '[SEED-TEST] Annonce generee pour tester la pagination.', 6000.0, 'NEW', 'AUTOBIOGRAPHY', false, 'Français', 'Saint-Louis, Sénégal', true, false, true, true, 38, false, NOW(), NOW()),
  ('L''Aventure ambiguë #22', 'Cheikh Hamidou Kane', '[SEED-TEST] Annonce generee pour tester la pagination.', 12500.0, 'NEW', 'TEXTBOOK', false, 'Français', 'Plateau, Dakar, Sénégal', true, false, false, true, 64, false, NOW(), NOW()),
  ('Les Bouts de bois de Dieu #23', 'Camara Laye', '[SEED-TEST] Annonce generee pour tester la pagination.', 20000.0, 'GOOD', 'SCIENCE', false, 'Français', 'Médina, Dakar, Sénégal', true, false, true, true, 119, false, NOW(), NOW()),
  ('Le Docker noir #24', 'Collectif', '[SEED-TEST] Annonce generee pour tester la pagination.', 16000.0, 'GOOD', 'TEXTBOOK', false, 'Français', 'Plateau, Dakar, Sénégal', true, false, true, true, 67, false, NOW(), NOW()),
  ('Xala #25', 'Collectif', '[SEED-TEST] Annonce generee pour tester la pagination.', 23000.0, 'LIKE_NEW', 'HISTORY', false, 'Français', 'Médina, Dakar, Sénégal', true, false, true, false, 92, false, NOW(), NOW()),
  ('Sous l''orage #26', 'Ousmane Sembène', '[SEED-TEST] Annonce generee pour tester la pagination.', 23000.0, 'NEW', 'HISTORY', false, 'Français', 'Guédiawaye, Sénégal', true, false, false, false, 178, false, NOW(), NOW()),
  ('Le Pauvre Christ de Bomba #27', 'Mongo Beti', '[SEED-TEST] Annonce generee pour tester la pagination.', 17500.0, 'GOOD', 'NOVEL', false, 'Français', 'Guédiawaye, Sénégal', true, false, false, true, 199, false, NOW(), NOW()),
  ('Ville cruelle #28', 'Camara Laye', '[SEED-TEST] Annonce generee pour tester la pagination.', 21000.0, 'LIKE_NEW', 'HISTORY', false, 'Français', 'Plateau, Dakar, Sénégal', true, false, false, false, 189, false, NOW(), NOW()),
  ('L''Enfant noir #29', 'Seydou Badian', '[SEED-TEST] Annonce generee pour tester la pagination.', 7000.0, 'FAIR', 'AUTOBIOGRAPHY', false, 'Français', 'Ziguinchor, Sénégal', true, false, true, true, 71, false, NOW(), NOW()),
  ('Le Devoir de violence #30', 'Collectif', '[SEED-TEST] Annonce generee pour tester la pagination.', 9000.0, 'LIKE_NEW', 'OTHER', false, 'Français', 'Saint-Louis, Sénégal', true, false, false, true, 185, false, NOW(), NOW()),
  ('Mathématiques 3e #31', 'Camara Laye', '[SEED-TEST] Annonce generee pour tester la pagination.', 12500.0, 'NEW', 'NOVEL', false, 'Français', 'Médina, Dakar, Sénégal', true, false, true, true, 52, false, NOW(), NOW()),
  ('Physique-Chimie Terminale #32', 'Collectif', '[SEED-TEST] Annonce generee pour tester la pagination.', 20500.0, 'NEW', 'SCIENCE', false, 'Français', 'Ziguinchor, Sénégal', true, false, true, false, 169, false, NOW(), NOW()),
  ('SVT Première #33', 'Cheikh Hamidou Kane', '[SEED-TEST] Annonce generee pour tester la pagination.', 13000.0, 'LIKE_NEW', 'SCIENCE', false, 'Français', 'Plateau, Dakar, Sénégal', true, false, false, false, 22, false, NOW(), NOW()),
  ('Histoire-Géographie 4e #34', 'Yambo Ouologuem', '[SEED-TEST] Annonce generee pour tester la pagination.', 15500.0, 'FAIR', 'OTHER', false, 'Français', 'Médina, Dakar, Sénégal', true, false, false, true, 32, false, NOW(), NOW()),
  ('Anglais 6e #35', 'Mariama Bâ', '[SEED-TEST] Annonce generee pour tester la pagination.', 5500.0, 'FAIR', 'OTHER', false, 'Français', 'Plateau, Dakar, Sénégal', true, false, false, true, 121, false, NOW(), NOW()),
  ('Philosophie Terminale #36', 'Camara Laye', '[SEED-TEST] Annonce generee pour tester la pagination.', 5500.0, 'LIKE_NEW', 'TEXTBOOK', false, 'Français', 'Médina, Dakar, Sénégal', true, false, false, false, 26, false, NOW(), NOW()),
  ('Introduction au droit #37', 'Ousmane Sembène', '[SEED-TEST] Annonce generee pour tester la pagination.', 14500.0, 'LIKE_NEW', 'NOVEL', false, 'Français', 'Médina, Dakar, Sénégal', true, false, true, true, 61, false, NOW(), NOW()),
  ('Précis d''anatomie #38', 'Camara Laye', '[SEED-TEST] Annonce generee pour tester la pagination.', 9000.0, 'FAIR', 'NOVEL', false, 'Français', 'Médina, Dakar, Sénégal', true, false, false, true, 117, false, NOW(), NOW()),
  ('Algèbre linéaire #39', 'Yambo Ouologuem', '[SEED-TEST] Annonce generee pour tester la pagination.', 17000.0, 'LIKE_NEW', 'HISTORY', false, 'Français', 'Plateau, Dakar, Sénégal', true, false, false, true, 112, false, NOW(), NOW()),
  ('Économie générale #40', 'Ousmane Sembène', '[SEED-TEST] Annonce generee pour tester la pagination.', 20000.0, 'NEW', 'NOVEL', false, 'Français', 'Plateau, Dakar, Sénégal', true, false, true, false, 30, false, NOW(), NOW()),
  ('Une si longue lettre #41', 'Mariama Bâ', '[SEED-TEST] Annonce generee pour tester la pagination.', 11000.0, 'FAIR', 'TEXTBOOK', false, 'Français', 'Saint-Louis, Sénégal', true, false, true, true, 10, false, NOW(), NOW()),
  ('L''Aventure ambiguë #42', 'Cheikh Hamidou Kane', '[SEED-TEST] Annonce generee pour tester la pagination.', 17000.0, 'FAIR', 'HISTORY', false, 'Français', 'Médina, Dakar, Sénégal', true, false, false, false, 113, false, NOW(), NOW()),
  ('Les Bouts de bois de Dieu #43', 'Camara Laye', '[SEED-TEST] Annonce generee pour tester la pagination.', 20500.0, 'LIKE_NEW', 'OTHER', false, 'Français', 'Guédiawaye, Sénégal', true, false, false, true, 122, false, NOW(), NOW()),
  ('Le Docker noir #44', 'Seydou Badian', '[SEED-TEST] Annonce generee pour tester la pagination.', 23000.0, 'GOOD', 'HISTORY', false, 'Français', 'Plateau, Dakar, Sénégal', true, false, false, true, 31, false, NOW(), NOW()),
  ('Xala #45', 'Yambo Ouologuem', '[SEED-TEST] Annonce generee pour tester la pagination.', 15000.0, 'GOOD', 'TEXTBOOK', false, 'Français', 'Ziguinchor, Sénégal', true, false, true, true, 171, false, NOW(), NOW()),
  ('Sous l''orage #46', 'Mongo Beti', '[SEED-TEST] Annonce generee pour tester la pagination.', 4500.0, 'LIKE_NEW', 'OTHER', false, 'Français', 'Ziguinchor, Sénégal', true, false, false, true, 35, false, NOW(), NOW()),
  ('Le Pauvre Christ de Bomba #47', 'Collectif', '[SEED-TEST] Annonce generee pour tester la pagination.', 8000.0, 'NEW', 'SCIENCE', false, 'Français', 'Thiès, Sénégal', true, false, true, false, 57, false, NOW(), NOW()),
  ('Ville cruelle #48', 'Ousmane Sembène', '[SEED-TEST] Annonce generee pour tester la pagination.', 23500.0, 'FAIR', 'HISTORY', false, 'Français', 'Thiès, Sénégal', true, false, true, true, 81, false, NOW(), NOW()),
  ('L''Enfant noir #49', 'Cheikh Hamidou Kane', '[SEED-TEST] Annonce generee pour tester la pagination.', 24000.0, 'GOOD', 'TEXTBOOK', false, 'Français', 'Guédiawaye, Sénégal', true, false, false, true, 4, false, NOW(), NOW()),
  ('Le Devoir de violence #50', 'Yambo Ouologuem', '[SEED-TEST] Annonce generee pour tester la pagination.', 11500.0, 'GOOD', 'HISTORY', false, 'Français', 'Médina, Dakar, Sénégal', true, false, true, false, 58, false, NOW(), NOW())
) AS v(title, author, description, price, condition, book_type, is_pack, language,
       location_label, is_available, is_sold, accepts_exchange,
       accepts_whatsapp_contact, views, is_boosted, created_at, updated_at);

COMMIT;

-- Verification : doit renvoyer 50
SELECT count(*) AS annonces_de_test FROM books WHERE description LIKE '%[SEED-TEST]%';


-- =================== NETTOYAGE ===================
-- A executer apres tes tests (retire le commentaire des lignes) :
--
-- BEGIN;
-- DELETE FROM books WHERE description LIKE '%[SEED-TEST]%';
-- DELETE FROM users u WHERE u.phone = '+221000000001'
--   AND NOT EXISTS (SELECT 1 FROM books b WHERE b.seller_id = u.id);
-- COMMIT;

