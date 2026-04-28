-- SQL INSERT statements for furniture items — CoCo Marketplace
-- Run this in your MySQL/MariaDB client to seed the furniture table

SET @available = 'AVAILABLE';
SET @bedroom   = 'BEDROOM';
SET @fair      = 'FAIR';
SET @good      = 'GOOD';
SET @kitchen   = 'KITCHEN';
SET @living    = 'LIVING_ROOM';
SET @office    = 'OFFICE';
SET @other     = 'OTHER';
SET @qty       = 1;
SET @seller    = 1;

INSERT INTO furniture (title, description, price, category, `condition`, status, quantity, seller_id, image_url, created_at)
VALUES
-- KITCHEN items
(
  'Micro-ondes Samsung 800W',
  'Micro-ondes en bon état, utilisé 1 an. Idéal pour chambre étudiante. Capacité 20L, fonction décongélation.',
  45.00, @kitchen, @good, @available, @qty, @seller,
  'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400',
  NOW()
),
(
  'Mini-Frigo 50L Candy',
  'Mini réfrigérateur 50L parfait pour chambre. Fonctionne parfaitement, bac à glace inclus. Peu bruyant.',
  95.00, @kitchen, @good, @available, @qty, @seller,
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
  NOW()
),
(
  'Machine à café Nespresso',
  'Machine à café Nespresso Essenza Mini. Compatible avec capsules Nespresso. Livrée avec 20 capsules.',
  55.00, @kitchen, @good, @available, @qty, @seller,
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
  NOW()
),
(
  'Bouilloire électrique 1.7L',
  'Bouilloire inox 1.7L, arrêt automatique, chauffage rapide. Idéale pour thé, café, pâtes instantanées.',
  18.00, @kitchen, @good, @available, @qty, @seller,
  'https://images.unsplash.com/photo-1594394996697-3e51e5dccbb3?w=400',
  NOW()
),

-- BEDROOM items
(
  'Bureau étudiant 120cm',
  'Bureau blanc 120x60cm avec tiroir et étagère. Parfait pour chambre ou studio. Monté, prêt à utiliser.',
  75.00, @bedroom, @good, @available, @qty, @seller,
  'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400',
  NOW()
),
(
  'Lampe de bureau LED flexible',
  'Lampe LED avec col flexible, 3 températures de couleur, intensité réglable. USB ou prise murale.',
  22.00, @bedroom, 'NEW', @available, @qty, @seller,
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  NOW()
),
(
  'Chaise de bureau ergonomique',
  'Chaise bureau réglable en hauteur, accoudoirs rembourrés, dossier lombaire. Très bon état.',
  65.00, @bedroom, @good, @available, @qty, @seller,
  'https://images.unsplash.com/photo-1589384267710-7a170981ca78?w=400',
  NOW()
),
(
  'Étagère murale 3 niveaux',
  'Étagère flottante en bois MDF blanc, 3 niveaux, 80cm de large. Fixations incluses.',
  35.00, @bedroom, @good, @available, @qty, @seller,
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400',
  NOW()
),

-- LIVING_ROOM items
(
  'Tapis berbère 160x230',
  'Grand tapis style berbère, couleurs chaudes, très bon état. Apporte de la chaleur à votre logement.',
  85.00, @living, @good, @available, @qty, @seller,
  'https://images.unsplash.com/photo-1594994969-ab57f4f0e3c7?w=400',
  NOW()
),
(
  'Canapé 2 places tissu gris',
  'Canapé 2 places gris anthracite, tissu lavable, pieds bois. Très confortable. Quelques années d''usage.',
  180.00, @living, @fair, @available, @qty, @seller,
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
  NOW()
),
(
  'Table basse scandinave',
  'Table basse pieds fins bois naturel, plateau mélaminé blanc. 90x50cm. Style nordique.',
  55.00, @living, @good, @available, @qty, @seller,
  'https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=400',
  NOW()
),

-- OFFICE items
(
  'Bibliothèque 5 étagères',
  'Bibliothèque en bois MDF blanc, 5 étagères réglables. Légèrement à remonter. Dimensions : 80x180x30cm.',
  60.00, @office, @fair, @available, @qty, @seller,
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  NOW()
),
(
  'Imprimante HP LaserJet',
  'Imprimante laser HP noire et blanc, impression rapide 20ppm. Wi-Fi intégrée. Cartouche mi-pleine.',
  85.00, @office, @good, @available, @qty, @seller,
  'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400',
  NOW()
),
(
  'Moniteur 24" Full HD',
  'Écran PC 24 pouces Full HD, dalle IPS, HDMI+VGA. Idéal double écran ou bureau. Très bon état.',
  120.00, @office, @good, @available, @qty, @seller,
  'https://images.unsplash.com/photo-1527443224154-c4a573d5f5f4?w=400',
  NOW()
),
(
  'Clavier + Souris sans fil',
  'Combo clavier AZERTY + souris Logitech MK270. Connexion USB nano-récepteur. Piles incluses.',
  25.00, @office, @good, @available, @qty, @seller,
  'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400',
  NOW()
),

-- OTHER items
(
  'Vélo de ville 26 pouces',
  'Vélo léger avec panier avant, freins en bon état. Parfait pour trajet université-résidence. Quelques rayures.',
  120.00, @other, @fair, @available, @qty, @seller,
  'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400',
  NOW()
),
(
  'Console Gaming PS4 Slim 1To',
  'PS4 Slim 1To avec 2 manettes et 5 jeux inclus. Boîte originale conservée. Vendu car passage PC gaming.',
  280.00, @other, @good, @available, @qty, @seller,
  'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400',
  NOW()
),
(
  'Nintendo Switch + Joy-Con',
  'Nintendo Switch avec dock, 2 Joy-Con (rouge/bleu) et câbles d''origine. 1 jeu offert (Mario Kart).',
  220.00, @other, @good, @available, @qty, @seller,
  'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400',
  NOW()
),
(
  'Trottinette électrique Xiaomi',
  'Trottinette électrique Xiaomi M365, 25km/h, autonomie ~30km. Chargeur inclus. Pneus neufs.',
  190.00, @other, @good, @available, @qty, @seller,
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
  NOW()
),
(
  'Casque audio Sony WH-1000XM4',
  'Casque Sony WH-1000XM4 réduction de bruit active. Autonomie 30h. Pochette et câble inclus.',
  150.00, @other, @good, @available, @qty, @seller,
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
  NOW()
),
(
  'Sac à dos étudiant 30L',
  'Sac à dos Eastpak 30L, compartiment laptop 15.6'', nombreuses poches. Couleur noire. Très bon état.',
  28.00, @other, @good, @available, @qty, @seller,
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
  NOW()
);
