INSERT INTO "User" (phone_number, name, language_preference) VALUES ('+919999999999', 'Hardware Demo', 'en') RETURNING id;
INSERT INTO "Farm" (user_id, farm_name, location_lat, location_lon, area_unit, created_at) VALUES (lastval(), 'Hardware Test Farm', 26.8467, 80.9462, 'acres', CURRENT_TIMESTAMP) RETURNING id;
