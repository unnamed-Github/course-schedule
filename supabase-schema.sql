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
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 课堂备忘表
CREATE TABLE IF NOT EXISTS memos (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mood_emoji TEXT DEFAULT '😊',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 学期配置表
CREATE TABLE IF NOT EXISTS semester_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 启用 Row Level Security（个人应用，允许 anon 读写）
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE semester_config ENABLE ROW LEVEL SECURITY;

-- RLS 策略：允许所有操作（个人应用，非多租户）
CREATE POLICY "Allow all on courses" ON courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on course_schedules" ON course_schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on assignments" ON assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on memos" ON memos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on semester_config" ON semester_config FOR ALL USING (true) WITH CHECK (true);
