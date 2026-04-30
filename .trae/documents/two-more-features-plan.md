# 两个新修改计划

## 修改1：单节课进度到 100% 金色撒花动画

### 现状分析
- WarmthBanner 中已有当前课程的实时进度条（每60秒更新）
- DayView 中也有当前课程的进度条
- 已有 `CourseCompletionCelebration` 组件处理**整门课完结**的彩色 confetti
- 但**单节课上完**（进度到100%）时没有任何反馈

### 实现方案

**新建 `ClassFinishCelebration.tsx` 组件**，与 `CourseCompletionCelebration` 分开，专门处理单节课结束：

1. **检测逻辑**：在 WarmthBanner 中，当 `currentCourseInfo.progress` 从 <100% 变为 >=100%（即当前课程刚上完）时触发
2. **金色撒花动画**：复用已有的 Canvas confetti 模式，但颜色改为金色系（`#FFD700`、`#FFA500`、`#FFEC8B`、`#DAA520`、`#F5DEB3`），粒子形状增加圆形和星形
3. **提示文案**：轻量提示 "✨ [课程名] 下课啦！" 从顶部滑入，2秒后自动消失
4. **去重**：每节课每天只庆祝一次，localStorage 记录 `class_finished_celebrated_{date}_{scheduleId}`

### 具体步骤

1. 新建 `src/components/ClassFinishCelebration.tsx`
   - 导出 `ClassFinishCelebration` 组件和 `useClassFinish` hook
   - `useClassFinish` 接收当前课程进度信息，检测 progress >= 100% 时返回 `{ shouldCelebrate: true, courseName: string }`
   - `ClassFinishCelebration` 渲染金色 confetti Canvas + 顶部滑入提示

2. 修改 `src/components/WarmthBanner.tsx`
   - 引入 `ClassFinishCelebration` 和 `useClassFinish`
   - 将 `currentCourseInfo` 传入 `useClassFinish` 检测
   - 在 WarmthBanner 组件内渲染 `ClassFinishCelebration`

### 金色 Confetti 参数
- 粒子数：40（比课程完结少，更轻量）
- 颜色池：`['#FFD700', '#FFA500', '#FFEC8B', '#DAA520', '#F5DEB3', '#E8B923']`
- 粒子形状：矩形 + 圆形混合（增加圆形粒子）
- 发射位置：屏幕中上方
- 持续时间：约2秒

---

## 修改2：每日哲理金句

### 现状分析
- WarmthBanner 已有问候语和鼓励语
- `ENCOURAGEMENTS` 数组只有5条，偏鸡汤风格
- 需要替换为真正有哲理的话，每天固定一句（不是随机的，同一天看到同一句）

### 实现方案

**新建 `src/lib/daily-quote.ts`** 存放金句池和每日选取逻辑：

1. **金句池**：30+ 条真正有道理的话，来源包括：
   - 古典：论语、道德经、庄子
   - 近现代：鲁迅、胡适、钱钟书
   - 西方：加缪、罗曼·罗兰、叔本华、海明威
   - 标准：有洞察力、经得起推敲、不是空洞的正能量

2. **每日选取**：基于日期的确定性选择（同一天同一句），使用 `日期种子 % 池长度`，确保每天固定

3. **展示位置**：在 WarmthBanner 的问候横幅中，作为第二行小字显示

### 金句池（精选30条，拒绝毒鸡汤）

```
1. "学而不思则罔，思而不学则殆。" — 孔子
2. "知人者智，自知者明。" — 老子
3. "吾生也有涯，而知也无涯。" — 庄子
4. "未经审视的人生不值得过。" — 苏格拉底
5. "真正的发现之旅不在于寻找新风景，而在于拥有新眼光。" — 普鲁斯特
6. "世界上只有一种英雄主义，就是认清生活的真相后依然热爱它。" — 罗曼·罗兰
7. "人的一切痛苦，本质上都是对自己无能的愤怒。" — 王小波
8. "自由不是让你想做什么就做什么，自由是教你不想做什么就可以不做什么。" — 康德
9. "我们听到的一切都是一个观点，不是事实；我们看到的一切都是一个视角，不是真相。" — 马可·奥勒留
10. "把每一天当作最后一天来过，终有一天你会如愿以偿。" — 霍勒斯
11. "人最大的悲哀在于不可逆转地走向死亡，最大的幸运也在于此。" — 加缪
12. "当你凝视深渊时，深渊也在凝视你。" — 尼采
13. "常识就是人到十八岁为止累积的所有偏见。" — 爱因斯坦
14. "一个人知道自己为什么而活，就可以忍受任何一种生活。" — 尼采
15. "不要因为走得太远，而忘了为什么出发。" — 纪伯伦
16. "教育的目的不是填满桶，而是点燃火。" — 叶芝
17. "人生没有白走的路，每一步都算数。" — 李宗盛
18. "你不能控制风向，但你可以调整风帆。" — 吉米·迪恩
19. "最困难的事情就是认识自己。" — 泰勒斯
20. "凡是过往，皆为序章。" — 莎士比亚
21. "知不足者好学，耻下问者自满。" — 林逋
22. "人不能两次踏进同一条河流。" — 赫拉克利特
23. "我思故我在。" — 笛卡尔
24. "生活总是让我们遍体鳞伤，但到后来，那些受伤的地方会变成我们最强壮的地方。" — 海明威
25. "真理永远在少数人一边。" — 布莱克
26. "人类的悲欢并不相通，我只觉得他们吵闹。" — 鲁迅
27. "知识就是力量。" — 培根
28. "千里之行，始于足下。" — 老子
29. "不积跬步，无以至千里。" — 荀子
30. "人法地，地法天，天法道，道法自然。" — 老子
```

### 具体步骤

1. 新建 `src/lib/daily-quote.ts`
   - 定义 `quotes` 数组（30条，每条含 `text` 和 `author`）
   - 导出 `getDailyQuote(date: Date)` 函数，基于日期确定性返回当天金句

2. 修改 `src/components/WarmthBanner.tsx`
   - 引入 `getDailyQuote`
   - 在问候横幅中，消息下方增加一行小字显示当日金句
   - 样式：斜体、小字号、低透明度，不抢主消息风头

---

## 实现顺序

1. 新建 `src/lib/daily-quote.ts`（金句数据 + 选取逻辑）
2. 修改 `src/components/WarmthBanner.tsx`（集成每日金句）
3. 新建 `src/components/ClassFinishCelebration.tsx`（金色撒花组件）
4. 修改 `src/components/WarmthBanner.tsx`（集成下课庆祝）
5. 构建验证
