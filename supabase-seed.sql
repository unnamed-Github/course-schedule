-- 学期配置种子数据
INSERT INTO semester_config (key, value) VALUES
  ('semester_start', '2026-02-25'),
  ('teaching_weeks', '15'),
  ('exam_weeks', '2'),
  ('holidays', '[{"name":"清明节","start":"2026-04-05","end":"2026-04-05"},{"name":"劳动节","start":"2026-05-01","end":"2026-05-05"},{"name":"端午节","start":"2026-06-19","end":"2026-06-19"}]'),
  ('makeup_days', '[{"date":"2026-02-28","replacesDayOfWeek":1,"weekType":"all"},{"date":"2026-05-09","replacesDayOfWeek":2,"weekType":"odd"}]')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
