-- Update profiles with our desired data
UPDATE profiles
SET 
  bio = CASE id
    WHEN '00000000-0000-0000-0000-000000000001' THEN 'Cannabis enthusiast and reviewer. I love trying new strains and sharing my experiences.'
    WHEN '00000000-0000-0000-0000-000000000002' THEN 'Medical cannabis patient focused on strains for pain relief and sleep.'
    WHEN '00000000-0000-0000-0000-000000000003' THEN 'Recreational user who enjoys exploring different flavors and effects.'
    WHEN '00000000-0000-0000-0000-000000000004' THEN 'Cannabis connoisseur with a preference for sativa strains.'
    WHEN '00000000-0000-0000-0000-000000000005' THEN 'New to cannabis and documenting my journey trying different strains.'
  END,
  avatar_url = CASE id
    WHEN '00000000-0000-0000-0000-000000000001' THEN 'https://ui-avatars.com/api/?name=Jane+Doe&background=random'
    WHEN '00000000-0000-0000-0000-000000000002' THEN 'https://ui-avatars.com/api/?name=John+Smith&background=random'
    WHEN '00000000-0000-0000-0000-000000000003' THEN 'https://ui-avatars.com/api/?name=Alex+Green&background=random'
    WHEN '00000000-0000-0000-0000-000000000004' THEN 'https://ui-avatars.com/api/?name=Sam+Wilson&background=random'
    WHEN '00000000-0000-0000-0000-000000000005' THEN 'https://ui-avatars.com/api/?name=Taylor+Lee&background=random'
  END
WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005'
); 