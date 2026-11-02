window.__ModuleLoader__.load({
  id: '@local/usage-stats',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const useSyncExternalStore = React.useSyncExternalStore || function (subscribe, get) {
      const [value, setValue] = React.useState(get);
      React.useEffect(function () {
        return subscribe(function () { setValue(get()); });
      }, [subscribe, get]);
      return value;
    };

    const NS = 'usageStats';
    const ENDPOINT = 'api/local-usage-stats';
    const SETTINGS_KEY = 'usage-stats:settings:v1';
    const DEFAULT_RATES = { input: 0.28, cacheRead: 0.028, cacheWrite: 0.28, output: 0.42 };
    const DEFAULT_BUDGET = 20;
    const HOUR = 60 * 60 * 1000;

    const DICT_EN = {
      navLabel: 'Usage & stats',
      eyebrow: 'Harness · Statistics',
      title: 'Usage, cost, and performance',
      subtitle: 'Token counts read from every conversation in this profile, with an estimated cost model and live machine activity.',
      refresh: 'Refresh',
      refreshing: 'Refreshing',
      updated: 'Updated {time}',
      live: 'Live',
      loading: 'Reading session logs…',
      loadError: 'Statistics could not be loaded.',
      loadErrorBody: '{message}',
      retry: 'Try again',
      totalTokens: 'Total tokens',
      totalTokensSub: 'Across {n} conversations',
      estimatedCost: 'Estimated cost',
      estimatedCostSub: 'Month to date: {amount}',
      conversations: 'Conversations',
      conversationsSub: '{live} live · {stored} stored',
      budget: 'Monthly budget',
      budgetSub: '{used} of {budget} used',
      budgetRemaining: '{amount} remaining',
      budgetOver: '{amount} over budget',
      setBudget: 'Set a budget',
      monthToDate: 'Month to date',
      allTime: 'All time',
      tokenTimeline: 'Token timeline',
      timelineSub: 'Stacked token volume by {unit}.',
      hourly: 'Hourly',
      daily: 'Daily',
      windowTotal: '{tokens} tokens in this window',
      cacheRead: 'Cache read',
      input: 'Input',
      output: 'Output',
      cacheWrite: 'Cache write',
      total: 'Total',
      time: 'Time',
      noTimeline: 'No token activity in this window yet.',
      noTimelineBody: 'Start a conversation and the timeline will fill in as messages complete.',
      cpuTitle: 'CPU activity',
      cpuSub: 'System load and this Harness process, sampled every two seconds.',
      systemCpu: 'System',
      harnessCpu: 'Harness process',
      loadAverage: 'Load average',
      memory: 'Memory',
      cores: '{n} cores',
      cpuUnavailable: 'CPU sampling is warming up.',
      cpuUnavailableBody: 'The first sample appears within two seconds.',
      perCore: 'Per-core utilization',
      sampledAt: 'Sampled {time}',
      conversationTitle: 'Conversations',
      conversationSub: '{n} with token usage',
      sortCost: 'Highest cost',
      sortTokens: 'Most tokens',
      sortRecent: 'Most recent',
      tokens: 'Tokens',
      cost: 'Cost',
      share: 'Share',
      turns: 'turns',
      lastActive: 'Last active',
      untitled: 'Untitled conversation',
      details: 'Details',
      sessionId: 'Session ID',
      requests: 'Requests',
      created: 'Started',
      model: 'Model',
      contextWindow: 'Context window',
      tokenBreakdown: 'Token breakdown',
      costBreakdown: 'Estimated cost breakdown',
      ofTotal: 'of total spend',
      settings: 'Cost model & budget',
      settingsBody: 'Costs are estimates calculated from reported tokens and the rates below. They are not billing statements.',
      budgetLabel: 'Monthly budget (USD)',
      rateInput: 'Uncached input · $/1M',
      rateCache: 'Cache read · $/1M',
      rateCacheWrite: 'Cache write · $/1M',
      rateOutput: 'Output · $/1M',
      ratesNote: 'DeepSeek Flash defaults are assumptions for this dashboard. Adjust them to match your contract.',
      resetRates: 'Reset defaults',
      dataSource: 'Data source',
      dataSourceBody: 'Session logs are read on the Host through the Session Query service. The browser only receives aggregate numbers from an authenticated local route.',
      stored: 'Stored sessions',
      liveSessions: 'Live sessions',
      unreadable: 'Unreadable logs',
      footerNote: 'CPU figures describe this machine and the Harness process. Token figures are provider-reported usage.',
      justNow: 'just now',
      minutesAgo: '{n}m ago',
      hoursAgo: '{n}h ago',
      daysAgo: '{n}d ago',
      perMillion: 'per 1M tokens',
      settingsSaved: 'Saved on this device',
      noConversations: 'No conversations with token usage',
      noConversationsBody: 'Complete a model response and this page will show its tokens and estimated cost.',
      cacheHit: 'Cache hit',
      cacheHitSub: '{pct} of prompt tokens',
      averageTurn: 'Avg. per request',
      requestCount: '{n} requests',
      sourceBreakdown: 'Source'
    };

    const DICT_AR = {
      navLabel: 'الاستخدام والإحصاءات',
      eyebrow: 'Harness · الإحصاءات',
      title: 'الاستخدام والتكلفة والأداء',
      subtitle: 'أعداد الرموز مقروءة من كل محادثة في هذا الملف الشخصي، مع تقدير للتكلفة ونشاط حي للجهاز.',
      refresh: 'تحديث',
      refreshing: 'جارٍ التحديث',
      updated: 'حُدّث {time}',
      live: 'مباشر',
      loading: 'جارٍ قراءة سجلات الجلسات…',
      loadError: 'تعذّر تحميل الإحصاءات.',
      loadErrorBody: '{message}',
      retry: 'إعادة المحاولة',
      totalTokens: 'إجمالي الرموز',
      totalTokensSub: 'عبر {n} محادثة',
      estimatedCost: 'التكلفة التقديرية',
      estimatedCostSub: 'من بداية الشهر: {amount}',
      conversations: 'المحادثات',
      conversationsSub: '{live} مباشرة · {stored} محفوظة',
      budget: 'الميزانية الشهرية',
      budgetSub: 'استُخدم {used} من {budget}',
      budgetRemaining: 'متبقٍ {amount}',
      budgetOver: 'تجاوز بمقدار {amount}',
      setBudget: 'حدّد ميزانية',
      monthToDate: 'من بداية الشهر',
      allTime: 'الإجمالي',
      tokenTimeline: 'الخط الزمني للرموز',
      timelineSub: 'حجم الرموز المتراكم حسب {unit}.',
      hourly: 'بالساعة',
      daily: 'باليوم',
      windowTotal: '{tokens} رمزًا في هذه النافذة',
      cacheRead: 'قراءة من الذاكرة',
      input: 'الإدخال',
      output: 'الإخراج',
      cacheWrite: 'كتابة إلى الذاكرة',
      total: 'الإجمالي',
      time: 'الوقت',
      noTimeline: 'لا يوجد نشاط رموز في هذه النافذة بعد.',
      noTimelineBody: 'ابدأ محادثة وسيمتلئ الخط الزمني عند اكتمال الرسائل.',
      cpuTitle: 'نشاط المعالج',
      cpuSub: 'حمل النظام وهذه العملية، بعيّنة كل ثانيتين.',
      systemCpu: 'النظام',
      harnessCpu: 'عملية Harness',
      loadAverage: 'متوسط الحمل',
      memory: 'الذاكرة',
      cores: '{n} أنوية',
      cpuUnavailable: 'جارٍ تجهيز عيّنة المعالج.',
      cpuUnavailableBody: 'تظهر أول عيّنة خلال ثانيتين.',
      perCore: 'استخدام كل نواة',
      sampledAt: 'العيّنة {time}',
      conversationTitle: 'المحادثات',
      conversationSub: '{n} لديها استخدام رموز',
      sortCost: 'الأعلى تكلفة',
      sortTokens: 'الأكثر رموزًا',
      sortRecent: 'الأحدث',
      tokens: 'الرموز',
      cost: 'التكلفة',
      share: 'الحصة',
      turns: 'أدوار',
      lastActive: 'آخر نشاط',
      untitled: 'محادثة بلا عنوان',
      details: 'التفاصيل',
      sessionId: 'معرّف الجلسة',
      requests: 'الطلبات',
      created: 'بدأت',
      model: 'النموذج',
      contextWindow: 'نافذة السياق',
      tokenBreakdown: 'تفصيل الرموز',
      costBreakdown: 'تفصيل التكلفة التقديرية',
      ofTotal: 'من إجمالي الإنفاق',
      settings: 'نموذج التكلفة والميزانية',
      settingsBody: 'التكاليف تقديرات محسوبة من الرموز المبلّغ عنها والأسعار أدناه، وليست فواتير.',
      budgetLabel: 'الميزانية الشهرية (دولار)',
      rateInput: 'إدخال غير مخزّن · $/1M',
      rateCache: 'قراءة من الذاكرة · $/1M',
      rateCacheWrite: 'كتابة إلى الذاكرة · $/1M',
      rateOutput: 'إخراج · $/1M',
      ratesNote: 'أسعار DeepSeek Flash الافتراضية افتراضات لهذه اللوحة. عدّلها لتطابق اتفاقك.',
      resetRates: 'إعادة الافتراضي',
      dataSource: 'مصدر البيانات',
      dataSourceBody: 'تُقرأ سجلات الجلسات في المضيف عبر خدمة Session Query. لا يستقبل المتصفح إلا أرقامًا مجمّعة من مسار محلي موثّق.',
      stored: 'الجلسات المحفوظة',
      liveSessions: 'الجلسات المباشرة',
      unreadable: 'سجلات غير مقروءة',
      footerNote: 'أرقام المعالج تصف هذا الجهاز وعملية Harness. أرقام الرموز هي استخدام مبلّغ عنه من المزوّد.',
      justNow: 'الآن',
      minutesAgo: 'قبل {n} د',
      hoursAgo: 'قبل {n} س',
      daysAgo: 'قبل {n} ي',
      perMillion: 'لكل مليون رمز',
      settingsSaved: 'محفوظة على هذا الجهاز',
      noConversations: 'لا محادثات ذات استخدام رموز',
      noConversationsBody: 'أكمل ردًا من النموذج لتظهر رموزه وتكلفته التقديرية هنا.',
      cacheHit: 'إصابة الذاكرة',
      cacheHitSub: '{pct} من رموز الطلب',
      averageTurn: 'المتوسط لكل طلب',
      requestCount: '{n} طلبًا',
      sourceBreakdown: 'المصدر'
    };

    const DICT_ZH = {
      navLabel: '用量与统计',
      eyebrow: 'Harness · 统计',
      title: '用量、成本与性能',
      subtitle: '从本配置中的每个对话读取真实 token 数，并给出成本估算与实时机器活动。',
      refresh: '刷新',
      refreshing: '正在刷新',
      updated: '更新于 {time}',
      live: '实时',
      loading: '正在读取会话日志…',
      loadError: '无法加载统计。',
      loadErrorBody: '{message}',
      retry: '重试',
      totalTokens: '总 token',
      totalTokensSub: '来自 {n} 个对话',
      estimatedCost: '预估成本',
      estimatedCostSub: '本月至今：{amount}',
      conversations: '对话',
      conversationsSub: '{live} 个运行中 · {stored} 个已存储',
      budget: '每月预算',
      budgetSub: '已用 {used} / {budget}',
      budgetRemaining: '剩余 {amount}',
      budgetOver: '超出 {amount}',
      setBudget: '设置预算',
      monthToDate: '本月至今',
      allTime: '全部',
      tokenTimeline: 'Token 时间线',
      timelineSub: '按{unit}堆叠的 token 量。',
      hourly: '按小时',
      daily: '按天',
      windowTotal: '此窗口共 {tokens} token',
      cacheRead: '缓存读取',
      input: '输入',
      output: '输出',
      cacheWrite: '缓存写入',
      total: '合计',
      time: '时间',
      noTimeline: '此窗口暂无 token 活动。',
      noTimelineBody: '开始对话后，消息完成时时间线会自动填充。',
      cpuTitle: 'CPU 活动',
      cpuSub: '系统负载与本 Harness 进程，每两秒采样一次。',
      systemCpu: '系统',
      harnessCpu: 'Harness 进程',
      loadAverage: '平均负载',
      memory: '内存',
      cores: '{n} 核',
      cpuUnavailable: 'CPU 采样正在预热。',
      cpuUnavailableBody: '首个采样将在两秒内出现。',
      perCore: '各核心利用率',
      sampledAt: '采样于 {time}',
      conversationTitle: '对话',
      conversationSub: '{n} 个有 token 用量',
      sortCost: '成本最高',
      sortTokens: 'Token 最多',
      sortRecent: '最近活动',
      tokens: 'Token',
      cost: '成本',
      share: '占比',
      turns: '轮',
      lastActive: '最近活动',
      untitled: '未命名对话',
      details: '详情',
      sessionId: '会话 ID',
      requests: '请求',
      created: '开始于',
      model: '模型',
      contextWindow: '上下文窗口',
      tokenBreakdown: 'Token 构成',
      costBreakdown: '预估成本构成',
      ofTotal: '占总支出',
      settings: '成本模型与预算',
      settingsBody: '成本是根据上报 token 与下列费率计算的估算值，不是账单。',
      budgetLabel: '每月预算（美元）',
      rateInput: '非缓存输入 · $/1M',
      rateCache: '缓存读取 · $/1M',
      rateCacheWrite: '缓存写入 · $/1M',
      rateOutput: '输出 · $/1M',
      ratesNote: 'DeepSeek Flash 默认费率为本面板假设值，请按实际合同调整。',
      resetRates: '恢复默认',
      dataSource: '数据来源',
      dataSourceBody: '会话日志由 Host 通过 Session Query 服务读取。浏览器只从经过身份验证的本地路由接收汇总数字。',
      stored: '已存储会话',
      liveSessions: '运行中会话',
      unreadable: '不可读日志',
      footerNote: 'CPU 数字描述本机与 Harness 进程；token 数字为提供商上报用量。',
      justNow: '刚刚',
      minutesAgo: '{n} 分钟前',
      hoursAgo: '{n} 小时前',
      daysAgo: '{n} 天前',
      perMillion: '每百万 token',
      settingsSaved: '已保存在本设备',
      noConversations: '暂无带 token 用量的对话',
      noConversationsBody: '完成一次模型回复后，这里会显示其 token 与预估成本。',
      cacheHit: '缓存命中',
      cacheHitSub: '占提示 token 的 {pct}',
      averageTurn: '每次请求平均',
      requestCount: '{n} 次请求',
      sourceBreakdown: '来源'
    };

    const CSS = `
.us-root{--us-radius:18px;--us-radius-sm:12px;--us-track:color-mix(in oklab,var(--dsw-alias-border-l1) 55%,transparent);--us-accent:var(--dsw-alias-brand-primary);--us-warm:#e6a75c;--us-ok:var(--dsw-alias-state-success-primary);--us-err:var(--dsw-alias-state-error-primary);min-height:100%;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family),system-ui,-apple-system,"Segoe UI",sans-serif;overflow:auto;position:relative}
.us-root *{box-sizing:border-box}
.us-page{width:100%;max-width:1240px;margin:0 auto;padding:30px 34px 72px;display:flex;flex-direction:column;gap:18px}
.us-head{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;flex-wrap:wrap;padding-block:4px 2px}
.us-head-copy{max-width:700px;min-width:0}
.us-eyebrow{margin:0 0 8px;font-size:11px;line-height:1;letter-spacing:.13em;text-transform:uppercase;color:var(--dsw-alias-label-secondary);font-weight:650}
.us-title{margin:0;font-size:clamp(27px,3.1vw,38px);line-height:1.08;letter-spacing:-.026em;font-weight:640}
.us-sub{margin:10px 0 0;font-size:13.5px;line-height:1.6;color:var(--dsw-alias-label-secondary);max-width:66ch}
.us-head-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-top:3px}
.us-live{display:inline-flex;align-items:center;gap:7px;height:32px;padding:0 11px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;background:var(--dsw-alias-bg-layer-1);font-size:11.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.us-live-dot{width:6px;height:6px;border-radius:50%;background:var(--us-ok);box-shadow:0 0 0 3px color-mix(in srgb,var(--us-ok) 18%,transparent)}
.us-live.is-waiting .us-live-dot{background:var(--us-warm);box-shadow:0 0 0 3px color-mix(in srgb,var(--us-warm) 18%,transparent)}
.us-btn{appearance:none;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);height:34px;border-radius:10px;padding:0 13px;font:inherit;font-size:12.5px;font-weight:560;display:inline-flex;align-items:center;gap:7px;cursor:pointer;transition:background .16s ease,border-color .16s ease,transform .16s ease}
.us-btn:hover{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l2)}
.us-btn:active{transform:translateY(1px)}
.us-btn:disabled{opacity:.55;cursor:default}
.us-btn.is-primary{background:var(--us-accent);border-color:transparent;color:#fff}
.us-btn.is-primary:hover{background:var(--us-accent);filter:brightness(1.06)}
.us-btn.is-ghost{background:transparent}
.us-btn.is-icon{width:34px;padding:0;justify-content:center}
.us-btn svg{display:block;flex:none}
.us-spin{animation:us-spin .85s linear infinite}
@keyframes us-spin{to{transform:rotate(360deg)}}
.us-banner{display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border:1px solid color-mix(in srgb,var(--us-err) 38%,transparent);background:color-mix(in srgb,var(--us-err) 8%,var(--dsw-alias-bg-layer-1));border-radius:var(--us-radius-sm);font-size:13px;line-height:1.55}
.us-banner svg{color:var(--us-err);flex:none;margin-top:1px}
.us-banner-body{flex:1;min-width:0}
.us-banner strong{display:block;font-weight:620;margin-bottom:2px}
.us-banner span{color:var(--dsw-alias-label-secondary);word-break:break-word}
.us-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.us-kpi{position:relative;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:var(--us-radius);padding:16px 17px 15px;min-height:132px;display:flex;flex-direction:column;gap:8px;overflow:hidden}
.us-kpi::after{content:'';position:absolute;inset-inline-end:-42px;top:-58px;width:130px;height:130px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--us-accent) 9%,transparent),transparent 68%);pointer-events:none}
.us-kpi-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.us-kpi-label{font-size:11.5px;letter-spacing:.02em;color:var(--dsw-alias-label-secondary);font-weight:540}
.us-kpi-icon{width:24px;height:24px;border-radius:7px;display:grid;place-items:center;background:color-mix(in srgb,var(--us-accent) 10%,transparent);color:var(--us-accent);flex:none}
.us-kpi-value{font-size:clamp(25px,2.35vw,33px);line-height:1;font-weight:620;letter-spacing:-.03em;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.us-kpi-value small{font-size:.55em;font-weight:560;letter-spacing:0;color:var(--dsw-alias-label-secondary);margin-inline-start:4px}
.us-kpi-sub{font-size:11.5px;line-height:1.45;color:var(--dsw-alias-label-secondary);margin-top:auto}
.us-kpi-bar{height:5px;border-radius:99px;background:var(--us-track);overflow:hidden;display:flex;margin-top:2px}
.us-kpi-bar i{display:block;height:100%}
.us-kpi-bar .is-cache{background:color-mix(in srgb,var(--us-accent) 32%,var(--us-track))}
.us-kpi-bar .is-input{background:var(--us-accent)}
.us-kpi-bar .is-output{background:var(--us-warm)}
.us-progress{height:6px;border-radius:99px;background:var(--us-track);overflow:hidden;margin-top:2px}
.us-progress i{display:block;height:100%;border-radius:99px;background:var(--us-accent);transition:width .35s ease}
.us-progress.is-warn i{background:var(--us-warm)}
.us-progress.is-over i{background:var(--us-err)}
.us-grid{display:grid;grid-template-columns:minmax(0,1.9fr) minmax(300px,1fr);gap:12px;align-items:stretch}
.us-panel{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:var(--us-radius);padding:18px 19px;min-width:0;display:flex;flex-direction:column;gap:14px}
.us-panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap}
.us-panel-head h2{margin:0;font-size:15px;line-height:1.25;font-weight:620;letter-spacing:-.012em}
.us-panel-head p{margin:4px 0 0;font-size:11.8px;line-height:1.5;color:var(--dsw-alias-label-secondary);max-width:52ch}
.us-seg{display:inline-flex;align-items:center;gap:2px;padding:3px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);border-radius:9px}
.us-seg button{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary);height:26px;padding:0 10px;border-radius:6px;font:inherit;font-size:11.5px;font-weight:540;cursor:pointer}
.us-seg button[aria-pressed="true"]{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);box-shadow:0 1px 2px rgba(0,0,0,.12)}
.us-chart-wrap{position:relative;width:100%;direction:ltr}
.us-chart{display:block;width:100%;height:auto;overflow:visible}
.us-chart .us-grid-line{stroke:var(--dsw-alias-border-l1);stroke-width:1;shape-rendering:crispEdges}
.us-chart .us-axis{fill:var(--dsw-alias-label-secondary);font-size:10.5px;font-family:var(--dsw-font-family),system-ui,sans-serif}
.us-chart .us-marker{stroke:var(--dsw-alias-label-secondary);stroke-width:1;stroke-dasharray:3 4;opacity:.55}
.us-legend{display:flex;align-items:center;gap:16px;flex-wrap:wrap;font-size:11.5px;color:var(--dsw-alias-label-secondary);min-height:20px}
.us-legend-item{display:inline-flex;align-items:center;gap:6px}
.us-legend-dot{width:8px;height:8px;border-radius:2.5px;display:block}
.us-readout{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:9px 11px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-base);font-size:11.5px;color:var(--dsw-alias-label-secondary);min-height:36px}
.us-readout strong{color:var(--dsw-alias-label-primary);font-weight:600;font-variant-numeric:tabular-nums}
.us-table-details{margin-top:2px;overflow-x:auto}
.us-table-details summary{cursor:pointer;font-size:11.5px;color:var(--dsw-alias-label-secondary);width:max-content;padding:2px 0;border-radius:5px}
.us-table-details summary:hover{color:var(--dsw-alias-label-primary)}
.us-data-table{width:100%;border-collapse:collapse;margin-top:9px;font-size:11.5px;font-variant-numeric:tabular-nums}
.us-data-table caption{text-align:start;font-size:11px;color:var(--dsw-alias-label-secondary);padding-bottom:6px}
.us-data-table th{text-align:end;font-weight:540;color:var(--dsw-alias-label-secondary);padding:6px 8px;border-bottom:1px solid var(--dsw-alias-border-l1);white-space:nowrap}
.us-data-table th:first-child,.us-data-table td:first-child{text-align:start}
.us-data-table td{text-align:end;padding:6px 8px;border-bottom:1px solid color-mix(in srgb,var(--dsw-alias-border-l1) 55%,transparent);white-space:nowrap}
.us-data-table tbody tr:last-child td{border-bottom:0}
.us-cpu-hero{display:grid;grid-template-columns:132px minmax(0,1fr);gap:16px;align-items:center}
.us-gauge{--v:0;position:relative;width:132px;height:132px;border-radius:50%;background:conic-gradient(from 180deg,var(--us-accent) calc(var(--v)*1%),var(--us-track) 0);display:grid;place-items:center;flex:none}
.us-gauge::before{content:'';position:absolute;inset:10px;border-radius:50%;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1)}
.us-gauge-inner{position:relative;z-index:1;text-align:center;line-height:1}
.us-gauge-value{font-size:27px;font-weight:630;letter-spacing:-.04em;font-variant-numeric:tabular-nums}
.us-gauge-value small{font-size:12px;font-weight:540;color:var(--dsw-alias-label-secondary);letter-spacing:0}
.us-gauge-label{display:block;margin-top:6px;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--dsw-alias-label-secondary);font-weight:560}
.us-cpu-facts{display:flex;flex-direction:column;gap:9px;min-width:0}
.us-fact{display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding-bottom:8px;border-bottom:1px solid color-mix(in srgb,var(--dsw-alias-border-l1) 60%,transparent);font-size:11.8px;color:var(--dsw-alias-label-secondary)}
.us-fact:last-child{border-bottom:0;padding-bottom:0}
.us-fact b{color:var(--dsw-alias-label-primary);font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap}
.us-cores{display:grid;grid-template-columns:repeat(auto-fit,minmax(18px,1fr));gap:5px;align-items:end;height:46px;margin-top:1px}
.us-core{height:100%;display:flex;flex-direction:column;justify-content:flex-end;gap:4px;min-width:0}
.us-core i{display:block;border-radius:3px 3px 1px 1px;background:color-mix(in srgb,var(--us-accent) 74%,transparent);min-height:3px;transition:height .3s ease}
.us-core span{font-size:8.5px;text-align:center;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;overflow:hidden}
.us-cores-label{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--dsw-alias-label-secondary);font-weight:550}
.us-spark{width:100%;height:58px;display:block;overflow:visible;margin-top:2px}
.us-spark-legend{display:flex;gap:14px;font-size:10.5px;color:var(--dsw-alias-label-secondary);align-items:center}
.us-empty{padding:22px 18px;border:1px dashed var(--dsw-alias-border-l2);border-radius:12px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.55}
.us-empty strong{display:block;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;margin-bottom:4px}
.us-conv-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap}
.us-conv-tools{display:flex;align-items:center;gap:8px}
.us-select{appearance:none;height:30px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:11.5px;padding:0 28px 0 9px;cursor:pointer;background-image:linear-gradient(45deg,transparent 50%,var(--dsw-alias-label-secondary) 50%),linear-gradient(135deg,var(--dsw-alias-label-secondary) 50%,transparent 50%);background-position:calc(100% - 13px) 12px,calc(100% - 9px) 12px;background-size:4px 4px,4px 4px;background-repeat:no-repeat}
.us-conv-table{display:flex;flex-direction:column}
.us-conv-columns,.us-conv-row{display:grid;grid-template-columns:minmax(0,1fr) 96px 92px 62px 22px;gap:12px;align-items:center}
.us-conv-columns{padding:0 10px 8px;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:10px;letter-spacing:.07em;text-transform:uppercase;color:var(--dsw-alias-label-secondary);font-weight:560}
.us-conv-columns span:nth-child(2),.us-conv-columns span:nth-child(3),.us-conv-columns span:nth-child(4){text-align:end}
.us-conv-item{border-bottom:1px solid color-mix(in srgb,var(--dsw-alias-border-l1) 62%,transparent)}
.us-conv-item:last-child{border-bottom:0}
.us-conv-row{appearance:none;border:0;background:transparent;color:inherit;font:inherit;text-align:start;width:100%;padding:11px 10px;border-radius:9px;cursor:pointer;transition:background .14s ease}
.us-conv-row:hover{background:var(--dsw-alias-bg-layer-2)}
.us-conv-row:focus-visible{outline:2px solid var(--us-accent);outline-offset:-2px}
.us-conv-main{min-width:0;display:flex;flex-direction:column;gap:3px}
.us-conv-title{font-size:12.8px;font-weight:570;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.us-conv-meta{font-size:10.8px;line-height:1.4;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.us-conv-num{text-align:end;font-size:12.2px;font-weight:560;font-variant-numeric:tabular-nums;white-space:nowrap}
.us-conv-share{text-align:end;font-size:11.5px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;white-space:nowrap}
.us-chev{display:grid;place-items:center;color:var(--dsw-alias-label-secondary);transition:transform .18s ease}
.us-chev.is-open{transform:rotate(90deg)}
.us-conv-empty{padding:26px 16px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.55}
.us-conv-empty strong{display:block;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;margin-bottom:4px}
.us-detail{padding:2px 12px 16px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px}
.us-detail-box{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);border-radius:10px;padding:12px 13px;min-width:0}
.us-detail-box h3{margin:0 0 9px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--dsw-alias-label-secondary);font-weight:580}
.us-split-row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;font-size:11.5px;margin-bottom:8px}
.us-split-row:last-child{margin-bottom:0}
.us-split-row span{color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.us-split-row b{font-weight:560;font-variant-numeric:tabular-nums;white-space:nowrap}
.us-split-track{grid-column:1/-1;height:4px;border-radius:99px;background:var(--us-track);overflow:hidden;margin-top:-3px}
.us-split-track i{display:block;height:100%;border-radius:99px;background:var(--us-accent)}
.us-detail-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px 14px;margin-top:10px;padding-top:10px;border-top:1px solid var(--dsw-alias-border-l1);font-size:10.8px;color:var(--dsw-alias-label-secondary)}
.us-detail-meta div{display:flex;flex-direction:column;gap:2px;min-width:0}
.us-detail-meta b{color:var(--dsw-alias-label-primary);font-weight:550;font-variant-numeric:tabular-nums;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.us-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10px}
.us-settings{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:var(--us-radius);padding:18px 19px;display:flex;flex-direction:column;gap:13px}
.us-settings summary{display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;list-style:none;font-size:14px;font-weight:600;border-radius:7px}
.us-settings summary::-webkit-details-marker{display:none}
.us-settings summary:focus-visible{outline:2px solid var(--us-accent);outline-offset:3px}
.us-settings summary::after{content:'+';font-size:17px;font-weight:400;color:var(--dsw-alias-label-secondary);line-height:1}
.us-settings[open] summary::after{content:'–'}
.us-settings-body{display:flex;flex-direction:column;gap:12px;padding-top:4px}
.us-settings p{margin:0;font-size:11.5px;line-height:1.55;color:var(--dsw-alias-label-secondary)}
.us-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.us-field{display:flex;flex-direction:column;gap:5px;font-size:10.5px;letter-spacing:.02em;color:var(--dsw-alias-label-secondary);font-weight:520}
.us-field input{height:32px;width:100%;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;font-variant-numeric:tabular-nums;padding:0 9px}
.us-field input:focus-visible{outline:2px solid var(--us-accent);outline-offset:0;border-color:transparent}
.us-settings-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.us-saved{font-size:10.5px;color:var(--dsw-alias-label-secondary)}
.us-about{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.us-about .us-panel{gap:9px}
.us-about p{margin:0;font-size:11.5px;line-height:1.6;color:var(--dsw-alias-label-secondary)}
.us-about strong{font-weight:600;color:var(--dsw-alias-label-primary)}
.us-foot{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;font-size:10.5px;line-height:1.5;color:var(--dsw-alias-label-secondary);padding:0 2px}
.us-skeleton{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:var(--us-radius);min-height:132px;position:relative;overflow:hidden}
.us-skeleton::after{content:'';position:absolute;inset:0;background:linear-gradient(100deg,transparent 20%,color-mix(in srgb,var(--dsw-alias-label-secondary) 9%,transparent) 45%,transparent 70%);transform:translateX(-100%);animation:us-shimmer 1.4s ease-in-out infinite}
@keyframes us-shimmer{to{transform:translateX(100%)}}
.us-muted{color:var(--dsw-alias-label-secondary)}
.us-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media (max-width:1020px){.us-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.us-grid{grid-template-columns:1fr}.us-cpu-hero{grid-template-columns:118px minmax(0,1fr)}.us-gauge{width:118px;height:118px}}
@media (max-width:720px){.us-page{padding:20px 16px 56px;gap:14px}.us-btn{min-height:40px}.us-title{font-size:27px}.us-sub{font-size:12.5px}.us-head{gap:14px}.us-head-actions{width:100%}.us-kpis{gap:9px}.us-kpi{min-height:120px;padding:13px 14px}.us-kpi-value{font-size:26px}.us-panel{padding:15px 14px}.us-detail{grid-template-columns:1fr;padding-inline:4px}.us-conv-columns{display:none}.us-conv-row{grid-template-columns:minmax(0,1fr) auto 20px;gap:10px;padding:11px 4px}.us-conv-row .us-conv-cost,.us-conv-row .us-conv-share{display:none}.us-about{grid-template-columns:1fr}.us-cpu-hero{grid-template-columns:104px minmax(0,1fr);gap:12px}.us-gauge{width:104px;height:104px}.us-gauge-value{font-size:23px}.us-gauge::before{inset:8px}.us-fields{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:420px){.us-kpis{grid-template-columns:1fr}.us-fields{grid-template-columns:1fr}.us-head-actions .us-live{display:none}}
@media (prefers-reduced-motion:reduce){.us-root *,.us-root *::before,.us-root *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}}
`;

    const ICONS = {
      chart: function (props) {
        return h('svg', { viewBox: '0 0 24 24', width: props && props.size || 18, height: props && props.size || 18, fill: 'none', 'aria-hidden': 'true' },
          h('path', { d: 'M4 19.2V4.8M4 19.2h16', stroke: 'currentColor', strokeWidth: '1.5', strokeLinecap: 'round' }),
          h('path', { d: 'M7.4 15.4v-3.2M11.2 15.4V8.3M15 15.4v-4.6M18.8 15.4V6.2', stroke: 'currentColor', strokeWidth: '1.9', strokeLinecap: 'round' })
        );
      },
      coins: function (props) {
        return h('svg', { viewBox: '0 0 24 24', width: props && props.size || 18, height: props && props.size || 18, fill: 'none', 'aria-hidden': 'true' },
          h('ellipse', { cx: 12, cy: 7.2, rx: 6.7, ry: 2.7, stroke: 'currentColor', strokeWidth: '1.5' }),
          h('path', { d: 'M5.3 7.2v4.8c0 1.5 3 2.7 6.7 2.7s6.7-1.2 6.7-2.7V7.2M5.3 12v4.8c0 1.5 3 2.7 6.7 2.7s6.7-1.2 6.7-2.7V12', stroke: 'currentColor', strokeWidth: '1.5', strokeLinecap: 'round' })
        );
      },
      chat: function (props) {
        return h('svg', { viewBox: '0 0 24 24', width: props && props.size || 18, height: props && props.size || 18, fill: 'none', 'aria-hidden': 'true' },
          h('path', { d: 'M20 12.1c0 3.6-3.6 6.5-8 6.5-1 0-2-.1-2.9-.4L4.4 20l1.2-3.4C4.4 15.5 3.6 13.9 3.6 12.1c0-3.6 3.6-6.5 8-6.5s8.4 2.9 8.4 6.5Z', stroke: 'currentColor', strokeWidth: '1.5', strokeLinejoin: 'round' }),
          h('path', { d: 'M8.5 12h7M8.5 9h4.4', stroke: 'currentColor', strokeWidth: '1.5', strokeLinecap: 'round' })
        );
      },
      wallet: function (props) {
        return h('svg', { viewBox: '0 0 24 24', width: props && props.size || 18, height: props && props.size || 18, fill: 'none', 'aria-hidden': 'true' },
          h('rect', { x: 3.5, y: 6.5, width: 17, height: 12, rx: 2.5, stroke: 'currentColor', strokeWidth: '1.5' }),
          h('path', { d: 'M3.5 9.5h13.2a3.3 3.3 0 0 1 3.3 3.3v.3', stroke: 'currentColor', strokeWidth: '1.5' }),
          h('circle', { cx: 16.4, cy: 13.4, r: 1.2, fill: 'currentColor' })
        );
      },
      cpu: function (props) {
        return h('svg', { viewBox: '0 0 24 24', width: props && props.size || 18, height: props && props.size || 18, fill: 'none', 'aria-hidden': 'true' },
          h('rect', { x: 6.2, y: 6.2, width: 11.6, height: 11.6, rx: 2, stroke: 'currentColor', strokeWidth: '1.5' }),
          h('path', { d: 'M9.2 9.2h5.6v5.6H9.2z', stroke: 'currentColor', strokeWidth: '1.2' }),
          h('path', { d: 'M9 3.6v2.6M12 3.6v2.6M15 3.6v2.6M9 17.8v2.6M12 17.8v2.6M15 17.8v2.6M3.6 9h2.6M3.6 12h2.6M3.6 15h2.6M17.8 9h2.6M17.8 12h2.6M17.8 15h2.6', stroke: 'currentColor', strokeWidth: '1.35', strokeLinecap: 'round' })
        );
      },
      refresh: function (props) {
        return h('svg', { viewBox: '0 0 24 24', width: props && props.size || 15, height: props && props.size || 15, fill: 'none', 'aria-hidden': 'true', className: props && props.className || '' },
          h('path', { d: 'M19.3 10.2A7.6 7.6 0 1 0 19 14.5', stroke: 'currentColor', strokeWidth: '1.7', strokeLinecap: 'round' }),
          h('path', { d: 'M19.6 5.6v4.8h-4.8', stroke: 'currentColor', strokeWidth: '1.7', strokeLinecap: 'round', strokeLinejoin: 'round' })
        );
      },
      alert: function (props) {
        return h('svg', { viewBox: '0 0 24 24', width: props && props.size || 18, height: props && props.size || 18, fill: 'none', 'aria-hidden': 'true' },
          h('path', { d: 'M12 4.3 21 20H3L12 4.3Z', stroke: 'currentColor', strokeWidth: '1.5', strokeLinejoin: 'round' }),
          h('path', { d: 'M12 9v4.6', stroke: 'currentColor', strokeWidth: '1.8', strokeLinecap: 'round' }),
          h('circle', { cx: 12, cy: 16.9, r: 1, fill: 'currentColor' })
        );
      },
      chevron: function (props) {
        return h('svg', { viewBox: '0 0 16 16', width: props && props.size || 12, height: props && props.size || 12, fill: 'none', 'aria-hidden': 'true' },
          h('path', { d: 'm6 3.8 4.2 4.2L6 12.2', stroke: 'currentColor', strokeWidth: '1.6', strokeLinecap: 'round', strokeLinejoin: 'round' })
        );
      }
    };

    function StatsIcon(props) {
      const size = props && props.size ? props.size : 20;
      return h('svg', {
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        fill: 'none',
        'aria-hidden': 'true',
        style: { display: 'block', color: 'currentColor' }
      },
        h('rect', { x: 3.2, y: 3.2, width: 17.6, height: 17.6, rx: 5.2, stroke: 'currentColor', strokeWidth: '1.35', opacity: '0.55' }),
        h('path', { d: 'M7.3 16.5v-3.1M10.6 16.5V9.2M13.9 16.5v-4.7M17.2 16.5V7.3', stroke: 'currentColor', strokeWidth: '1.9', strokeLinecap: 'round' }),
        h('path', { d: 'M6.7 6.2h3.1', stroke: 'currentColor', strokeWidth: '1.4', strokeLinecap: 'round', opacity: '0.7' })
      );
    }

    function loadSettings() {
      try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return { budget: DEFAULT_BUDGET, rates: { ...DEFAULT_RATES } };
        const parsed = JSON.parse(raw);
        const rates = {};
        for (const key of Object.keys(DEFAULT_RATES)) {
          const value = parsed && parsed.rates && Number(parsed.rates[key]);
          rates[key] = Number.isFinite(value) && value >= 0 ? value : DEFAULT_RATES[key];
        }
        const budget = parsed && Number(parsed.budget);
        return { budget: Number.isFinite(budget) && budget >= 0 ? budget : DEFAULT_BUDGET, rates };
      } catch (error) {
        return { budget: DEFAULT_BUDGET, rates: { ...DEFAULT_RATES } };
      }
    }

    function saveSettings(settings) {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch (error) {
        /* storage may be unavailable */
      }
    }

    function formatNumber(value, localeTag, compact) {
      const number = Number(value) || 0;
      try {
        return new Intl.NumberFormat(localeTag, compact
          ? { notation: 'compact', maximumFractionDigits: 1, numberingSystem: 'latn' }
          : { maximumFractionDigits: 0, numberingSystem: 'latn' }
        ).format(number);
      } catch (error) {
        return compact ? String(Math.round(number)) : String(number);
      }
    }

    function formatMoney(value, localeTag) {
      const number = Number(value) || 0;
      const digits = number > 0 && number < 1 ? 3 : 2;
      try {
        return new Intl.NumberFormat(localeTag, {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
          numberingSystem: 'latn'
        }).format(number);
      } catch (error) {
        return '$' + number.toFixed(digits);
      }
    }

    function formatDateTime(time, localeTag) {
      if (!time) return '—';
      try {
        return new Intl.DateTimeFormat(localeTag, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          numberingSystem: 'latn'
        }).format(new Date(time));
      } catch (error) {
        return new Date(time).toLocaleString();
      }
    }

    function formatTime(time, localeTag) {
      if (!time) return '—';
      try {
        return new Intl.DateTimeFormat(localeTag, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          numberingSystem: 'latn'
        }).format(new Date(time));
      } catch (error) {
        return new Date(time).toLocaleTimeString();
      }
    }

    function formatHour(time, localeTag) {
      try {
        return new Intl.DateTimeFormat(localeTag, {
          hour: '2-digit',
          minute: '2-digit',
          numberingSystem: 'latn'
        }).format(new Date(time));
      } catch (error) {
        return new Date(time).toLocaleTimeString();
      }
    }

    function formatDay(time, localeTag) {
      try {
        return new Intl.DateTimeFormat(localeTag, {
          month: 'short',
          day: 'numeric',
          numberingSystem: 'latn'
        }).format(new Date(time));
      } catch (error) {
        return new Date(time).toLocaleDateString();
      }
    }

    function costOf(usage, rates) {
      if (!usage) return 0;
      return (
        (Number(usage.input) || 0) * rates.input +
        (Number(usage.cacheRead) || 0) * rates.cacheRead +
        (Number(usage.cacheWrite) || 0) * rates.cacheWrite +
        (Number(usage.output) || 0) * rates.output
      ) / 1e6;
    }

    function costOfModels(models, rates) {
      let total = 0;
      for (const usage of Object.values(models || {})) total += costOf(usage, rates);
      return total;
    }

    function usageTotal(usage) {
      return Number(usage && usage.total) || 0;
    }

    function dateKey(date) {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${date.getFullYear()}-${month}-${day}`;
    }

    function buildSeries(data, granularity) {
      const source = granularity === 'hour' ? data.timeline.hours : data.timeline.days;
      const now = data.generatedAt || Date.now();
      if (granularity === 'hour') {
        const end = Math.floor(now / HOUR) * HOUR;
        const start = end - 23 * HOUR;
        const byKey = new Map(source.map((entry) => [entry.at, entry]));
        const points = [];
        for (let at = start; at <= end; at += HOUR) {
          const entry = byKey.get(at);
          points.push({
            key: at,
            label: formatHour(at, 'en-US'),
            input: entry ? entry.input : 0,
            cacheRead: entry ? entry.cacheRead : 0,
            cacheWrite: entry ? entry.cacheWrite : 0,
            output: entry ? entry.output : 0,
            total: entry ? entry.total : 0
          });
        }
        return points;
      }
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const days = 14;
      const byKey = new Map(source.map((entry) => [entry.date, entry]));
      const points = [];
      for (let offset = days - 1; offset >= 0; offset -= 1) {
        const date = new Date(today);
        date.setDate(today.getDate() - offset);
        const key = dateKey(date);
        const entry = byKey.get(key);
        points.push({
          key,
          label: formatDay(date.getTime(), 'en-US'),
          input: entry ? entry.input : 0,
          cacheRead: entry ? entry.cacheRead : 0,
          cacheWrite: entry ? entry.cacheWrite : 0,
          output: entry ? entry.output : 0,
          total: entry ? entry.total : 0
        });
      }
      return points;
    }

    function niceMax(value) {
      if (!Number.isFinite(value) || value <= 0) return 1;
      const power = Math.pow(10, Math.floor(Math.log10(value)));
      const ratio = value / power;
      const step = ratio <= 1 ? 1 : ratio <= 2 ? 2 : ratio <= 5 ? 5 : 10;
      return step * power;
    }

    function useStatsData() {
      const [state, setState] = React.useState({ phase: 'loading', data: null, error: null });
      const mounted = React.useRef(true);
      const inFlight = React.useRef(false);
      const load = React.useCallback(async function (quiet) {
        if (inFlight.current) return;
        inFlight.current = true;
        if (!quiet) setState(function (prev) { return { ...prev, phase: prev.data ? 'ready' : 'loading', error: null }; });
        try {
          const response = await fetch(new URL(ENDPOINT, document.baseURI).toString(), {
            method: 'GET',
            credentials: 'same-origin',
            headers: { accept: 'application/json' },
            cache: 'no-store'
          });
          const body = await response.json().catch(function () { return null; });
          if (!response.ok || !body || body.error) {
            throw new Error((body && body.message) || ('HTTP ' + response.status));
          }
          if (!mounted.current) return;
          setState({ phase: 'ready', data: body, error: null });
        } catch (error) {
          if (!mounted.current) return;
          setState(function (prev) {
            return { phase: prev.data ? 'ready' : 'error', data: prev.data, error: error && error.message ? error.message : String(error) };
          });
        } finally {
          inFlight.current = false;
        }
      }, []);
      React.useEffect(function () {
        mounted.current = true;
        load(false);
        const timer = window.setInterval(function () {
          if (!document.hidden) load(true);
        }, 5000);
        function onVisibility() {
          if (!document.hidden) load(true);
        }
        document.addEventListener('visibilitychange', onVisibility);
        return function () {
          mounted.current = false;
          window.clearInterval(timer);
          document.removeEventListener('visibilitychange', onVisibility);
        };
      }, [load]);
      return {
        phase: state.phase,
        data: state.data,
        error: state.error,
        reload: function () { load(false); }
      };
    }

    function relativeTime(time, t, localeTag) {
      if (!time) return '—';
      const diff = Date.now() - time;
      if (diff < 45 * 1000) return t('justNow');
      if (diff < 60 * 60 * 1000) return t('minutesAgo', { n: Math.max(1, Math.round(diff / 60000)) });
      if (diff < 24 * 60 * 60 * 1000) return t('hoursAgo', { n: Math.max(1, Math.round(diff / 3600000)) });
      if (diff < 7 * 24 * 60 * 60 * 1000) return t('daysAgo', { n: Math.max(1, Math.round(diff / 86400000)) });
      return formatDay(time, localeTag);
    }

    function KPI(props) {
      return h('article', { className: 'us-kpi' },
        h('div', { className: 'us-kpi-top' },
          h('span', { className: 'us-kpi-label' }, props.label),
          h('span', { className: 'us-kpi-icon', 'aria-hidden': 'true' }, props.icon)
        ),
        h('div', { className: 'us-kpi-value' }, props.value, props.unit ? h('small', null, props.unit) : null),
        props.children,
        h('div', { className: 'us-kpi-sub' }, props.sub)
      );
    }

    function TokenSplitBar(props) {
      const total = Math.max(1, props.total);
      const cache = (props.usage.cacheRead / total) * 100;
      const input = ((props.usage.input + (props.usage.cacheWrite || 0)) / total) * 100;
      const output = (props.usage.output / total) * 100;
      return h('div', { className: 'us-kpi-bar', 'aria-hidden': 'true' },
        h('i', { className: 'is-cache', style: { width: cache + '%' } }),
        h('i', { className: 'is-input', style: { width: input + '%' } }),
        h('i', { className: 'is-output', style: { width: output + '%' } })
      );
    }

    function Chart(props) {
      const W = 780;
      const H = 236;
      const pad = { l: 56, r: 18, t: 14, b: 30 };
      const points = props.points;
      const keys = props.keys;
      const [active, setActive] = React.useState(points.length - 1);
      const reactId = (React.useId ? React.useId() : 'usage-stats-chart').replace(/[^a-zA-Z0-9_-]/g, '');
      React.useEffect(function () {
        setActive(points.length - 1);
      }, [props.granularity, points.length]);

      if (!points.length || points.every(function (point) { return point.total <= 0; })) {
        return h('div', { className: 'us-empty' },
          h('strong', null, props.t('noTimeline')),
          props.t('noTimelineBody')
        );
      }

      const max = niceMax(Math.max.apply(null, points.map(function (point) { return point.total; })) * 1.08);
      const x = function (index) {
        return pad.l + (points.length <= 1 ? 0 : (index / (points.length - 1)) * (W - pad.l - pad.r));
      };
      const y = function (value) {
        return pad.t + (1 - value / max) * (H - pad.t - pad.b);
      };
      const stack = [];
      let lower = new Array(points.length).fill(0);
      for (const key of keys) {
        const upper = lower.map(function (base, index) { return base + (points[index][key] || 0); });
        stack.push({ key, lower, upper });
        lower = upper;
      }
      const areaPath = function (layer) {
        let path = 'M ' + x(0).toFixed(1) + ' ' + y(layer.upper[0]).toFixed(1);
        for (let index = 1; index < points.length; index += 1) {
          path += ' L ' + x(index).toFixed(1) + ' ' + y(layer.upper[index]).toFixed(1);
        }
        for (let index = points.length - 1; index >= 0; index -= 1) {
          path += ' L ' + x(index).toFixed(1) + ' ' + y(layer.lower[index]).toFixed(1);
        }
        return path + ' Z';
      };
      const linePath = function (layer) {
        let path = 'M ' + x(0).toFixed(1) + ' ' + y(layer.upper[0]).toFixed(1);
        for (let index = 1; index < points.length; index += 1) {
          path += ' L ' + x(index).toFixed(1) + ' ' + y(layer.upper[index]).toFixed(1);
        }
        return path;
      };
      const labelStep = Math.max(1, Math.ceil(points.length / 6));
      const activePoint = points[Math.max(0, Math.min(points.length - 1, active))];
      const activeValue = activePoint ? activePoint.total : 0;
      const activeLabel = props.granularity === 'hour'
        ? formatHour(activePoint ? activePoint.key : Date.now(), props.localeTag)
        : formatDay(new Date(activePoint ? activePoint.key + 'T12:00:00' : Date.now()).getTime(), props.localeTag);

      return h('div', { className: 'us-chart-wrap' },
        h('svg', {
          className: 'us-chart',
          viewBox: '0 0 ' + W + ' ' + H,
          role: 'img',
          'aria-label': props.t('tokenTimeline') + '. ' + props.t('windowTotal', { tokens: formatNumber(props.windowTotal, props.localeTag) })
        },
          h('defs', null,
            keys.map(function (key) {
              return h('linearGradient', { key, id: reactId + '-' + key, x1: '0', y1: '0', x2: '0', y2: '1' },
                h('stop', { offset: '0%', style: { stopColor: props.colors[key], stopOpacity: key === 'cacheRead' ? '0.62' : '0.88' } }),
                h('stop', { offset: '100%', style: { stopColor: props.colors[key], stopOpacity: key === 'cacheRead' ? '0.26' : '0.42' } })
              );
            })
          ),
          [0, 0.5, 1].map(function (ratio) {
            const value = max * ratio;
            return h('g', { key: ratio },
              h('line', { className: 'us-grid-line', x1: pad.l, x2: W - pad.r, y1: y(value), y2: y(value) }),
              h('text', { className: 'us-axis', x: pad.l - 10, y: y(value) + 3.5, textAnchor: 'end' }, formatNumber(value, props.localeTag, true))
            );
          }),
          stack.map(function (layer) {
            return h('path', {
              key: layer.key,
              d: areaPath(layer),
              fill: 'url(#' + reactId + '-' + layer.key + ')',
              stroke: 'none'
            });
          }),
          stack.map(function (layer) {
            return h('path', {
              key: 'line-' + layer.key,
              d: linePath(layer),
              fill: 'none',
              style: { stroke: props.colors[layer.key] },
              strokeWidth: '1.1',
              strokeOpacity: '0.75',
              strokeLinejoin: 'round'
            });
          }),
          points.map(function (point, index) {
            return index % labelStep === 0 || index === points.length - 1 ? h('text', {
              key: 'label-' + point.key,
              className: 'us-axis',
              x: x(index),
              y: H - 8,
              textAnchor: index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'
            }, props.granularity === 'hour' ? formatHour(point.key, props.localeTag) : formatDay(new Date(point.key + 'T12:00:00').getTime(), props.localeTag)) : null;
          }),
          activePoint ? h('line', {
            className: 'us-marker',
            x1: x(active),
            x2: x(active),
            y1: pad.t,
            y2: H - pad.b
          }) : null,
          points.map(function (point, index) {
            const step = points.length > 1 ? (W - pad.l - pad.r) / (points.length - 1) : W;
            return h('rect', {
              key: 'hit-' + point.key,
              x: x(index) - step / 2,
              y: pad.t,
              width: step,
              height: H - pad.t - pad.b,
              fill: 'transparent',
              onMouseEnter: function () { setActive(index); },
              onMouseMove: function () { setActive(index); }
            });
          })
        ),
        h('div', { className: 'us-readout', 'aria-live': 'polite' },
          h('span', null, activeLabel),
          h('span', null, props.t('total') + ' ', h('strong', null, formatNumber(activeValue, props.localeTag)), ' · ', props.t('cacheRead') + ' ', h('strong', null, formatNumber(activePoint ? activePoint.cacheRead : 0, props.localeTag)), ' · ', props.t('output') + ' ', h('strong', null, formatNumber(activePoint ? activePoint.output : 0, props.localeTag)))
        ),
        h('div', { className: 'us-legend' },
          keys.map(function (key) {
            return h('span', { key, className: 'us-legend-item' },
              h('i', { className: 'us-legend-dot', style: { background: props.colors[key] } }),
              props.t(key === 'cacheRead' ? 'cacheRead' : key === 'cacheWrite' ? 'cacheWrite' : key)
            );
          })
        ),
        h('details', { className: 'us-table-details' },
          h('summary', null, props.t('time') + ' / ' + props.t('tokens')),
          h('table', { className: 'us-data-table' },
            h('caption', null, props.t('tokenTimeline')),
            h('thead', null,
              h('tr', null,
                h('th', { scope: 'col' }, props.t('time')),
                keys.map(function (key) {
                  return h('th', { key, scope: 'col' }, props.t(key === 'cacheRead' ? 'cacheRead' : key === 'cacheWrite' ? 'cacheWrite' : key));
                }),
                h('th', { scope: 'col' }, props.t('total'))
              )
            ),
            h('tbody', null,
              points.map(function (point) {
                return h('tr', { key: point.key },
                  h('td', null, props.granularity === 'hour' ? formatHour(point.key, props.localeTag) : formatDay(new Date(point.key + 'T12:00:00').getTime(), props.localeTag)),
                  keys.map(function (key) {
                    return h('td', { key }, formatNumber(point[key], props.localeTag));
                  }),
                  h('td', null, formatNumber(point.total, props.localeTag))
                );
              })
            )
          )
        )
      );
    }

    function Sparkline(props) {
      const history = (props.history || []).slice(-60);
      if (history.length < 2) {
        return h('div', { className: 'us-empty' }, props.t('cpuUnavailableBody'));
      }
      const W = 360;
      const H = 64;
      const points = history.map(function (sample, index) {
        return {
          x: (index / (history.length - 1)) * W,
          system: 1 - Math.max(0, Math.min(100, sample.system || 0)) / 100,
          process: 1 - Math.max(0, Math.min(100, sample.process || 0)) / 100
        };
      });
      const line = function (key) {
        let path = 'M ' + points[0].x.toFixed(1) + ' ' + (points[0][key] * H).toFixed(1);
        for (let index = 1; index < points.length; index += 1) {
          path += ' L ' + points[index].x.toFixed(1) + ' ' + (points[index][key] * H).toFixed(1);
        }
        return path;
      };
      const area = function (key) {
        return line(key) + ' L ' + W + ' ' + H + ' L 0 ' + H + ' Z';
      };
      return h('div', null,
        h('svg', { className: 'us-spark', viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'none', 'aria-hidden': 'true' },
          h('path', { d: area('system'), style: { fill: 'color-mix(in srgb, var(--us-accent) 12%, transparent)', stroke: 'none' } }),
          h('path', { d: line('system'), style: { fill: 'none', stroke: 'var(--us-accent)' }, strokeWidth: '1.5', strokeLinejoin: 'round', strokeLinecap: 'round', 'vector-effect': 'non-scaling-stroke' }),
          h('path', { d: line('process'), style: { fill: 'none', stroke: 'var(--us-warm)' }, strokeWidth: '1.2', strokeDasharray: '3 3', strokeLinejoin: 'round', strokeLinecap: 'round', 'vector-effect': 'non-scaling-stroke' })
        ),
        h('div', { className: 'us-spark-legend' },
          h('span', { className: 'us-legend-item' }, h('i', { className: 'us-legend-dot', style: { background: 'var(--us-accent)' } }), props.t('systemCpu')),
          h('span', { className: 'us-legend-item' }, h('i', { className: 'us-legend-dot', style: { background: 'var(--us-warm)' } }), props.t('harnessCpu'))
        )
      );
    }

    function CpuPanel(props) {
      const cpu = props.data.cpu || {};
      const ready = !cpu.sampling && typeof cpu.systemPercent === 'number';
      const system = ready ? cpu.systemPercent : 0;
      const processPercent = ready ? cpu.processPercent : 0;
      const load = Array.isArray(cpu.load) ? cpu.load : [0, 0, 0];
      const memory = cpu.memory || {};
      const toGb = function (bytes) { return (Number(bytes) || 0) / (1024 * 1024 * 1024); };
      const memoryPct = toGb(memory.total) > 0 ? (toGb(memory.used) / toGb(memory.total)) * 100 : 0;
      const cores = Array.isArray(cpu.perCore) && cpu.perCore.length ? cpu.perCore : [];
      return h('section', { className: 'us-panel' },
        h('div', { className: 'us-panel-head' },
          h('div', null,
            h('h2', null, props.t('cpuTitle')),
            h('p', null, props.t('cpuSub'))
          ),
          h('span', { className: 'us-live ' + (ready ? '' : 'is-waiting') },
            h('i', { className: 'us-live-dot' }),
            ready ? props.t('live') : props.t('cpuUnavailable')
          )
        ),
        h('div', { className: 'us-cpu-hero' },
          h('div', { className: 'us-gauge', style: { '--v': Math.max(0, Math.min(100, system)).toFixed(1) }, role: 'img', 'aria-label': props.t('systemCpu') + ' ' + system.toFixed(1) + '%' },
            h('div', { className: 'us-gauge-inner' },
              h('div', { className: 'us-gauge-value' }, system.toFixed(system >= 10 ? 0 : 1), h('small', null, '%')),
              h('span', { className: 'us-gauge-label' }, props.t('systemCpu'))
            )
          ),
          h('div', { className: 'us-cpu-facts' },
            h('div', { className: 'us-fact' }, h('span', null, props.t('harnessCpu')), h('b', null, ready ? processPercent.toFixed(processPercent >= 10 ? 1 : 2) + '%' : '—')),
            h('div', { className: 'us-fact' }, h('span', null, props.t('loadAverage')), h('b', null, load.map(function (value) { return Number(value).toFixed(2); }).join(' / '))),
            h('div', { className: 'us-fact' }, h('span', null, props.t('memory')), h('b', null, toGb(memory.used).toFixed(1) + ' / ' + toGb(memory.total).toFixed(1) + ' GB')),
            h('div', { className: 'us-fact' }, h('span', null, props.t('cores', { n: cpu.coreCount || 0 })), h('b', null, cpu.model ? cpu.model.replace(/\(.*?\)/g, '').trim().slice(0, 22) : '—'))
          )
        ),
        h('div', { className: 'us-progress ' + (memoryPct > 88 ? 'is-warn' : ''), 'aria-hidden': 'true' }, h('i', { style: { width: Math.min(100, memoryPct) + '%' } })),
        cores.length ? h('div', null,
          h('div', { className: 'us-cores-label' }, h('span', null, props.t('perCore')), h('span', null, props.t('cores', { n: cores.length }))),
          h('div', { className: 'us-cores' },
            cores.map(function (core) {
              const percent = Math.max(0, Math.min(100, Number(core.percent) || 0));
              return h('div', { key: core.index, className: 'us-core', title: 'CPU ' + (core.index + 1) + ' · ' + percent.toFixed(0) + '%' },
                h('i', { style: { height: Math.max(3, percent) + '%' } }),
                h('span', null, String(core.index + 1))
              );
            })
          )
        ) : null,
        h(Sparkline, { history: cpu.history, t: props.t }),
        h('div', { className: 'us-muted', style: { fontSize: '10.5px' } }, cpu.sampledAt ? props.t('sampledAt', { time: formatTime(cpu.sampledAt, props.localeTag) }) : props.t('cpuUnavailable'))
      );
    }

    function ConversationDetail(props) {
      const session = props.session;
      const usage = session.usage || {};
      const cost = props.cost;
      const parts = [
        { key: 'cacheRead', value: usage.cacheRead || 0 },
        { key: 'input', value: usage.input || 0 },
        { key: 'cacheWrite', value: usage.cacheWrite || 0 },
        { key: 'output', value: usage.output || 0 }
      ].filter(function (part) { return part.value > 0; });
      const maxPart = Math.max(1, Math.max.apply(null, parts.map(function (part) { return part.value; })));
      const costParts = [
        { key: 'cacheRead', value: (usage.cacheRead || 0) * props.rates.cacheRead / 1e6 },
        { key: 'input', value: (usage.input || 0) * props.rates.input / 1e6 },
        { key: 'cacheWrite', value: (usage.cacheWrite || 0) * props.rates.cacheWrite / 1e6 },
        { key: 'output', value: (usage.output || 0) * props.rates.output / 1e6 }
      ].filter(function (part) { return part.value > 0; });
      const maxCost = Math.max(0.000001, Math.max.apply(null, costParts.map(function (part) { return part.value; })));
      const promptTokens = (usage.input || 0) + (usage.cacheRead || 0) + (usage.cacheWrite || 0);
      const hit = promptTokens > 0 ? ((usage.cacheRead || 0) / promptTokens) * 100 : 0;
      return h('div', { className: 'us-detail' },
        h('div', { className: 'us-detail-box' },
          h('h3', null, props.t('tokenBreakdown')),
          parts.map(function (part) {
            return h('div', { key: part.key, className: 'us-split-row' },
              h('span', null, props.t(part.key === 'cacheRead' ? 'cacheRead' : part.key === 'cacheWrite' ? 'cacheWrite' : part.key)),
              h('b', null, formatNumber(part.value, props.localeTag)),
              h('div', { className: 'us-split-track' }, h('i', { style: { width: (part.value / maxPart) * 100 + '%' } }))
            );
          }),
          h('div', { className: 'us-detail-meta' },
            h('div', null, h('span', null, props.t('requests')), h('b', null, formatNumber(usage.requests || 0, props.localeTag))),
            h('div', null, h('span', null, props.t('cacheHit')), h('b', null, hit.toFixed(hit >= 10 ? 0 : 1) + '%')),
            h('div', null, h('span', null, props.t('turns')), h('b', null, formatNumber(session.turns || 0, props.localeTag))),
            h('div', null, h('span', null, props.t('created')), h('b', null, formatDateTime(session.firstAt || session.createdAt, props.localeTag)))
          )
        ),
        h('div', { className: 'us-detail-box' },
          h('h3', null, props.t('costBreakdown')),
          costParts.map(function (part) {
            return h('div', { key: part.key, className: 'us-split-row' },
              h('span', null, props.t(part.key === 'cacheRead' ? 'cacheRead' : part.key === 'cacheWrite' ? 'cacheWrite' : part.key)),
              h('b', null, formatMoney(part.value, props.localeTag)),
              h('div', { className: 'us-split-track' }, h('i', { style: { width: (part.value / maxCost) * 100 + '%', background: 'var(--us-warm)' } }))
            );
          }),
          h('div', { className: 'us-detail-meta' },
            h('div', null, h('span', null, props.t('cost')), h('b', null, formatMoney(cost, props.localeTag))),
            h('div', null, h('span', null, props.t('share')), h('b', null, props.totalCost > 0 ? ((cost / props.totalCost) * 100).toFixed(1) + '% ' + props.t('ofTotal') : '—')),
            h('div', null, h('span', null, props.t('model')), h('b', { dir: 'ltr', title: session.model || '' }, session.model || '—')),
            h('div', null, h('span', null, props.t('contextWindow')), h('b', null, session.contextWindow ? formatNumber(session.contextWindow, props.localeTag) : '—')),
            h('div', { style: { gridColumn: '1 / -1' } }, h('span', null, props.t('sessionId')), h('b', { className: 'us-mono', dir: 'ltr', title: session.id }, session.id))
          )
        )
      );
    }

    function Conversations(props) {
      const [sort, setSort] = React.useState('cost');
      const [expanded, setExpanded] = React.useState(null);
      const rows = props.sessions.map(function (session) {
        return { session, cost: costOfModels(session.models, props.rates) };
      });
      rows.sort(function (a, b) {
        if (sort === 'tokens') return usageTotal(b.session.usage) - usageTotal(a.session.usage);
        if (sort === 'recent') return (b.session.lastAt || 0) - (a.session.lastAt || 0);
        return b.cost - a.cost;
      });
      const totalCost = rows.reduce(function (sum, row) { return sum + row.cost; }, 0);
      return h('section', { className: 'us-panel' },
        h('div', { className: 'us-conv-head' },
          h('div', null,
            h('h2', { style: { margin: 0, fontSize: '15px', fontWeight: 620, letterSpacing: '-.012em' } }, props.t('conversationTitle')),
            h('p', { style: { margin: '4px 0 0', fontSize: '11.8px', color: 'var(--dsw-alias-label-secondary)' } }, props.t('conversationSub', { n: rows.length }))
          ),
          h('div', { className: 'us-conv-tools' },
            h('label', { className: 'us-sr', htmlFor: 'us-sort' }, props.t('conversationTitle')),
            h('select', {
              id: 'us-sort',
              className: 'us-select',
              value: sort,
              onChange: function (event) { setSort(event.target.value); }
            },
              h('option', { value: 'cost' }, props.t('sortCost')),
              h('option', { value: 'tokens' }, props.t('sortTokens')),
              h('option', { value: 'recent' }, props.t('sortRecent'))
            )
          )
        ),
        rows.length === 0 ? h('div', { className: 'us-conv-empty' }, h('strong', null, props.t('noConversations')), props.t('noConversationsBody')) : h('div', { className: 'us-conv-table' },
          h('div', { className: 'us-conv-columns', 'aria-hidden': 'true' },
            h('span', null, props.t('conversationTitle')),
            h('span', null, props.t('tokens')),
            h('span', null, props.t('cost')),
            h('span', null, props.t('share')),
            h('span', null, '')
          ),
          rows.map(function (row) {
            const session = row.session;
            const open = expanded === session.id;
            const title = session.title || session.firstUser || props.t('untitled');
            const meta = [
              session.model || props.t('model'),
              formatNumber(session.turns || 0, props.localeTag) + ' ' + props.t('turns'),
              props.t('lastActive') + ' ' + relativeTime(session.lastAt, props.t, props.localeTag)
            ].join(' · ');
            return h('div', { key: session.id, className: 'us-conv-item' },
              h('button', {
                type: 'button',
                className: 'us-conv-row',
                'aria-expanded': open,
                onClick: function () { setExpanded(open ? null : session.id); }
              },
                h('span', { className: 'us-conv-main' },
                  h('span', { className: 'us-conv-title', title }, title),
                  h('span', { className: 'us-conv-meta' }, meta)
                ),
                h('span', { className: 'us-conv-num' }, formatNumber(usageTotal(session.usage), props.localeTag, true)),
                h('span', { className: 'us-conv-num us-conv-cost' }, formatMoney(row.cost, props.localeTag)),
                h('span', { className: 'us-conv-share' }, totalCost > 0 ? ((row.cost / totalCost) * 100).toFixed(1) + '%' : '—'),
                h('span', { className: 'us-chev ' + (open ? 'is-open' : ''), 'aria-hidden': 'true' }, h(ICONS.chevron))
              ),
              open ? h(ConversationDetail, {
                session,
                cost: row.cost,
                totalCost,
                rates: props.rates,
                t: props.t,
                localeTag: props.localeTag
              }) : null
            );
          })
        )
      );
    }

    function Settings(props) {
      const settings = props.settings;
      const [draft, setDraft] = React.useState(settings);
      const [saved, setSaved] = React.useState(false);
      const savedTimer = React.useRef(null);
      React.useEffect(function () {
        return function () {
          if (savedTimer.current) window.clearTimeout(savedTimer.current);
        };
      }, []);
      React.useEffect(function () { setDraft(settings); }, [settings.budget, settings.rates.input, settings.rates.cacheRead, settings.rates.cacheWrite, settings.rates.output]);
      function update(patch) {
        const next = { budget: draft.budget, rates: { ...draft.rates }, ...patch };
        if (patch.rates) next.rates = { ...draft.rates, ...patch.rates };
        setDraft(next);
        props.onChange(next);
        setSaved(true);
        if (savedTimer.current) window.clearTimeout(savedTimer.current);
        savedTimer.current = window.setTimeout(function () { setSaved(false); }, 1600);
      }
      function rateField(key) {
        return h('label', { className: 'us-field' },
          h('span', null, props.t(key === 'input' ? 'rateInput' : key === 'cacheRead' ? 'rateCache' : key === 'cacheWrite' ? 'rateCacheWrite' : 'rateOutput')),
          h('input', {
            type: 'number',
            min: '0',
            step: '0.001',
            inputMode: 'decimal',
            value: draft.rates[key],
            onChange: function (event) {
              const value = parseFloat(event.target.value);
              update({ rates: { [key]: Number.isFinite(value) && value >= 0 ? value : 0 } });
            }
          })
        );
      }
      return h('details', { className: 'us-settings' },
        h('summary', null,
          h('span', null, props.t('settings')),
          h('span', { className: 'us-saved' }, saved ? props.t('settingsSaved') : '')
        ),
        h('div', { className: 'us-settings-body' },
          h('p', null, props.t('settingsBody')),
          h('div', { className: 'us-fields' },
            h('label', { className: 'us-field' },
              h('span', null, props.t('budgetLabel')),
              h('input', {
                type: 'number',
                min: '0',
                step: '1',
                inputMode: 'decimal',
                value: draft.budget,
                onChange: function (event) {
                  const value = parseFloat(event.target.value);
                  update({ budget: Number.isFinite(value) && value >= 0 ? value : 0 });
                }
              })
            ),
            rateField('input'),
            rateField('cacheRead'),
            rateField('cacheWrite'),
            rateField('output')
          ),
          h('div', { className: 'us-settings-actions' },
            h('p', { style: { margin: 0 } }, props.t('ratesNote')),
            h('button', {
              type: 'button',
              className: 'us-btn is-ghost',
              onClick: function () {
                const next = { budget: DEFAULT_BUDGET, rates: { ...DEFAULT_RATES } };
                setDraft(next);
                props.onChange(next);
              }
            }, props.t('resetRates'))
          )
        )
      );
    }

    function About(props) {
      const data = props.data;
      return h('div', { className: 'us-about' },
        h('section', { className: 'us-panel' },
          h('strong', null, props.t('dataSource')),
          h('p', null, props.t('dataSourceBody')),
          h('div', { className: 'us-detail-meta', style: { borderTop: 0, paddingTop: 0, marginTop: 2 } },
            h('div', null, h('span', null, props.t('liveSessions')), h('b', null, formatNumber(data.source.live, props.localeTag))),
            h('div', null, h('span', null, props.t('stored')), h('b', null, formatNumber(data.totals.storedConversations, props.localeTag))),
            h('div', null, h('span', null, props.t('unreadable')), h('b', null, formatNumber(data.source.unreadable, props.localeTag))),
            h('div', null, h('span', null, props.t('requests')), h('b', null, formatNumber(data.totals.requests, props.localeTag)))
          )
        ),
        h('section', { className: 'us-panel' },
          h('strong', null, props.t('sampledAt', { time: formatTime(data.generatedAt, props.localeTag) })),
          h('p', null, props.t('footerNote')),
          h('p', null, props.t('ratesNote'))
        )
      );
    }

    function Dashboard(props) {
      const { data, phase, error, reload, settings, setSettings, t, localeTag, dir } = props;
      const [granularity, setGranularity] = React.useState('auto');
      const auto = data && data.totals.firstAt && data.generatedAt - data.totals.firstAt > 48 * HOUR ? 'day' : 'hour';
      const mode = granularity === 'auto' ? auto : granularity;
      const points = data ? buildSeries(data, mode) : [];
      const windowTotal = points.reduce(function (sum, point) { return sum + point.total; }, 0);
      const totalCost = data ? costOfModels(data.monthModels, settings.rates) : 0;
      const allTimeCost = data ? costOf(data.totals, settings.rates) : 0;
      const budget = Number(settings.budget) || 0;
      const budgetPct = budget > 0 ? (totalCost / budget) * 100 : 0;
      const budgetTone = budgetPct >= 100 ? 'is-over' : budgetPct >= 80 ? 'is-warn' : '';
      const usage = data ? data.totals : { input: 0, cacheRead: 0, cacheWrite: 0, output: 0, total: 0 };
      const cacheHit = usage.total > 0 ? (((usage.cacheRead || 0) / Math.max(1, (usage.input || 0) + (usage.cacheRead || 0) + (usage.cacheWrite || 0))) * 100) : 0;
      const keys = usage.cacheWrite > 0 ? ['cacheRead', 'input', 'cacheWrite', 'output'] : ['cacheRead', 'input', 'output'];
      const colors = {
        cacheRead: 'color-mix(in srgb, var(--us-accent) 42%, transparent)',
        input: 'var(--us-accent)',
        cacheWrite: 'color-mix(in srgb, var(--us-warm) 55%, transparent)',
        output: 'var(--us-warm)'
      };
      return h('div', { className: 'us-root', dir, lang: localeTag },
        h('style', null, CSS),
        h('div', { className: 'us-page' },
          h('header', { className: 'us-head' },
            h('div', { className: 'us-head-copy' },
              h('p', { className: 'us-eyebrow' }, t('eyebrow')),
              h('h1', { className: 'us-title' }, t('title')),
              h('p', { className: 'us-sub' }, t('subtitle'))
            ),
            h('div', { className: 'us-head-actions' },
              h('span', { className: 'us-live ' + (phase === 'loading' ? 'is-waiting' : '') },
                h('i', { className: 'us-live-dot' }),
                data ? t('updated', { time: formatTime(data.generatedAt, localeTag) }) : t('live')
              ),
              h('button', {
                type: 'button',
                className: 'us-btn',
                onClick: reload,
                disabled: phase === 'loading',
                title: t('refresh')
              }, h(ICONS.refresh, { className: phase === 'loading' ? 'us-spin' : '' }), t('refresh'))
            )
          ),
          error ? h('div', { className: 'us-banner', role: 'alert' },
            h(ICONS.alert, { size: 18 }),
            h('div', { className: 'us-banner-body' },
              h('strong', null, t('loadError')),
              h('span', null, t('loadErrorBody', { message: error }))
            ),
            h('button', { type: 'button', className: 'us-btn is-ghost', onClick: reload }, t('retry'))
          ) : null,
          phase === 'loading' && !data ? h('div', { className: 'us-kpis' }, [0, 1, 2, 3].map(function (key) { return h('div', { key, className: 'us-skeleton' }); })) : null,
          data ? h(React.Fragment, null,
            h('section', { className: 'us-kpis', 'aria-label': t('eyebrow') },
              h(KPI, {
                label: t('totalTokens'),
                icon: h(ICONS.chart, { size: 15 }),
                value: formatNumber(usage.total, localeTag, true),
                unit: t('tokens'),
                sub: t('totalTokensSub', { n: formatNumber(data.totals.conversations, localeTag) })
              }, h(TokenSplitBar, { usage, total: usage.total })),
              h(KPI, {
                label: t('estimatedCost'),
                icon: h(ICONS.coins, { size: 15 }),
                value: formatMoney(allTimeCost, localeTag),
                sub: t('estimatedCostSub', { amount: formatMoney(totalCost, localeTag) })
              }),
              h(KPI, {
                label: t('conversations'),
                icon: h(ICONS.chat, { size: 15 }),
                value: formatNumber(data.totals.conversations, localeTag),
                sub: t('conversationsSub', {
                  live: formatNumber(data.source.live, localeTag),
                  stored: formatNumber(data.totals.storedConversations, localeTag)
                })
              }),
              h(KPI, {
                label: t('budget'),
                icon: h(ICONS.wallet, { size: 15 }),
                value: budget > 0 ? formatMoney(totalCost, localeTag) : '—',
                unit: budget > 0 ? '/ ' + formatMoney(budget, localeTag) : '',
                sub: budget > 0
                  ? (budgetPct >= 100 ? t('budgetOver', { amount: formatMoney(totalCost - budget, localeTag) }) : t('budgetRemaining', { amount: formatMoney(budget - totalCost, localeTag) }))
                  : t('setBudget')
              }, h('div', { className: 'us-progress ' + budgetTone, role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(Math.min(100, budgetPct)), 'aria-label': t('budget') },
                h('i', { style: { width: Math.min(100, budgetPct) + '%' } })
              ))
            ),
            h('div', { className: 'us-grid' },
              h('section', { className: 'us-panel' },
                h('div', { className: 'us-panel-head' },
                  h('div', null,
                    h('h2', null, t('tokenTimeline')),
                    h('p', null, t('timelineSub', { unit: mode === 'hour' ? t('hourly') : t('daily') }) + ' ' + t('windowTotal', { tokens: formatNumber(windowTotal, localeTag) }))
                  ),
                  h('div', { className: 'us-seg', role: 'group', 'aria-label': t('tokenTimeline') },
                    h('button', { type: 'button', 'aria-pressed': mode === 'hour', onClick: function () { setGranularity('hour'); } }, t('hourly')),
                    h('button', { type: 'button', 'aria-pressed': mode === 'day', onClick: function () { setGranularity('day'); } }, t('daily'))
                  )
                ),
                h(Chart, {
                  points,
                  keys,
                  colors,
                  granularity: mode,
                  windowTotal,
                  t,
                  localeTag
                })
              ),
              h(CpuPanel, { data, t, localeTag })
            ),
            h(Conversations, { sessions: data.sessions, rates: settings.rates, t, localeTag }),
            h(Settings, { settings, onChange: setSettings, t }),
            h(About, { data, t, localeTag }),
            h('footer', { className: 'us-foot' },
              h('span', null, t('footerNote')),
              h('span', null, t('monthToDate') + ': ' + formatMoney(totalCost, localeTag) + ' · ' + t('allTime') + ': ' + formatMoney(allTimeCost, localeTag) + ' · ' + t('cacheHit') + ' ' + cacheHit.toFixed(0) + '%')
            )
          ) : null
        )
      );
    }

    function App(props) {
      const locale = useSyncExternalStore(
        function (listener) { return props.ctx.locale.subscribe(listener); },
        function () { return props.ctx.locale.getSnapshot(); },
        function () { return props.ctx.locale.getSnapshot(); }
      );
      const stats = useStatsData();
      const [settings, setSettings] = React.useState(loadSettings);
      React.useEffect(function () { saveSettings(settings); }, [settings]);
      const active = locale && locale.active ? locale.active : 'en';
      const localeTag = active === 'ar' ? 'ar' : active === 'zh' ? 'zh-CN' : 'en-US';
      const dir = active === 'ar' ? 'rtl' : 'ltr';
      function t(key, vars) {
        let value = props.translate(key);
        if (value === key) value = DICT_EN[key] || key;
        if (vars) {
          for (const name of Object.keys(vars)) {
            value = value.split('{' + name + '}').join(String(vars[name]));
          }
        }
        return value;
      }
      return h(Dashboard, {
        data: stats.data,
        phase: stats.phase,
        error: stats.error,
        reload: stats.reload,
        settings,
        setSettings,
        t,
        localeTag,
        dir
      });
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(function () {
          const dictionaries = [
            ctx.locale.register(NS, 'en', DICT_EN),
            ctx.locale.register(NS, 'ar', DICT_AR),
            ctx.locale.register(NS, 'zh', DICT_ZH)
          ];
          return function () {
            for (const dispose of dictionaries) if (typeof dispose === 'function') dispose();
          };
        }, 'usage-stats: dictionaries');

        const bound = ctx.locale.bind(NS);
        function translate(key) {
          const value = bound(key);
          return value === key ? (DICT_EN[key] || key) : value;
        }

        ctx.slots.inject('sidebar.panellist', function () {
          return ctx.slots.register({
            name: 'sidebar.panellist',
            id: 'usage-stats',
            order: 24,
            label: function () { return translate('navLabel'); }
          }, StatsIcon);
        });

        ctx.slots.inject('main', function () {
          return ctx.slots.register({
            name: 'main',
            key: 'usage-stats'
          }, function UsageStatsPage() {
            return h(App, { ctx, translate });
          });
        });
      }
    };
  }
});
