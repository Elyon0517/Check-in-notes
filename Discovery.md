Bullet 打卡小程序 Development Discovery
1. 项目目标

开发一个轻量级个人打卡 / 任务消灭 APP。用户可以创建一个个 “bullet”，每天或每周完成后点击消灭。系统需要支持每日、每周自动刷新，提供完成提醒，并在每天接近结束时提醒用户处理未完成事项。

核心体验：
创建 bullet → 每天/每周看到今天要完成的 bullets → 点击完成后 bullet 消失或进入 completed 状态 → 到时间自动提醒。

2. 推荐技术路线
推荐方案：Expo React Native + TypeScript + SQLite / Supabase

这是最适合你需求的路线。

原因：

Expo / React Native 可以用一套 TypeScript 代码同时支持 iOS、Android 和 Web，官方文档也明确强调可以创建 universal Android、iOS、Web app。
如果你先想在电脑上运行，可以先用 Expo Web 或本地开发模式运行；未来要打包成手机 APP 时，不需要推倒重来。

Supabase 可以作为未来云同步和账号系统的后端，因为它提供 Postgres、Auth、Realtime、Storage 等能力，也支持本地开发环境。
通知方面，Firebase Cloud Messaging 是跨平台消息推送方案，支持 iOS、Android、Web。

3. 技术选型
Frontend / App
Framework: Expo + React Native
Language: TypeScript
UI: React Native Paper / NativeWind / Tamagui 任选其一
State Management: Zustand
Local Database: SQLite
Date Handling: date-fns
Notifications: expo-notifications
Navigation: Expo Router
Backend：MVP 阶段可不做

MVP 先使用本地数据库即可。

MVP Backend: None
Local Storage: SQLite
Future Backend: Supabase
Future Cloud Backend
Auth: Supabase Auth
Database: Supabase Postgres
Realtime Sync: Supabase Realtime
Push Notifications: Firebase Cloud Messaging / Expo Push Notifications
4. 为什么不建议一开始做纯桌面 App

可以考虑 Tauri，因为 Tauri v2 支持 Windows、macOS、Linux、Android、iOS，并且可以使用任意前端框架。
但你的目标是未来给手机 APP 使用，React Native / Expo 的移动端生态更成熟。Tauri 更适合“桌面优先，顺便移动端”的产品；你这个项目更像“移动体验优先，电脑也能跑”。

最终建议
方案	适合程度	说明
Expo React Native	高	最适合未来手机 APP，同时电脑可运行 Web 版本
Tauri + React	中	桌面体验好，但移动端生态不如 React Native 成熟
Electron + React	低	桌面强，但手机端不可直接复用
Next.js Web App	中	Web 很方便，但原生手机提醒和本地体验不如 Expo
5. MVP 功能范围
5.1 Bullet 创建

用户可以创建一个 bullet。

每个 bullet 需要支持：

Title: bullet 名称
Description: 可选说明
Type: daily / weekly / one-time
Priority: low / medium / high
Reminder Enabled: true / false
Reminder Time: 例如 21:00
End-of-day Reminder: true / false
Weekly Day: 如果是 weekly，选择周几刷新
Completion state is computed from completion records, not stored as a status field.
示例
Drink water
Daily
Reminder: 9:00 PM
End-of-day reminder: On
5.2 Bullet 列表

首页展示今天需要完成的 bullets。

首页分区：

Today
- Active bullets
- Completed today

This Week
- Weekly bullets

显示逻辑：

每日任务：每天都出现。
每周任务：每周指定日期或每周一刷新。
一次性任务：完成后不再出现。
已完成任务：当天可以显示在 completed section，第二天刷新后重新回到 active，前提是 daily 类型。

5.3 点击消灭 Bullet

用户点击 bullet 后，状态变为 completed。

UI 行为建议：

点击 bullet → bullet 出现动画 → 移入 completed list 或直接从 active list 消失

需要记录 completion log，而不是只改 bullet 状态。

原因：
一个 daily bullet 每天都可以完成一次，所以需要单独记录每天的完成历史。

5.4 每日刷新

每日 00:00 后，daily bullets 自动重新变成 active。

实现方式：

不要依赖后台定时任务。
每次用户打开 APP 时，系统根据当前日期计算今天哪些 bullets 应该显示。

核心逻辑：

If bullet.type === "daily":
  show bullet if no completion record exists for today

If bullet.type === "weekly":
  show bullet if current week has no completion record

If bullet.type === "one-time":
  show bullet if status is not completed
5.5 每周刷新

Weekly bullet 每周刷新一次。

周的定义建议：

Week starts on Monday
Timezone: user's local timezone

需要保存：

week_start_date
completed_at

例如：

bullet: Clean room
type: weekly
week_start_date: 2026-04-27
completed_at: 2026-04-29 18:30
5.6 提醒功能

提醒分两类：

A. Bullet 自定义提醒

用户可以给每个 bullet 设置提醒时间。

例如：

每天 9:00 PM 提醒：还有 bullet 没完成
每周五 6:00 PM 提醒：完成 weekly bullet
B. 每天快结束提醒

全局提醒。

例如：

10:00 PM: You still have 3 bullets left today.

中文版本：

今天还有 3 个 bullet 没有完成，记得消灭它们。
MVP 通知实现

MVP 使用：

expo-notifications

未来正式移动端可以接：

Expo Push Notifications 或 Firebase Cloud Messaging

FCM 支持跨 iOS、Android、Web 发送通知。

6. 数据模型设计
6.1 bullets table
CREATE TABLE bullets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'one_time')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  reminder_enabled INTEGER NOT NULL DEFAULT 0,
  reminder_time TEXT,
  end_of_day_reminder_enabled INTEGER NOT NULL DEFAULT 1,
  weekly_day INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

说明：

weekly_day:
0 = Sunday
1 = Monday
2 = Tuesday
...
6 = Saturday
6.2 bullet_completions table
CREATE TABLE bullet_completions (
  id TEXT PRIMARY KEY,
  bullet_id TEXT NOT NULL,
  completed_date TEXT NOT NULL,
  completed_week_start TEXT,
  completed_at TEXT NOT NULL,
  FOREIGN KEY (bullet_id) REFERENCES bullets(id)
);
completed_date 示例
2026-04-27
completed_week_start 示例
2026-04-27
6.3 settings table
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

推荐 settings：

end_of_day_reminder_time = "22:00"
week_starts_on = "monday"
timezone = "local"
theme = "system"
7. App 页面结构
7.1 Home 页面

路径：

/

功能：

显示今日 active bullets
显示 completed bullets
快速完成 bullet
快速新增 bullet
显示今日完成进度

组件：

TodayProgressCard
BulletList
BulletItem
CompletedBulletList
QuickAddInput
7.2 Add / Edit Bullet 页面

路径：

/bullet/new
/bullet/:id/edit

字段：

Title
Description
Type: daily / weekly / one-time
Priority
Reminder toggle
Reminder time
End-of-day reminder toggle
Weekly day selector
7.3 Weekly 页面

路径：

/week

功能：

显示本周 bullets
显示本周完成率
显示 weekly bullets
7.4 History 页面

路径：

/history

功能：

查看每日完成记录
查看 streak
查看过去 7 天 / 30 天完成率

MVP 可以先做简单版本：

Calendar list
Date
Completed count
Total count
7.5 Settings 页面

路径：

/settings

功能：

设置每日结束提醒时间
设置一周从周几开始
打开/关闭通知
导出数据
清空数据
8. 推荐文件结构
app/
  _layout.tsx
  index.tsx
  bullet/
    new.tsx
    [id].tsx
  week.tsx
  history.tsx
  settings.tsx

src/
  components/
    BulletItem.tsx
    BulletList.tsx
    QuickAddInput.tsx
    TodayProgressCard.tsx
    ReminderSettings.tsx

  db/
    database.ts
    migrations.ts
    bulletRepository.ts
    completionRepository.ts
    settingsRepository.ts

  services/
    bulletService.ts
    completionService.ts
    reminderService.ts
    dateService.ts
    statsService.ts

  store/
    bulletStore.ts
    settingsStore.ts

  types/
    bullet.ts
    completion.ts
    settings.ts

  utils/
    id.ts
    validation.ts
9. 核心业务逻辑
9.1 获取今天 active bullets
function getActiveBulletsForToday(bullets, completions, today) {
  return bullets.filter((bullet) => {
    if (bullet.type === "daily") {
      return !hasCompletionForDate(bullet.id, today);
    }

    if (bullet.type === "weekly") {
      const weekStart = getWeekStart(today);
      return !hasCompletionForWeek(bullet.id, weekStart);
    }

    if (bullet.type === "one_time") {
      return !hasAnyCompletion(bullet.id);
    }

    return false;
  });
}
9.2 完成 bullet
async function completeBullet(bulletId) {
  const bullet = await bulletRepository.getById(bulletId);
  const today = dateService.getTodayDateString();
  const weekStart = dateService.getWeekStartDateString(today);

  await completionRepository.create({
    id: generateId(),
    bullet_id: bulletId,
    completed_date: today,
    completed_week_start: bullet.type === "weekly" ? weekStart : null,
    completed_at: new Date().toISOString(),
  });

  await reminderService.rescheduleReminders();
}
9.3 每日结束提醒逻辑
async function scheduleEndOfDayReminder() {
  const settings = await settingsRepository.getAll();
  const reminderTime = settings.end_of_day_reminder_time || "22:00";

  await notifications.scheduleNotificationAsync({
    content: {
      title: "Daily Bullet Reminder",
      body: "You still have bullets left today. Finish them before the day ends.",
    },
    trigger: {
      hour: 22,
      minute: 0,
      repeats: true,
    },
  });
}

更好的版本：
提醒时动态计算剩余 bullet 数量。

如果本地 notification 不支持触发时动态计算内容，可以在用户打开 APP 后更新下一次通知内容。

10. UI/UX 设计建议
10.1 首页布局
Good evening, Daisy

Today
[ 4 / 6 completed ]

Active Bullets
○ Drink water
○ Practice skating
○ Read 10 pages

Completed
✓ Stretching
✓ Review Chinese class plan

+ Add Bullet
10.2 Bullet 状态
状态	UI
active	空心圆圈 + title
completed	check mark + 灰色文字
10.3 “消灭 bullet” 动效

点击后：

1. checkbox 变成 check
2. bullet 轻微缩小
3. opacity 降低
4. 移动到 completed section

可以用：

react-native-reanimated

MVP 可以先不做复杂动效。

11. Reminder 设计
11.1 MVP Reminder

MVP 只做两个提醒：

Daily end-of-day reminder
Individual bullet reminder
11.2 Notification 权限

首次进入 APP 时不要立刻弹权限。
建议在用户第一次打开 reminder 功能时弹出。

流程：

User turns on reminder
→ Ask notification permission
→ If granted, schedule notification
→ If denied, show instruction
12. Agent 开发任务拆分

可以让 Agent 按以下顺序开发。

Phase 1：项目初始化
Create Expo React Native project with TypeScript.
Set up Expo Router.
Set up SQLite database.
Set up basic navigation: Home, New Bullet, Week, History, Settings.

Acceptance Criteria:

App can run locally.
User can navigate between pages.
Database initializes successfully.
Phase 2：Bullet CRUD
Implement bullet creation.
Implement bullet editing.
Implement local SQLite persistence.

Acceptance Criteria:

User can create a bullet.
Bullet appears on Home screen.
User can edit bullet.
Data remains after app reload.
Phase 3：Completion System
Implement completion records.
Clicking a bullet creates a completion record.
Daily bullets reset automatically based on date.
Weekly bullets reset automatically based on week.
One-time bullets disappear after completion.

Acceptance Criteria:

Daily bullet can be completed once per day.
Weekly bullet can be completed once per week.
One-time bullet stays completed permanently.
Completed records are saved in database.
Phase 4：Reminder System
Request notification permission.
Implement global end-of-day reminder.
Implement per-bullet reminder.
Allow user to configure reminder time.
Reschedule reminders after bullet changes.

Acceptance Criteria:

User can turn on reminder.
App schedules notification.
User can update reminder time.
User can disable reminder.
Phase 5：History and Stats
Create History page.
Show completed bullets by date.
Show today completion ratio.
Show 7-day completion stats.

Acceptance Criteria:

User can view past completions.
User can see today’s completion rate.
User can see basic weekly progress.
Phase 6：Future Cloud Sync Prep

Do not implement full cloud sync in MVP, but structure the code so it is easy to add later.

Create repository layer.
Do not call SQLite directly inside UI components.
Use services and repositories.
Keep data model compatible with Supabase tables.

Acceptance Criteria:

Database logic is isolated in repository files.
UI only calls service/store methods.
Supabase migration can be added later without rewriting UI.
13. Future Supabase Schema

未来如果要支持账号和手机同步，可以用下面的 Supabase 表结构。

users

Supabase Auth 自带，不需要自己建完整 users table。

bullets
CREATE TABLE bullets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'one_time')),
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'active',
  reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_time TEXT,
  end_of_day_reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  weekly_day INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
bullet_completions
CREATE TABLE bullet_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  bullet_id UUID NOT NULL REFERENCES bullets(id),
  completed_date DATE NOT NULL,
  completed_week_start DATE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
14. MVP 不建议做的功能

第一版先不要做这些：

复杂账号系统
多人协作
社交分享
AI 自动生成 bullet
复杂日历视图
复杂 streak 成就系统
云同步冲突处理
桌面端原生打包

原因：这些会拖慢 MVP。
你现在最需要的是先跑通核心使用闭环：

创建 → 显示 → 完成 → 每日/每周刷新 → 提醒
15. 推荐第一版功能清单
Must Have
Create bullet
Edit bullet
Daily bullet
Weekly bullet
One-time bullet
Click to complete
Today list
Completed today list
Daily reset
Weekly reset
End-of-day reminder
Local database persistence
Should Have
Priority
Category / plan type, e.g. study, fitness, work, health, life
Undo completion if the user accidentally completes a bullet
History page
7-day completion stats with day-over-day completion-rate change
Completion heatmap showing daily completion percentage by color
Custom reminder time
Settings page
Could Have
Animation
Modern visual polish: card layout, subtle background pattern, animated progress
Streak
Dark mode
Export data
Cloud sync
Mobile push notification
16. 可直接发给 Agent 的 Prompt

下面这段可以直接复制给 Agent：

Build a local-first "devil" habit/task completion app using Expo React Native with TypeScript. In Chinese UI, "devil" should be rendered as "小恶魔". Do not use the product term "bullet/子弹" in user-facing UI.

Core concept:
The user creates "devils". A devil can be daily, weekly, or one-time. The user clears/completes a devil by tapping it. Completed devils should disappear from the active list or move to a completed section. Daily devils reset every day. Weekly devils reset every week. One-time devils stay completed permanently.

Tech requirements:
- Expo React Native
- TypeScript
- Expo Router
- SQLite for local persistence
- Zustand for state management
- date-fns for date handling
- expo-notifications for reminders
- Repository/service architecture so the app can later migrate to Supabase

Pages:
1. Home
   - Show today's active devils
   - Show completed devils for today
   - Show today's completion progress
   - Quick add devil input
   - Tap devil to complete/clear
   - Allow undoing a completion from the completed section

2. New/Edit Devil
   - Title
   - Description
   - Category: general / study / fitness / work / health / life
   - Type: daily / weekly / one_time
   - Priority: low / medium / high
   - Reminder enabled
   - Reminder time
   - End-of-day reminder enabled
   - Weekly day selector for weekly devils
   - Delete devil with confirmation

3. Week
   - Show weekly devils
   - Show current week progress

4. History
   - Show completed devils by date
   - Show last 7 days completion stats
   - Show day-over-day completion-rate change similar to stock app percentage change
   - Show a heatmap calendar where darker green means higher completion percentage

5. Settings
   - Set end-of-day reminder time
   - Set week start day
   - Enable/disable notifications
   - Switch language between English and Chinese
   - Clear local data

Database tables:
- bullets
- bullet_completions
- settings

Data additions:
- bullets.category stores the user's plan type/category.
- bullet_completions remains append-only for normal completion, but the app may delete the latest completion record for an explicit user undo action.

Business logic:
- Daily devils are active if they do not have a completion record for today.
- Weekly devils are active if they do not have a completion record for the current week.
- One-time devils are active if they have never been completed.
- Do not store daily reset as a status mutation. Compute active state from completion records and date.
- Completion should create a new bullet_completions record.
- Undo completion should remove only the latest completion record for the current active period:
  - Daily: today's completion.
  - Weekly: current week's completion.
  - One-time: latest completion record.
- History completion percentage should be computed from completion records and planned devils for that local date.
- Use local timezone.
- Week starts on Monday by default.

Architecture:
- UI components should not directly access SQLite.
- Use repository layer for database access.
- Use service layer for business logic.
- Use Zustand store for screen state.
- Keep the data model compatible with future Supabase sync.

MVP acceptance criteria:
- App runs locally.
- User can create and edit devils.
- User can delete devils with confirmation.
- User can assign a devil category/plan type.
- User can complete/clear devils.
- User can undo an accidental completion.
- Daily bullets reset the next day.
- Weekly bullets reset the next week.
- Completion history is saved.
- History shows 7-day completion change and a color-coded completion heatmap.
- End-of-day reminder can be configured.
- App defaults to English and supports switching to Chinese.
- Data persists after closing and reopening the app.
17. 建议你第一版就这样做

你的第一版不要追求“像正式商业 APP”。建议先做成：

本地运行
无登录
无云同步
有 SQLite
有提醒
有 daily / weekly / one-time
有 history

等你自己连续用 1–2 周，再加：

Supabase 登录
手机同步
Push notification
Streak
AI bullet suggestion

这样开发风险最低，也最容易让 Agent 一次性生成可用代码。