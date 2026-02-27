-- Seed initial config sections from config.json defaults

INSERT INTO app_config (section, data) VALUES
('pools', '{
  "SOIL": "0x...",
  "MUD": "0x...",
  "CLAY": "0x...",
  "SAND": "0x...",
  "COPPER": "0x...",
  "STEEL": "0x...",
  "SCREW": "0x...",
  "WATER": "0x...",
  "SEAWATER": "0x...",
  "ALGAE": "0x...",
  "OXYGEN": "0x...",
  "GAS": "0x...",
  "FUEL": "0x...",
  "OIL": "0x...",
  "FIRE": "0x...",
  "HEAT": "0x...",
  "LAVA": "0x...",
  "GLASS": "0x...",
  "SULFUR": "0x...",
  "FIBERGLASS": "0x..."
}'::jsonb),
('thresholds', '{"buy": 15, "sell": 15}'::jsonb),
('telegram', '{"botToken": "", "chatId": "", "enabled": false, "intervalMinutes": 30}'::jsonb),
('network', '"ronin"'::jsonb),
('productionCosts', '{}'::jsonb),
('alertsConfig', '{}'::jsonb),
('productionChains', '[]'::jsonb),
('banners', '[]'::jsonb),
('sharing', '{"enabled": false, "watermark": true, "baseUrl": ""}'::jsonb),
('customization', '{"headerText": "", "headerLogo": "", "footerCredits": "", "footerLinks": [], "footerDisclaimer": "", "loginTitle": "", "loginCredits": ""}'::jsonb),
('maintenance', '{"enabled": false, "message": ""}'::jsonb)
ON CONFLICT (section) DO NOTHING;

-- Create default superadmin (password: admin123 - should be changed immediately)
-- Using a simple hash for seed, real auth will use proper hashing
INSERT INTO admin_users (username, password_hash, role, permissions)
VALUES ('superadmin', '__SUPERADMIN__', 'admin', '{}')
ON CONFLICT (username) DO NOTHING;
