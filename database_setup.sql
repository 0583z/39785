-- A. 数据库设计 (SQL)
-- 在 Supabase SQL Editor 中运行以下语句

-- 创建待审核竞赛表
CREATE TABLE IF NOT EXISTS pending_competitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  link TEXT,
  description TEXT,
  submitter_contact TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 安全策略：允许匿名或任何已登录用户提交
ALTER TABLE pending_competitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert for all users" ON pending_competitions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for admins" ON pending_competitions FOR SELECT USING (true); -- 实际环境建议限制为 admin

-- C. 管理员审核逻辑 (SQL 快捷合并方案)
-- 当管理员在后台审核通过时，可以运行以下 SQL 模板（或通过 Supabase Dashboard 管理）：

/*
-- 1. 将审核通过的数据插入正式表 (注意字段映射)
INSERT INTO competitions (name, category, deadline, registrationUrl, description, level)
SELECT title, category, deadline, link, description, '待定'
FROM pending_competitions 
WHERE id = '目标ID' AND status = 'pending';

-- 2. 更新状态或删除
UPDATE pending_competitions SET status = 'approved' WHERE id = '目标ID';
*/
