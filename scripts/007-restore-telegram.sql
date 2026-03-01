-- Restore telegram to default empty (user will configure via admin)
UPDATE app_config
SET data = '{"botToken":"","chatId":"","enabled":false,"intervalMinutes":30}'::jsonb
WHERE section = 'telegram';
