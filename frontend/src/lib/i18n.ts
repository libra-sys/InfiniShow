/**
 * 前端国际化 — 轻量实现（不依赖 react-i18next）
 * 支持简体中文（默认）和英文
 */

export type Lang = 'zh-CN' | 'en'

const translations: Record<Lang, Record<string, string>> = {
  'zh-CN': {
    'app.name': '可信经营洞察引擎',
    'app.tagline': '全链路可溯源智能经营分析工具',
    'nav.home': '首页',
    'nav.upload': '数据接入',
    'nav.history': '历史',
    'nav.policy': '政策',
    'nav.settings': '设置',
    'auth.login': '登录',
    'auth.register': '注册',
    'auth.logout': '退出登录',
    'task.create': '创建分析任务',
    'task.progress': '分析进度',
    'task.complete': '分析完成',
    'task.failed': '分析失败',
    'report.title': '分析报告',
    'report.export': '导出报告',
    'report.share': '分享报告',
    'report.trace': '查看溯源',
    'report.ask': '发起追问',
    'share.generate': '生成分享链接',
    'share.poster': '生成海报',
    'policy.search': '搜索政策',
    'policy.feedback': '反馈',
    'credits.balance': '剩余额度',
    'credits.checkin': '每日签到',
    'common.loading': '加载中...',
    'common.error': '出错了',
    'common.confirm': '确认',
    'common.cancel': '取消',
    'common.save': '保存',
    'common.delete': '删除',
  },
  en: {
    'app.name': 'InfiniShow',
    'app.tagline': 'Trusted Business Insight Engine',
    'nav.home': 'Home',
    'nav.upload': 'Upload',
    'nav.history': 'History',
    'nav.policy': 'Policy',
    'nav.settings': 'Settings',
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.logout': 'Logout',
    'task.create': 'Create Task',
    'task.progress': 'Progress',
    'task.complete': 'Completed',
    'task.failed': 'Failed',
    'report.title': 'Report',
    'report.export': 'Export',
    'report.share': 'Share',
    'report.trace': 'Trace',
    'report.ask': 'Ask',
    'share.generate': 'Share',
    'share.poster': 'Poster',
    'policy.search': 'Search',
    'policy.feedback': 'Feedback',
    'credits.balance': 'Credits',
    'credits.checkin': 'Check In',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.confirm': 'Confirm',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
  },
}

let currentLang: Lang = 'zh-CN'

export function setLang(lang: Lang): void {
  currentLang = lang
  localStorage.setItem('preferred_language', lang)
  document.documentElement.lang = lang
}

export function getLang(): Lang {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('preferred_language') as Lang | null
    if (stored && (stored === 'zh-CN' || stored === 'en')) {
      currentLang = stored
    }
  }
  return currentLang
}

export function t(key: string): string {
  const lang = getLang()
  return translations[lang]?.[key] ?? translations['zh-CN']?.[key] ?? key
}
