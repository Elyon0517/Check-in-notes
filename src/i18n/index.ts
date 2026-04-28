import { useSettingsStore } from '@/src/stores/settingsStore';
import type { AppLanguage, BulletCategory, BulletType, Priority } from '@/src/types/models';

const dictionary = {
  en: {
    today: 'Today',
    week: 'Week',
    history: 'History',
    settings: 'Settings',
    newDevil: 'New Devil',
    editDevil: 'Edit Devil',
    save: 'Save',
    deleteDevil: 'Delete Devil',
    deleteTitle: 'Delete devil?',
    deleteMessage: 'This permanently deletes this devil and its completion history. This cannot be undone.',
    deleteAction: 'Delete',
    confirmDelete: 'Confirm Delete',
    title: 'Title',
    titleRequired: 'Title *',
    titlePlaceholder: 'Name this devil',
    description: 'Description',
    optional: 'Optional',
    type: 'Type',
    category: 'Category',
    targetDay: 'Target day',
    priority: 'Priority',
    reminder: 'Reminder',
    reminderSub: 'Send a notification at a specific time',
    reminderTime: 'Reminder time (HH:mm)',
    eodReminder: 'End-of-day reminder',
    eodReminderSub: 'Use the end time configured in Settings',
    quickAdd: 'Quick add a daily devil...',
    add: 'Add',
    adding: '...',
    todayProgress: 'Today Progress',
    active: 'Active',
    doneToday: 'Completed Today',
    allDone: 'All devils cleared today',
    addHint: 'Tap + in the top right to create a devil',
    undo: 'Undo',
    weekProgress: 'Week Progress',
    weekStart: 'Starts',
    noWeekly: 'No weekly devils yet',
    noWeeklySub: 'Create one from Today with type Weekly',
    weeklyDevils: 'Weekly Devils',
    completionRate: 'Completion Rate',
    todayCount: 'Today',
    plannedHint: 'Based on planned devils for this date',
    recent7Change: '7-Day Change',
    heatmap: 'Check-in Heatmap',
    low: 'Low',
    high: 'High',
    recordsByDay: 'Records by Day',
    noHistory: 'No completion records yet',
    notifications: 'Notifications',
    language: 'Language',
    languageSub: 'Tap the header button or this control to switch',
    switchToChinese: 'Switch to Chinese',
    switchToEnglish: 'Switch to English',
    endTime: 'End Time',
    endTimeSub: 'Daily wrap-up reminder time',
    enableLocalNotifications: 'Enable Local Notifications',
    enableLocalNotificationsSub: 'Disable to stop all notifications',
    calendar: 'Calendar',
    weekStartQuestion: 'Week starts on',
    data: 'Data',
    clearAllData: 'Clear All Local Data',
    clearTitle: 'Clear local data',
    clearMessage: 'This deletes all devils and completion records. This cannot be undone.',
    cancel: 'Cancel',
    clear: 'Clear',
    invalidTitle: 'Cannot Save',
    missingTitle: 'Please enter a title',
    invalidTimeFormat: 'Use HH:mm, for example 09:00',
    invalidTime: 'Invalid reminder time',
    notFoundTitle: 'Not Found',
    notFoundMessage: 'This devil no longer exists',
  },
  zh: {
    today: '今日',
    week: '本周',
    history: '历史',
    settings: '设置',
    newDevil: '新建小恶魔',
    editDevil: '编辑小恶魔',
    save: '保存',
    deleteDevil: '删除小恶魔',
    deleteTitle: '删除小恶魔？',
    deleteMessage: '这会永久删除这个小恶魔及其完成历史，无法恢复。',
    deleteAction: '删除',
    confirmDelete: '确认删除',
    title: '标题',
    titleRequired: '标题 *',
    titlePlaceholder: '给这个小恶魔起个名字',
    description: '描述',
    optional: '可选',
    type: '类型',
    category: '分类',
    targetDay: '目标完成日（周几）',
    priority: '优先级',
    reminder: '定时提醒',
    reminderSub: '在指定时间发送通知',
    reminderTime: '提醒时间（HH:mm）',
    eodReminder: '今日结束提醒',
    eodReminderSub: '使用「设置」里的结束时间',
    quickAdd: '快速添加每日小恶魔…',
    add: '添加',
    adding: '…',
    todayProgress: '今日进度',
    active: '待处理',
    doneToday: '今日已完成',
    allDone: '今天的小恶魔已全部清除',
    addHint: '点右上角 + 可新建小恶魔',
    undo: '撤回',
    weekProgress: '本周进度',
    weekStart: '起始日',
    noWeekly: '还没有每周小恶魔',
    noWeeklySub: '在「今日」页右上角 + 新建，类型选「每周」',
    weeklyDevils: '本周小恶魔',
    completionRate: '完成率',
    todayCount: '今日',
    plannedHint: '按当天计划量计算',
    recent7Change: '最近 7 天涨幅',
    heatmap: '打卡热力图',
    low: '低',
    high: '高',
    recordsByDay: '按日记录',
    noHistory: '暂无完成记录',
    notifications: '通知',
    language: '语言',
    languageSub: '点击顶部按钮或这里切换语言',
    switchToChinese: '切换到中文',
    switchToEnglish: '切换到英文',
    endTime: '今日结束时间',
    endTimeSub: '每日结束提醒将在此时发送',
    enableLocalNotifications: '启用本地提醒',
    enableLocalNotificationsSub: '关闭后不发送任何通知',
    calendar: '日历',
    weekStartQuestion: '一周从哪天开始',
    data: '数据',
    clearAllData: '清除全部本地数据',
    clearTitle: '清除本地数据',
    clearMessage: '将删除所有小恶魔与完成记录，且无法恢复。确定？',
    cancel: '取消',
    clear: '清除',
    invalidTitle: '无法保存',
    missingTitle: '请填写标题',
    invalidTimeFormat: '提醒时间格式应为 HH:mm（例如 09:00）',
    invalidTime: '提醒时间无效',
    notFoundTitle: '未找到',
    notFoundMessage: '这个小恶魔不存在',
  },
} as const;

export type TranslationKey = keyof typeof dictionary.en;

export function translate(language: AppLanguage, key: TranslationKey): string {
  return dictionary[language][key] ?? dictionary.en[key];
}

export function useI18n() {
  const language = useSettingsStore((s) => s.settings?.language ?? 'en');
  return {
    language,
    t: (key: TranslationKey) => translate(language, key),
  };
}

export function typeLabel(type: BulletType, language: AppLanguage) {
  const en: Record<BulletType, string> = { daily: 'Daily', weekly: 'Weekly', one_time: 'One-time' };
  const zh: Record<BulletType, string> = { daily: '每日', weekly: '每周', one_time: '一次性' };
  return (language === 'zh' ? zh : en)[type];
}

export function priorityLabel(priority: Priority, language: AppLanguage) {
  const en: Record<Priority, string> = { low: 'Low', medium: 'Medium', high: 'High' };
  const zh: Record<Priority, string> = { low: '低', medium: '中', high: '高' };
  return (language === 'zh' ? zh : en)[priority];
}

export function categoryLabel(category: BulletCategory, language: AppLanguage) {
  const en: Record<BulletCategory, string> = {
    general: 'General',
    study: 'Study',
    fitness: 'Fitness',
    work: 'Work',
    health: 'Health',
    life: 'Life',
  };
  const zh: Record<BulletCategory, string> = {
    general: '通用',
    study: '学习',
    fitness: '健身',
    work: '工作',
    health: '健康',
    life: '生活',
  };
  return (language === 'zh' ? zh : en)[category];
}

export function weekdayLabel(index: number, language: AppLanguage) {
  const en = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const zh = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return (language === 'zh' ? zh : en)[index] ?? String(index);
}
