-- 课表管理应用 · 数据库 Schema
-- 在 Supabase SQL Editor 中执行此文件

-- 课程表
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  teacher TEXT DEFAULT '',
  classroom TEXT DEFAULT '',
  color TEXT DEFAULT '#D4856B',
  week_type TEXT DEFAULT 'all' CHECK (week_type IN ('all', 'odd', 'even')),
  "order" INTEGER DEFAULT 99,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 课程时间安排表
CREATE TABLE IF NOT EXISTS course_schedules (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_period INTEGER NOT NULL CHECK (start_period BETWEEN 1 AND 11),
  end_period INTEGER NOT NULL CHECK (end_period BETWEEN 1 AND 11),
  location TEXT DEFAULT '',
  week_type TEXT DEFAULT 'all' CHECK (week_type IN ('all', 'odd', 'even'))
);

-- 作业表
CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  schedule_id TEXT REFERENCES course_schedules(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted')),
  reminders JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 课堂备忘表
CREATE TABLE IF NOT EXISTS memos (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  schedule_id TEXT REFERENCES course_schedules(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  mood_emoji TEXT DEFAULT '😊',
  mood_tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 学期配置表
CREATE TABLE IF NOT EXISTS semester_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 站点配置表（密码哈希等）
CREATE TABLE IF NOT EXISTS site_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 用户偏好设置表
CREATE TABLE IF NOT EXISTS user_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 课表覆盖表（临时取消课程/提前下课等）
CREATE TABLE IF NOT EXISTS schedule_overrides (
  id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL REFERENCES course_schedules(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cancelled', 'ended_early')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(schedule_id, date)
);

-- 启用 Row Level Security
-- 注: 本项目为个人应用，使用 anon key 进行完整读写。
-- site_config 表包含敏感数据(密码哈希)，仅允许 SELECT，不允许通过 anon key 写入。
-- 生产环境建议: 启用 JWT 验证或使用 service_role key 访问 site_config。
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE semester_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on courses" ON courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on course_schedules" ON course_schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on assignments" ON assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on memos" ON memos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on semester_config" ON semester_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Restrict site_config" ON site_config FOR SELECT USING (true);
CREATE POLICY "Allow all on user_settings" ON user_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on schedule_overrides" ON schedule_overrides FOR ALL USING (true) WITH CHECK (true);

-- ========== 迁移语句（用于更新已存在的数据库）==========

-- 为 assignments 表添加 reminders 列（如果不存在）
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS reminders JSONB DEFAULT '[]'::jsonb;

-- 为 memos 表添加 updated_at 列（如果不存在）
ALTER TABLE memos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
