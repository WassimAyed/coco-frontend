-- SQL INSERT statements for 6 furniture items — phpMyAdmin
-- Table: furniture (adapt table/column names if different in your schema)

INSERT INTO furniture (title, description, price, category, `condition`, status, quantity, seller_id, image_url, created_at)
VALUES
(
  'Micro-ondes Samsung 800W',
  'Micro-ondes en bon état, utilisé 1 an. Idéal pour chambre étudiante. Capacité 20L, fonction décongélation.',
  45.00, 'KITCHEN', 'GOOD', 'AVAILABLE', 1, 1,
  'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400',
  NOW()
),
(
  'Vélo de ville 26 pouces',
  'Vélo léger avec panier avant, freins en bon état. Parfait pour trajet université-résidence. Quelques rayures.',
  120.00, 'OTHER', 'FAIR', 'AVAILABLE', 1, 1,
  'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400',
  NOW()
),
(
  'Tapis berbère 160x230',
  'Grand tapis style berbère, couleurs chaudes, très bon état. Apporte de la chaleur à votre logement.',
  85.00, 'LIVING_ROOM', 'GOOD', 'AVAILABLE', 1, 1,
  'https://images.unsplash.com/photo-1594994969-ab57f4f0e3c7?w=400',
  NOW()
),
(
  'Bibliothèque 5 étagères',
  'Bibliothèque en bois MDF blanc, 5 étagères réglables. Légèrement à remonter. Dimensions : 80x180x30cm.',
  60.00, 'OFFICE', 'FAIR', 'AVAILABLE', 1, 1,
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  NOW()
),
(
  'Mini-Frigo 50L Candy',
  'Mini réfrigérateur 50L parfait pour chambre. Fonctionne parfaitement, bac à glace inclus. Peu bruyant.',
  95.00, 'KITCHEN', 'GOOD', 'AVAILABLE', 1, 1,
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
  NOW()
),
(
  'Console Gaming PS4 Slim 1To',
  'PS4 Slim 1To avec 2 manettes et 5 jeux inclus. Boîte originale conservée. Vendu car passage PC gaming.',
  280.00, 'OTHER', 'GOOD', 'AVAILABLE', 1, 1,
  'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400',
  NOW()
);
