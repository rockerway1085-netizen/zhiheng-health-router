export type AssessmentRoute = "overall" | "specialty";

export type SpecialtyId = "sleep" | "fatigue" | "pain" | "mood" | "function";

export type AnswerOption = {
  label: string;
  value: number;
};

export type AssessmentQuestion = {
  id: string;
  domain: SpecialtyId;
  prompt: string;
  helper: string;
  options: AnswerOption[];
};

export type Specialty = {
  id: SpecialtyId;
  name: string;
  shortName: string;
  description: string;
  canAnswer: string;
  questionCount: number;
  questions: AssessmentQuestion[];
};

export type ModelRecord = {
  id: string;
  name: string;
  provider: string;
  role: string;
  population: string;
  version: string;
  items: string;
  language: string;
  license: "开放候选" | "待授权" | "需注册";
  evidence: "已核查" | "核查中";
  release: "生产阻塞" | "研究候选" | "框架可用";
  blocker: string;
};

const IMPACT_OPTIONS: AnswerOption[] = [
  { label: "完全没有", value: 0 },
  { label: "有一点", value: 1 },
  { label: "比较明显", value: 2 },
  { label: "影响很大", value: 3 },
];

const FREQUENCY_OPTIONS: AnswerOption[] = [
  { label: "从不", value: 0 },
  { label: "偶尔", value: 1 },
  { label: "经常", value: 2 },
  { label: "几乎每天", value: 3 },
];

export const DOMAIN_META: Record<
  SpecialtyId,
  { name: string; short: string; color: string }
> = {
  sleep: { name: "睡眠", short: "入睡、夜醒与恢复感", color: "#5d6fb7" },
  fatigue: { name: "精力", short: "疲劳、恢复与日常耐力", color: "#c4813b" },
  pain: { name: "疼痛", short: "不适程度与活动干扰", color: "#bb5f65" },
  mood: { name: "情绪", short: "情绪体验与生活影响", color: "#8d68a8" },
  function: { name: "活动能力", short: "移动、工作与独立生活", color: "#3a8b78" },
};

export const OVERALL_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "overall-function",
    domain: "function",
    prompt: "最近两周，身体状态对走动、工作或日常活动有多大影响？",
    helper: "按实际感受回答，不需要推测原因。",
    options: IMPACT_OPTIONS,
  },
  {
    id: "overall-fatigue",
    domain: "fatigue",
    prompt: "最近两周，精力不足或疲劳对日常生活有多大影响？",
    helper: "请考虑工作、家务、学习和休息后的恢复感。",
    options: IMPACT_OPTIONS,
  },
  {
    id: "overall-sleep",
    domain: "sleep",
    prompt: "最近两周，睡眠问题对第二天的状态有多大影响？",
    helper: "包括难入睡、夜醒、早醒或睡醒后仍不恢复。",
    options: IMPACT_OPTIONS,
  },
  {
    id: "overall-mood",
    domain: "mood",
    prompt: "最近两周，情绪困扰对生活、工作或专注有多大影响？",
    helper: "只描述影响程度，不等同于疾病诊断。",
    options: IMPACT_OPTIONS,
  },
  {
    id: "overall-pain",
    domain: "pain",
    prompt: "最近两周，疼痛或身体不适对活动和休息有多大影响？",
    helper: "请按最接近你整体情况的选项回答。",
    options: IMPACT_OPTIONS,
  },
];

const SPECIALTY_QUESTIONS: Record<SpecialtyId, AssessmentQuestion[]> = {
  sleep: [
    { id: "sleep-1", domain: "sleep", prompt: "最近两周，你有多频繁难以入睡？", helper: "以通常的晚上为准。", options: FREQUENCY_OPTIONS },
    { id: "sleep-2", domain: "sleep", prompt: "最近两周，你有多频繁在夜间醒来后难以再次入睡？", helper: "不包括短暂醒来后很快入睡。", options: FREQUENCY_OPTIONS },
    { id: "sleep-3", domain: "sleep", prompt: "最近两周，你有多频繁在睡醒后仍觉得没有恢复？", helper: "考虑起床后的精神和身体感受。", options: FREQUENCY_OPTIONS },
    { id: "sleep-4", domain: "sleep", prompt: "睡眠问题对你白天的工作、学习或活动有多大影响？", helper: "按整体影响程度回答。", options: IMPACT_OPTIONS },
  ],
  fatigue: [
    { id: "fatigue-1", domain: "fatigue", prompt: "最近两周，你有多频繁感到精力不足？", helper: "包括即使休息后仍缺乏精力。", options: FREQUENCY_OPTIONS },
    { id: "fatigue-2", domain: "fatigue", prompt: "最近两周，你有多频繁因为疲劳而减少原本想做的事？", helper: "考虑工作、家务、运动和社交。", options: FREQUENCY_OPTIONS },
    { id: "fatigue-3", domain: "fatigue", prompt: "疲劳对你维持注意力有多大影响？", helper: "按通常情况回答。", options: IMPACT_OPTIONS },
    { id: "fatigue-4", domain: "fatigue", prompt: "疲劳对完成日常任务有多大影响？", helper: "选择最接近的整体程度。", options: IMPACT_OPTIONS },
  ],
  pain: [
    { id: "pain-1", domain: "pain", prompt: "最近两周，你有多频繁受到疼痛或不适困扰？", helper: "不需要判断疼痛原因。", options: FREQUENCY_OPTIONS },
    { id: "pain-2", domain: "pain", prompt: "疼痛对走动或身体活动有多大影响？", helper: "按大多数时候的情况回答。", options: IMPACT_OPTIONS },
    { id: "pain-3", domain: "pain", prompt: "疼痛对睡眠和休息有多大影响？", helper: "包括难入睡或因疼痛醒来。", options: IMPACT_OPTIONS },
    { id: "pain-4", domain: "pain", prompt: "疼痛对工作、家务或学习有多大影响？", helper: "选择最接近的整体程度。", options: IMPACT_OPTIONS },
  ],
  mood: [
    { id: "mood-1", domain: "mood", prompt: "最近两周，你有多频繁感到情绪低落或提不起兴趣？", helper: "按通常情况回答。", options: FREQUENCY_OPTIONS },
    { id: "mood-2", domain: "mood", prompt: "最近两周，你有多频繁感到紧张、担心或难以放松？", helper: "不需要给感受贴上诊断标签。", options: FREQUENCY_OPTIONS },
    { id: "mood-3", domain: "mood", prompt: "情绪状态对你的专注或做决定有多大影响？", helper: "按整体影响程度回答。", options: IMPACT_OPTIONS },
    { id: "mood-4", domain: "mood", prompt: "情绪状态对工作、学习或与人相处有多大影响？", helper: "选择最接近的整体程度。", options: IMPACT_OPTIONS },
  ],
  function: [
    { id: "function-1", domain: "function", prompt: "最近两周，走路、上下楼或外出对你有多困难？", helper: "按通常情况下的困难程度回答。", options: IMPACT_OPTIONS },
    { id: "function-2", domain: "function", prompt: "完成家务、工作或学习任务对你有多困难？", helper: "包括需要中断、放慢或寻求帮助。", options: IMPACT_OPTIONS },
    { id: "function-3", domain: "function", prompt: "照顾自己或独立处理日常事务对你有多困难？", helper: "按整体情况回答。", options: IMPACT_OPTIONS },
    { id: "function-4", domain: "function", prompt: "身体状态对参与重要活动有多大影响？", helper: "包括家庭、工作和社交活动。", options: IMPACT_OPTIONS },
  ],
};

export const SPECIALTIES: Specialty[] = [
  {
    id: "sleep",
    name: "睡眠评估",
    shortName: "睡眠",
    description: "了解入睡、夜间醒来、恢复感及白天影响。",
    canAnswer: "描述近期睡眠困扰的形式和日常影响。",
    questionCount: SPECIALTY_QUESTIONS.sleep.length,
    questions: SPECIALTY_QUESTIONS.sleep,
  },
  {
    id: "fatigue",
    name: "疲劳与精力评估",
    shortName: "疲劳与精力",
    description: "了解精力不足、恢复感以及任务受影响的程度。",
    canAnswer: "描述近期疲劳对生活的影响。",
    questionCount: SPECIALTY_QUESTIONS.fatigue.length,
    questions: SPECIALTY_QUESTIONS.fatigue,
  },
  {
    id: "pain",
    name: "疼痛影响评估",
    shortName: "疼痛",
    description: "了解疼痛或不适对活动、休息和工作的影响。",
    canAnswer: "描述疼痛干扰生活的程度。",
    questionCount: SPECIALTY_QUESTIONS.pain.length,
    questions: SPECIALTY_QUESTIONS.pain,
  },
  {
    id: "mood",
    name: "情绪状态评估",
    shortName: "情绪状态",
    description: "了解近期情绪体验对专注、工作和相处的影响。",
    canAnswer: "描述近期情绪困扰及其影响。",
    questionCount: SPECIALTY_QUESTIONS.mood.length,
    questions: SPECIALTY_QUESTIONS.mood,
  },
  {
    id: "function",
    name: "活动能力评估",
    shortName: "活动能力",
    description: "了解移动、自我照顾和完成日常事务的困难。",
    canAnswer: "描述身体状态对独立生活的影响。",
    questionCount: SPECIALTY_QUESTIONS.function.length,
    questions: SPECIALTY_QUESTIONS.function,
  },
];

export const MODEL_RECORDS: ModelRecord[] = [
  {
    id: "cdc-hra",
    name: "CDC Patient-Centered HRA Framework",
    provider: "U.S. Centers for Disease Control and Prevention",
    role: "整体评估架构",
    population: "成人",
    version: "2014 framework",
    items: "框架，不产生单一总分",
    language: "英文原版",
    license: "开放候选",
    evidence: "已核查",
    release: "框架可用",
    blocker: "仅作为问题域和流程框架，不作为量表。",
  },
  {
    id: "rand-36",
    name: "RAND-36 Health Survey 1.0",
    provider: "RAND Corporation",
    role: "成人整体健康画像",
    population: "18 岁及以上成人",
    version: "1.0",
    items: "36 题 / 8 个领域",
    language: "简体中文待验证",
    license: "开放候选",
    evidence: "已核查",
    release: "生产阻塞",
    blocker: "正式中文来源、翻译权与跨文化验证尚未完成。",
  },
  {
    id: "cdc-hrqol",
    name: "CDC HRQOL-14",
    provider: "U.S. CDC",
    role: "健康相关生活质量追踪",
    population: "成人",
    version: "14-item set",
    items: "14 题",
    language: "中文版本待核查",
    license: "开放候选",
    evidence: "已核查",
    release: "研究候选",
    blocker: "适合作为后续追踪候选，不替代整体主模型。",
  },
  {
    id: "promis-29",
    name: "PROMIS-29 Profile",
    provider: "HealthMeasures",
    role: "多领域健康画像",
    population: "成人",
    version: "Profile v2.1",
    items: "29 题",
    language: "需申请正式中文版本",
    license: "待授权",
    evidence: "核查中",
    release: "生产阻塞",
    blocker: "商业数字化实施、计分服务和译本权限待确认。",
  },
  {
    id: "whoqol-bref",
    name: "WHOQOL-BREF",
    provider: "World Health Organization",
    role: "生活质量",
    population: "成人",
    version: "BREF",
    items: "26 题",
    language: "中文版本需核权",
    license: "需注册",
    evidence: "核查中",
    release: "生产阻塞",
    blocker: "数字化商业使用、翻译版本与呈现要求待书面确认。",
  },
  {
    id: "whodas",
    name: "WHODAS 2.0",
    provider: "World Health Organization",
    role: "功能与残疾",
    population: "成人",
    version: "12 / 36 item",
    items: "12 或 36 题",
    language: "中文版本需核权",
    license: "需注册",
    evidence: "核查中",
    release: "生产阻塞",
    blocker: "使用许可、正式译本与电子施测范围待确认。",
  },
];

export const ROUTING_RULES = [
  { id: "route-001", name: "整体入口使用唯一主模型", condition: "入口 = 整体评估", action: "调用已发布的成人整体画像", priority: 20, enabled: true },
  { id: "route-014", name: "明确睡眠需求直达专项", condition: "入口 = 专项且目标 = 睡眠", action: "跳过整体画像，进入睡眠模块", priority: 30, enabled: true },
  { id: "route-026", name: "整体结果递进一个专项", condition: "存在单一最高领域信号", action: "请求用户确认后推荐一个专项", priority: 40, enabled: true },
  { id: "route-900", name: "安全状态覆盖普通流程", condition: "安全门命中已验证红旗", action: "停止问卷并显示固定行动指引", priority: 100, enabled: true },
];

export const SAFETY_RULES = [
  { id: "safe-001", name: "急性危急状态拦截", level: "立即处理", version: "v0.8 草案", owner: "医学安全负责人", status: "待双人审核", tests: "18 / 24" },
  { id: "safe-006", name: "迅速加重情况拦截", level: "当日处理", version: "v0.4 草案", owner: "医学安全负责人", status: "测试中", tests: "11 / 18" },
  { id: "safe-012", name: "信息不足安全降级", level: "补充信息", version: "v1.0", owner: "质量负责人", status: "演示已发布", tests: "12 / 12" },
];

export const REPORT_TEMPLATES = [
  { id: "result-user", name: "用户简版结果", channel: "用户端", version: "v1.3", status: "演示已发布", description: "把领域结果转为人话结论、限制和一个主要下一步。" },
  { id: "care-summary", name: "就医沟通摘要", channel: "下载 / 打印", version: "v0.7", status: "待医学审核", description: "整理自报事实、时间线和希望向专业人员确认的问题。" },
  { id: "ai-prompt", name: "AI 解读提示词", channel: "复制文本", version: "v1.1", status: "测试中", description: "要求 AI 区分事实、推断和未知，不改变安全等级。" },
];

export const DEMO_SESSIONS = [
  { id: "S-4F29A", route: "整体评估", module: "交互演示", signal: "睡眠关注", next: "接受专项", duration: "4m 12s", status: "已完成" },
  { id: "S-81BCD", route: "专项评估", module: "疲劳演示", signal: "影响明显", next: "结束", duration: "2m 41s", status: "已完成" },
  { id: "S-A103E", route: "整体评估", module: "交互演示", signal: "信息不足", next: "未选择", duration: "1m 18s", status: "已退出" },
  { id: "S-93C70", route: "专项评估", module: "疼痛演示", signal: "安全中断", next: "固定行动指引", duration: "0m 33s", status: "已拦截" },
  { id: "S-DA211", route: "整体评估", module: "交互演示", signal: "无明显信号", next: "结束", duration: "3m 54s", status: "已完成" },
];
