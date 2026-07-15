export type AssessmentRoute = "overall" | "specialty";

export type SpecialtyId =
  | "sleep"
  | "fatigue"
  | "pain"
  | "anxiety"
  | "depression"
  | "function";

export type AnswerOption = {
  label: string;
  value: number;
};

export type CareUrgency = "immediate" | "today" | "appointment" | "self-care" | "undetermined";

export type AssessmentQuestion = {
  id: string;
  domain: SpecialtyId;
  dimension: string;
  dimensionLabel: string;
  section: "screening" | "core" | "supplemental" | "safety";
  sectionLabel: string;
  prompt: string;
  helper: string;
  timeframe?: string;
  options: AnswerOption[];
  scored?: boolean;
  weight?: number;
  showWhen?: {
    questionId: string;
    atOrAbove?: number;
    equals?: number;
  };
  safetyRule?: {
    atOrAbove: number;
    urgency: "immediate" | "today";
    action: string;
  };
};

export type InstrumentSpec = {
  instrumentId: string;
  modelName: string;
  modelVersion: string;
  language: string;
  recallPeriod: string;
  coreItems: number;
  delivery: string;
  scoring: string;
  sourceUrl: string;
  assetStatus: "model-informed" | "official-open" | "permission-required";
  validityNote: string;
};

export type Specialty = {
  id: SpecialtyId;
  name: string;
  shortName: string;
  description: string;
  canAnswer: string;
  estimatedMinutes: string;
  questionCount: number;
  questions: AssessmentQuestion[];
  instrument: InstrumentSpec;
  relatedSpecialtyId: SpecialtyId;
  relatedReason: string;
  canExplain: string;
  cannotExplain: string;
  observationPlan: string;
};

const FREQUENCY_5: AnswerOption[] = [
  { label: "从不", value: 0 },
  { label: "很少", value: 1 },
  { label: "有时", value: 2 },
  { label: "经常", value: 3 },
  { label: "总是", value: 4 },
];

const IMPACT_5: AnswerOption[] = [
  { label: "完全没有", value: 0 },
  { label: "轻微", value: 1 },
  { label: "中等", value: 2 },
  { label: "明显", value: 3 },
  { label: "非常严重", value: 4 },
];

const DIFFICULTY_5: AnswerOption[] = [
  { label: "没有困难", value: 0 },
  { label: "轻度困难", value: 1 },
  { label: "中度困难", value: 2 },
  { label: "重度困难", value: 3 },
  { label: "极度困难或无法完成", value: 4 },
];

const QUALITY_5: AnswerOption[] = [
  { label: "很好", value: 0 },
  { label: "较好", value: 1 },
  { label: "一般", value: 2 },
  { label: "较差", value: 3 },
  { label: "很差", value: 4 },
];

const DURATION_OPTIONS: AnswerOption[] = [
  { label: "不到 1 周", value: 0 },
  { label: "1–2 周", value: 1 },
  { label: "3–4 周", value: 2 },
  { label: "1–3 个月", value: 3 },
  { label: "超过 3 个月", value: 4 },
];

const CHANGE_OPTIONS: AnswerOption[] = [
  { label: "正在改善", value: 0 },
  { label: "基本不变", value: 1 },
  { label: "缓慢加重", value: 2 },
  { label: "近期明显加重", value: 3 },
  { label: "突然出现或迅速加重", value: 4 },
];

const SAFETY_OPTIONS: AnswerOption[] = [
  { label: "没有", value: 0 },
  { label: "出现过，但目前能够保证安全", value: 1 },
  { label: "有具体想法或担心自己无法保证安全", value: 2 },
  { label: "目前就处于不安全状态", value: 3 },
];

function item(
  id: string,
  domain: SpecialtyId,
  dimension: string,
  dimensionLabel: string,
  section: AssessmentQuestion["section"],
  sectionLabel: string,
  prompt: string,
  helper: string,
  options: AnswerOption[] = IMPACT_5,
  extra: Partial<AssessmentQuestion> = {},
): AssessmentQuestion {
  return {
    id,
    domain,
    dimension,
    dimensionLabel,
    section,
    sectionLabel,
    prompt,
    helper,
    options,
    ...extra,
  };
}

export const DOMAIN_META: Record<SpecialtyId, { name: string; short: string; color: string }> = {
  sleep: { name: "睡眠", short: "入睡、夜醒与恢复感", color: "#596dac" },
  fatigue: { name: "疲劳", short: "精力、恢复与日常耐力", color: "#b87331" },
  pain: { name: "疼痛", short: "强度与生活干扰", color: "#b5545d" },
  anxiety: { name: "焦虑", short: "担心、紧张与生活影响", color: "#8665a2" },
  depression: { name: "抑郁情绪", short: "低落、兴趣与生活影响", color: "#6d659f" },
  function: { name: "活动能力", short: "移动、自理与社会参与", color: "#347e6d" },
};

export const OVERALL_INSTRUMENT: InstrumentSpec = {
  instrumentId: "overall-promis29-architecture-v1",
  modelName: "PROMIS-29 Profile 领域架构 + CDC HRA 路由",
  modelVersion: "产品原型 v1（29 题）",
  language: "原创简体中文结构题",
  recallPeriod: "过去 7 天",
  coreItems: 29,
  delivery: "固定 29 题健康画像；结果后最多推荐一个专项",
  scoring: "按七个构念分别形成 0–100 影响指数；不冒充 PROMIS T 分",
  sourceUrl: "https://www.healthmeasures.net/explore-measurement-systems/promis",
  assetStatus: "model-informed",
  validityNote: "采用 PROMIS-29 的七领域与题量结构，但不是官方中文 PROMIS-29；正式 T 分需接入获许可的中文题项和计分表。",
};

export const OVERALL_QUESTIONS: AssessmentQuestion[] = [
  item("overall-function-1", "function", "physical-function", "身体功能", "core", "身体功能 · 4 题", "完成中等强度的日常活动对你有多困难？", "例如连续步行、较长时间站立或处理家务。", DIFFICULTY_5),
  item("overall-function-2", "function", "physical-function", "身体功能", "core", "身体功能 · 4 题", "上下几层楼或走上坡路对你有多困难？", "按通常情况下、不依赖他人额外帮助时回答。", DIFFICULTY_5),
  item("overall-function-3", "function", "physical-function", "身体功能", "core", "身体功能 · 4 题", "搬动日常物品或提购物袋对你有多困难？", "考虑力量、耐力和动作受限。", DIFFICULTY_5),
  item("overall-function-4", "function", "physical-function", "身体功能", "core", "身体功能 · 4 题", "完成洗漱、穿衣或准备简单餐食对你有多困难？", "选择最接近你过去 7 天通常情况的一项。", DIFFICULTY_5),

  item("overall-anxiety-1", "anxiety", "anxiety", "焦虑", "core", "焦虑 · 4 题", "过去 7 天，你有多频繁感到紧张或难以放松？", "只描述体验频率，不需要判断原因。", FREQUENCY_5),
  item("overall-anxiety-2", "anxiety", "anxiety", "焦虑", "core", "焦虑 · 4 题", "过去 7 天，你有多频繁难以停止担心？", "包括反复想着可能发生的不利情况。", FREQUENCY_5),
  item("overall-anxiety-3", "anxiety", "anxiety", "焦虑", "core", "焦虑 · 4 题", "过去 7 天，你有多频繁因为担心而难以集中注意力？", "按实际影响回答。", FREQUENCY_5),
  item("overall-anxiety-4", "anxiety", "anxiety", "焦虑", "core", "焦虑 · 4 题", "过去 7 天，紧张或担心对日常生活造成了多大影响？", "考虑工作、学习、休息和与人相处。", IMPACT_5),

  item("overall-depression-1", "depression", "depression", "抑郁情绪", "core", "抑郁情绪 · 4 题", "过去 7 天，你有多频繁感到情绪低落？", "按通常体验回答。", FREQUENCY_5),
  item("overall-depression-2", "depression", "depression", "抑郁情绪", "core", "抑郁情绪 · 4 题", "过去 7 天，你有多频繁对平常在意的事情失去兴趣？", "包括原本愿意做的日常活动。", FREQUENCY_5),
  item("overall-depression-3", "depression", "depression", "抑郁情绪", "core", "抑郁情绪 · 4 题", "过去 7 天，你有多频繁觉得难以对未来抱有期待？", "选择最接近整体情况的一项。", FREQUENCY_5),
  item("overall-depression-4", "depression", "depression", "抑郁情绪", "core", "抑郁情绪 · 4 题", "过去 7 天，低落或兴趣下降对日常生活造成了多大影响？", "考虑专注、行动和与人相处。", IMPACT_5),

  item("overall-fatigue-1", "fatigue", "fatigue", "疲劳", "core", "疲劳 · 4 题", "过去 7 天，你有多频繁感到身体或精神疲惫？", "包括休息后仍存在的疲惫。", FREQUENCY_5),
  item("overall-fatigue-2", "fatigue", "fatigue", "疲劳", "core", "疲劳 · 4 题", "过去 7 天，你有多频繁需要强迫自己才能开始做事？", "考虑工作、家务、学习和社交。", FREQUENCY_5),
  item("overall-fatigue-3", "fatigue", "fatigue", "疲劳", "core", "疲劳 · 4 题", "过去 7 天，疲劳对你的注意力造成了多大影响？", "按日常实际表现回答。", IMPACT_5),
  item("overall-fatigue-4", "fatigue", "fatigue", "疲劳", "core", "疲劳 · 4 题", "过去 7 天，疲劳对完成日常任务造成了多大影响？", "选择最接近整体影响的一项。", IMPACT_5),

  item("overall-sleep-1", "sleep", "sleep-disturbance", "睡眠困扰", "core", "睡眠 · 4 题", "过去 7 天，你的整体睡眠质量如何？", "综合考虑入睡、夜醒和醒来后的恢复感。", QUALITY_5),
  item("overall-sleep-2", "sleep", "sleep-disturbance", "睡眠困扰", "core", "睡眠 · 4 题", "过去 7 天，你有多频繁难以入睡或夜间醒后难以再次入睡？", "以通常的晚上为准。", FREQUENCY_5),
  item("overall-sleep-3", "sleep", "sleep-disturbance", "睡眠困扰", "core", "睡眠 · 4 题", "过去 7 天，你有多频繁在醒来后仍觉得没有恢复？", "考虑早晨最初一段时间的状态。", FREQUENCY_5),
  item("overall-sleep-4", "sleep", "sleep-disturbance", "睡眠困扰", "core", "睡眠 · 4 题", "过去 7 天，睡眠问题对白天状态造成了多大影响？", "包括困倦、专注、情绪和活动能力。", IMPACT_5),

  item("overall-social-1", "function", "social-role", "社会角色", "core", "社会角色 · 4 题", "过去 7 天，你在履行家庭责任时受到多大限制？", "考虑照顾家人、家务和共同安排。", IMPACT_5),
  item("overall-social-2", "function", "social-role", "社会角色", "core", "社会角色 · 4 题", "过去 7 天，你在完成工作或学习责任时受到多大限制？", "按应当完成但实际受限的程度回答。", IMPACT_5),
  item("overall-social-3", "function", "social-role", "社会角色", "core", "社会角色 · 4 题", "过去 7 天，你参与社交或重要活动时受到多大限制？", "包括与亲友相处和个人重要活动。", IMPACT_5),
  item("overall-social-4", "function", "social-role", "社会角色", "core", "社会角色 · 4 题", "过去 7 天，健康状态对你享受生活造成了多大影响？", "选择最接近整体情况的一项。", IMPACT_5),

  item("overall-pain-1", "pain", "pain-interference", "疼痛干扰", "core", "疼痛 · 5 题", "过去 7 天，你最明显的疼痛或身体不适达到什么程度？", "如果有多个部位，按最困扰你的一个回答。", IMPACT_5),
  item("overall-pain-2", "pain", "pain-interference", "疼痛干扰", "core", "疼痛 · 5 题", "过去 7 天，疼痛对日常活动造成了多大影响？", "考虑走动、家务和基本任务。", IMPACT_5),
  item("overall-pain-3", "pain", "pain-interference", "疼痛干扰", "core", "疼痛 · 5 题", "过去 7 天，疼痛对工作或学习造成了多大影响？", "按通常情况回答。", IMPACT_5),
  item("overall-pain-4", "pain", "pain-interference", "疼痛干扰", "core", "疼痛 · 5 题", "过去 7 天，疼痛对睡眠或休息造成了多大影响？", "包括入睡、夜醒和恢复感。", IMPACT_5),
  item("overall-pain-5", "pain", "pain-interference", "疼痛干扰", "core", "疼痛 · 5 题", "过去 7 天，疼痛对社交或享受生活造成了多大影响？", "选择最接近整体影响的一项。", IMPACT_5),
];

const SPECIALTY_QUESTIONS: Record<SpecialtyId, AssessmentQuestion[]> = {
  sleep: [
    item("sleep-duration", "sleep", "sleep-context", "睡眠背景", "screening", "适用性与背景 · 2 题", "目前这类睡眠困扰持续了多久？", "这项信息用于安排下一步，不计入核心影响分。", DURATION_OPTIONS, { scored: false }),
    item("sleep-change", "sleep", "sleep-context", "睡眠背景", "screening", "适用性与背景 · 2 题", "最近一周，睡眠问题总体如何变化？", "突然出现或迅速加重会单独影响行动建议。", CHANGE_OPTIONS, { scored: false, safetyRule: { atOrAbove: 4, urgency: "today", action: "睡眠状态突然明显变化，建议今天联系专业人员进一步判断。" } }),
    item("sleep-core-1", "sleep", "sleep-disturbance", "睡眠困扰", "core", "核心模型 · 8 题", "过去 7 天，你的整体睡眠质量如何？", "综合考虑入睡、夜醒、早醒和恢复感。", QUALITY_5),
    item("sleep-core-2", "sleep", "sleep-disturbance", "睡眠困扰", "core", "核心模型 · 8 题", "过去 7 天，你有多频繁难以在计划时间入睡？", "以大多数晚上为准。", FREQUENCY_5),
    item("sleep-core-3", "sleep", "sleep-disturbance", "睡眠困扰", "core", "核心模型 · 8 题", "过去 7 天，你有多频繁在夜间醒来后难以再次入睡？", "不包括短暂醒来后很快恢复睡眠。", FREQUENCY_5),
    item("sleep-core-4", "sleep", "sleep-disturbance", "睡眠困扰", "core", "核心模型 · 8 题", "过去 7 天，你有多频繁比计划时间更早醒来且无法再睡？", "按真实发生情况回答。", FREQUENCY_5),
    item("sleep-core-5", "sleep", "sleep-disturbance", "睡眠困扰", "core", "核心模型 · 8 题", "过去 7 天，你有多频繁觉得睡眠时间不够？", "不需要判断具体需要多少小时。", FREQUENCY_5),
    item("sleep-core-6", "sleep", "sleep-disturbance", "睡眠困扰", "core", "核心模型 · 8 题", "过去 7 天，你有多频繁对自己的睡眠感到不满意？", "考虑睡眠是否符合你的需要。", FREQUENCY_5),
    item("sleep-core-7", "sleep", "sleep-disturbance", "睡眠困扰", "core", "核心模型 · 8 题", "过去 7 天，你有多频繁在醒来后仍觉得没有恢复？", "考虑身体和精神状态。", FREQUENCY_5),
    item("sleep-core-8", "sleep", "sleep-disturbance", "睡眠困扰", "core", "核心模型 · 8 题", "过去 7 天，你有多频繁担心接下来一晚能否睡好？", "只描述频率，不推断病因。", FREQUENCY_5),
    item("sleep-impact-1", "sleep", "sleep-impact", "白天影响", "supplemental", "白天影响 · 3 题", "睡眠问题对白天保持清醒造成了多大影响？", "这项用于行动计划，不进入核心模型分。", IMPACT_5, { scored: false }),
    item("sleep-impact-2", "sleep", "sleep-impact", "白天影响", "supplemental", "白天影响 · 3 题", "睡眠问题对白天专注或做决定造成了多大影响？", "按工作、学习或日常事务中的表现回答。", IMPACT_5, { scored: false }),
    item("sleep-impact-3", "sleep", "sleep-impact", "白天影响", "supplemental", "白天影响 · 3 题", "睡眠问题对白天工作、学习或照顾家人造成了多大影响？", "选择最接近整体影响的一项。", IMPACT_5, { scored: false }),
    item("sleep-safety-driving", "sleep", "sleep-safety", "安全追问", "safety", "根据回答追加 · 安全题", "你是否曾因为困倦而在驾驶、骑行或操作设备时差点发生危险？", "如果目前存在安全风险，请暂停相关活动并优先寻求帮助。", IMPACT_5, { scored: false, showWhen: { questionId: "sleep-impact-1", atOrAbove: 3 }, safetyRule: { atOrAbove: 2, urgency: "today", action: "白天困倦已经影响到交通或设备操作安全，今天不要继续相关活动，并联系专业人员评估。" } }),
  ],
  fatigue: [
    item("fatigue-duration", "fatigue", "fatigue-context", "疲劳背景", "screening", "适用性与背景 · 2 题", "目前这类疲劳或精力下降持续了多久？", "用于判断是否需要进一步补充信息，不计入核心模型分。", DURATION_OPTIONS, { scored: false }),
    item("fatigue-change", "fatigue", "fatigue-context", "疲劳背景", "screening", "适用性与背景 · 2 题", "最近一周，疲劳总体如何变化？", "突然或迅速加重会单独影响行动建议。", CHANGE_OPTIONS, { scored: false, safetyRule: { atOrAbove: 4, urgency: "today", action: "疲劳突然出现或迅速加重，建议今天联系专业人员进一步判断。" } }),
    item("fatigue-core-1", "fatigue", "fatigue-experience", "疲劳体验", "core", "核心模型 · 8 题", "过去 7 天，你有多频繁感到身体疲惫？", "按通常体验回答。", FREQUENCY_5),
    item("fatigue-core-2", "fatigue", "fatigue-experience", "疲劳体验", "core", "核心模型 · 8 题", "过去 7 天，你有多频繁感到精神精力不足？", "包括难以保持清醒或投入。", FREQUENCY_5),
    item("fatigue-core-3", "fatigue", "fatigue-experience", "疲劳体验", "core", "核心模型 · 8 题", "过去 7 天，你有多频繁在休息后仍难以恢复？", "以你认为已经休息过的情况为准。", FREQUENCY_5),
    item("fatigue-core-4", "fatigue", "fatigue-experience", "疲劳体验", "core", "核心模型 · 8 题", "过去 7 天，你有多频繁需要强迫自己才能开始做事？", "包括家务、工作、学习或社交。", FREQUENCY_5),
    item("fatigue-core-5", "fatigue", "fatigue-interference", "疲劳干扰", "core", "核心模型 · 8 题", "疲劳对完成日常任务造成了多大影响？", "考虑速度、持续时间和是否需要中断。", IMPACT_5),
    item("fatigue-core-6", "fatigue", "fatigue-interference", "疲劳干扰", "core", "核心模型 · 8 题", "疲劳对集中注意力造成了多大影响？", "按真实表现回答。", IMPACT_5),
    item("fatigue-core-7", "fatigue", "fatigue-interference", "疲劳干扰", "core", "核心模型 · 8 题", "疲劳对参加社交或个人重要活动造成了多大影响？", "包括减少或取消活动。", IMPACT_5),
    item("fatigue-core-8", "fatigue", "fatigue-interference", "疲劳干扰", "core", "核心模型 · 8 题", "疲劳对身体活动造成了多大影响？", "考虑走动、运动和耐力。", IMPACT_5),
    item("fatigue-supp-1", "fatigue", "fatigue-pattern", "时间模式", "supplemental", "行动信息 · 4 题", "一天中哪个时段的疲劳通常最明显？", "用于整理模式，不计入核心模型分。", [{ label: "没有固定时段", value: 0 }, { label: "起床后", value: 1 }, { label: "上午", value: 2 }, { label: "下午", value: 3 }, { label: "晚上", value: 4 }], { scored: false }),
    item("fatigue-supp-2", "fatigue", "fatigue-pattern", "恢复模式", "supplemental", "行动信息 · 4 题", "正常休息或睡一晚后，疲劳通常能改善多少？", "用于区分恢复模式。", [{ label: "基本恢复", value: 0 }, { label: "改善很多", value: 1 }, { label: "改善一些", value: 2 }, { label: "几乎不改善", value: 3 }, { label: "反而更差", value: 4 }], { scored: false }),
    item("fatigue-supp-3", "fatigue", "fatigue-impact", "现实影响", "supplemental", "行动信息 · 4 题", "过去 7 天，你是否因为疲劳减少了原本必须完成的事情？", "用于安排下一步，不计入核心模型分。", IMPACT_5, { scored: false }),
    item("fatigue-supp-4", "fatigue", "fatigue-impact", "现实影响", "supplemental", "行动信息 · 4 题", "疲劳是否已经影响基本自理或独立外出？", "明显影响基本活动时，应优先安排专业评估。", IMPACT_5, { scored: false, safetyRule: { atOrAbove: 4, urgency: "today", action: "疲劳已严重影响基本自理或独立外出，建议今天联系专业人员。" } }),
  ],
  pain: [
    item("pain-duration", "pain", "pain-context", "疼痛背景", "screening", "疼痛背景 · 3 题", "目前最困扰你的疼痛持续了多久？", "如果有多个部位，按最影响生活的一处回答。", DURATION_OPTIONS, { scored: false }),
    item("pain-change", "pain", "pain-context", "疼痛背景", "screening", "疼痛背景 · 3 题", "最近一周，这处疼痛总体如何变化？", "突然出现或迅速加重会单独影响行动建议。", CHANGE_OPTIONS, { scored: false, safetyRule: { atOrAbove: 4, urgency: "today", action: "疼痛突然出现或迅速加重，建议今天联系专业人员判断。" } }),
    item("pain-intensity", "pain", "pain-intensity", "疼痛强度", "screening", "疼痛背景 · 3 题", "过去 7 天，这处疼痛最严重时达到什么程度？", "疼痛强度与疼痛干扰分开记录。", IMPACT_5, { scored: false }),
    item("pain-core-1", "pain", "pain-interference", "疼痛干扰", "core", "核心模型 · 8 题", "疼痛对日常活动造成了多大影响？", "考虑你通常需要完成的事情。", IMPACT_5),
    item("pain-core-2", "pain", "pain-interference", "疼痛干扰", "core", "核心模型 · 8 题", "疼痛对家务或照顾他人造成了多大影响？", "按过去 7 天的实际情况回答。", IMPACT_5),
    item("pain-core-3", "pain", "pain-interference", "疼痛干扰", "core", "核心模型 · 8 题", "疼痛对工作或学习造成了多大影响？", "包括效率下降或需要中断。", IMPACT_5),
    item("pain-core-4", "pain", "pain-interference", "疼痛干扰", "core", "核心模型 · 8 题", "疼痛对走动或身体活动造成了多大影响？", "按通常活动能力回答。", IMPACT_5),
    item("pain-core-5", "pain", "pain-interference", "疼痛干扰", "core", "核心模型 · 8 题", "疼痛对参加社交活动造成了多大影响？", "包括减少、提前结束或取消活动。", IMPACT_5),
    item("pain-core-6", "pain", "pain-interference", "疼痛干扰", "core", "核心模型 · 8 题", "疼痛对休闲或个人重要活动造成了多大影响？", "考虑你原本愿意做的事情。", IMPACT_5),
    item("pain-core-7", "pain", "pain-interference", "疼痛干扰", "core", "核心模型 · 8 题", "疼痛对睡眠和休息造成了多大影响？", "包括入睡、夜醒和恢复感。", IMPACT_5),
    item("pain-core-8", "pain", "pain-interference", "疼痛干扰", "core", "核心模型 · 8 题", "疼痛对享受生活造成了多大影响？", "选择最接近整体影响的一项。", IMPACT_5),
    item("pain-supp-1", "pain", "pain-pattern", "疼痛模式", "supplemental", "行动信息 · 3 题", "疼痛是否伴随新出现的麻木、明显无力或活动失控？", "用于决定是否需要更快就医，不计入疼痛干扰分。", IMPACT_5, { scored: false, safetyRule: { atOrAbove: 3, urgency: "today", action: "疼痛伴随明显无力、麻木或活动失控，建议今天联系专业人员。" } }),
    item("pain-supp-2", "pain", "pain-pattern", "疼痛模式", "supplemental", "行动信息 · 3 题", "疼痛是否伴随胸闷、呼吸困难、意识异常或严重外伤？", "如目前正在发生，请不要继续等待网页评估。", IMPACT_5, { scored: false, safetyRule: { atOrAbove: 1, urgency: "immediate", action: "疼痛伴随可能危急的表现，请立即联系当地急救服务，不要等待网页评估完成。" } }),
    item("pain-supp-3", "pain", "pain-pattern", "疼痛模式", "supplemental", "行动信息 · 3 题", "目前你最希望解决的是哪一方面？", "用于生成后续行动。", [{ label: "了解变化趋势", value: 0 }, { label: "改善睡眠", value: 1 }, { label: "恢复活动", value: 2 }, { label: "准备就医沟通", value: 3 }, { label: "判断是否需要检查", value: 4 }], { scored: false }),
  ],
  anxiety: [
    item("anxiety-duration", "anxiety", "anxiety-context", "焦虑背景", "screening", "适用性与背景 · 2 题", "目前这类紧张、担心或难以放松持续了多久？", "用于安排下一步，不计入核心模型分。", DURATION_OPTIONS, { scored: false }),
    item("anxiety-change", "anxiety", "anxiety-context", "焦虑背景", "screening", "适用性与背景 · 2 题", "最近一周，这些体验总体如何变化？", "突然明显变化会单独影响行动建议。", CHANGE_OPTIONS, { scored: false }),
    item("anxiety-core-1", "anxiety", "anxiety-symptoms", "焦虑体验", "core", "核心模型 · 8 题", "过去 7 天，你有多频繁感到紧张或不安？", "按通常体验回答。", FREQUENCY_5),
    item("anxiety-core-2", "anxiety", "anxiety-symptoms", "焦虑体验", "core", "核心模型 · 8 题", "过去 7 天，你有多频繁难以控制担心？", "包括知道担心过多但仍停不下来。", FREQUENCY_5),
    item("anxiety-core-3", "anxiety", "anxiety-symptoms", "焦虑体验", "core", "核心模型 · 8 题", "过去 7 天，你有多频繁难以放松身体或思绪？", "选择最接近的频率。", FREQUENCY_5),
    item("anxiety-core-4", "anxiety", "anxiety-symptoms", "焦虑体验", "core", "核心模型 · 8 题", "过去 7 天，你有多频繁担心会发生不好的事情？", "不需要判断担心是否合理。", FREQUENCY_5),
    item("anxiety-core-5", "anxiety", "anxiety-interference", "焦虑干扰", "core", "核心模型 · 8 题", "紧张或担心对专注造成了多大影响？", "按工作、学习或日常事务中的表现回答。", IMPACT_5),
    item("anxiety-core-6", "anxiety", "anxiety-interference", "焦虑干扰", "core", "核心模型 · 8 题", "紧张或担心对睡眠造成了多大影响？", "包括入睡和夜间醒来。", IMPACT_5),
    item("anxiety-core-7", "anxiety", "anxiety-interference", "焦虑干扰", "core", "核心模型 · 8 题", "紧张或担心对工作、学习或家务造成了多大影响？", "考虑是否回避、拖延或中断。", IMPACT_5),
    item("anxiety-core-8", "anxiety", "anxiety-interference", "焦虑干扰", "core", "核心模型 · 8 题", "紧张或担心对与人相处造成了多大影响？", "选择最接近整体影响的一项。", IMPACT_5),
    item("anxiety-supp-1", "anxiety", "anxiety-pattern", "触发与回避", "supplemental", "行动信息 · 3 题", "你是否因为担心而回避某些必要活动？", "用于后续计划，不计入核心模型分。", IMPACT_5, { scored: false }),
    item("anxiety-supp-2", "anxiety", "anxiety-pattern", "触发与回避", "supplemental", "行动信息 · 3 题", "这些体验是否突然发作，并伴随明显心慌、气促或失控感？", "用于准备与专业人员沟通。", FREQUENCY_5, { scored: false }),
    item("anxiety-supp-3", "anxiety", "anxiety-safety", "安全确认", "safety", "安全确认 · 1 题", "这些体验是否让你觉得自己目前无法保证自身安全？", "如目前不安全，请立即联系当地急救服务或身边可信赖的人。", SAFETY_OPTIONS, { scored: false, safetyRule: { atOrAbove: 2, urgency: "immediate", action: "你表示可能无法保证自身安全。请立即联系当地急救服务或身边可信赖的人，并尽量不要独处。" } }),
  ],
  depression: [
    item("depression-duration", "depression", "depression-context", "情绪背景", "screening", "适用性与背景 · 2 题", "目前这类低落、兴趣下降或动力不足持续了多久？", "用于安排下一步，不计入核心模型分。", DURATION_OPTIONS, { scored: false }),
    item("depression-change", "depression", "depression-context", "情绪背景", "screening", "适用性与背景 · 2 题", "最近一周，这些体验总体如何变化？", "突然明显变化会单独影响行动建议。", CHANGE_OPTIONS, { scored: false }),
    item("depression-core-1", "depression", "depression-symptoms", "抑郁情绪体验", "core", "核心模型 · 8 题", "过去 7 天，你有多频繁感到情绪低落？", "按通常体验回答。", FREQUENCY_5),
    item("depression-core-2", "depression", "depression-symptoms", "抑郁情绪体验", "core", "核心模型 · 8 题", "过去 7 天，你有多频繁对平常在意的事情失去兴趣？", "包括不再想开始或参与。", FREQUENCY_5),
    item("depression-core-3", "depression", "depression-symptoms", "抑郁情绪体验", "core", "核心模型 · 8 题", "过去 7 天，你有多频繁觉得做任何事都很费力？", "不需要判断是身体还是情绪原因。", FREQUENCY_5),
    item("depression-core-4", "depression", "depression-symptoms", "抑郁情绪体验", "core", "核心模型 · 8 题", "过去 7 天，你有多频繁难以对未来抱有期待？", "选择最接近的频率。", FREQUENCY_5),
    item("depression-core-5", "depression", "depression-interference", "生活影响", "core", "核心模型 · 8 题", "低落或兴趣下降对专注造成了多大影响？", "按工作、学习或日常事务中的表现回答。", IMPACT_5),
    item("depression-core-6", "depression", "depression-interference", "生活影响", "core", "核心模型 · 8 题", "低落或兴趣下降对完成日常任务造成了多大影响？", "包括开始和坚持完成。", IMPACT_5),
    item("depression-core-7", "depression", "depression-interference", "生活影响", "core", "核心模型 · 8 题", "低落或兴趣下降对与人相处造成了多大影响？", "考虑减少联系、回避或难以投入。", IMPACT_5),
    item("depression-core-8", "depression", "depression-interference", "生活影响", "core", "核心模型 · 8 题", "低落或兴趣下降对照顾自己造成了多大影响？", "包括吃饭、清洁、服药和基本安排。", IMPACT_5),
    item("depression-supp-1", "depression", "depression-pattern", "现实影响", "supplemental", "行动信息 · 3 题", "过去 7 天，你是否因为这些体验减少了必须完成的事情？", "用于制定行动，不计入核心模型分。", IMPACT_5, { scored: false }),
    item("depression-supp-2", "depression", "depression-pattern", "支持情况", "supplemental", "行动信息 · 3 题", "当状态变差时，你身边是否有可以联系并提供支持的人？", "用于准备安全和支持计划。", [{ label: "有，并且能够联系", value: 0 }, { label: "可能有，但不确定能否联系", value: 1 }, { label: "很少有人可以联系", value: 2 }, { label: "目前没有", value: 3 }, { label: "不愿回答", value: 4 }], { scored: false }),
    item("depression-supp-3", "depression", "depression-safety", "安全确认", "safety", "安全确认 · 1 题", "过去 7 天，你是否出现过伤害自己、或担心自己无法保证安全的想法？", "如目前不安全，请立即联系当地急救服务或身边可信赖的人。", SAFETY_OPTIONS, { scored: false, safetyRule: { atOrAbove: 2, urgency: "immediate", action: "你表示可能无法保证自身安全。请立即联系当地急救服务或身边可信赖的人，并尽量不要独处。" } }),
  ],
  function: [
    item("function-duration", "function", "function-context", "功能背景", "screening", "适用性与背景 · 2 题", "目前这些活动困难持续了多久？", "用于行动安排，不计入核心功能分。", DURATION_OPTIONS, { scored: false }),
    item("function-change", "function", "function-context", "功能背景", "screening", "适用性与背景 · 2 题", "最近一周，活动能力总体如何变化？", "突然变化会单独影响行动建议。", CHANGE_OPTIONS, { scored: false, safetyRule: { atOrAbove: 4, urgency: "today", action: "活动能力突然下降或迅速加重，建议今天联系专业人员判断。" } }),
    item("function-core-1", "function", "cognition", "理解与沟通", "core", "核心模型 · 12 题", "专注完成一件事情对你有多困难？", "按过去 30 天通常情况回答。", DIFFICULTY_5),
    item("function-core-2", "function", "cognition", "理解与沟通", "core", "核心模型 · 12 题", "学习新的日常任务或记住重要安排对你有多困难？", "考虑理解、记忆和执行。", DIFFICULTY_5),
    item("function-core-3", "function", "mobility", "移动", "core", "核心模型 · 12 题", "连续站立约半小时对你有多困难？", "按通常情况回答。", DIFFICULTY_5),
    item("function-core-4", "function", "mobility", "移动", "core", "核心模型 · 12 题", "步行较长一段距离或独立外出对你有多困难？", "综合考虑速度、休息和帮助。", DIFFICULTY_5),
    item("function-core-5", "function", "self-care", "自我照顾", "core", "核心模型 · 12 题", "完成洗澡、穿衣或个人清洁对你有多困难？", "按通常情况下回答。", DIFFICULTY_5),
    item("function-core-6", "function", "self-care", "自我照顾", "core", "核心模型 · 12 题", "在需要时独自待一段时间对你有多困难？", "考虑安全、行动和基本照顾。", DIFFICULTY_5),
    item("function-core-7", "function", "getting-along", "与人相处", "core", "核心模型 · 12 题", "与不太熟悉的人沟通和相处对你有多困难？", "按实际生活场景回答。", DIFFICULTY_5),
    item("function-core-8", "function", "getting-along", "与人相处", "core", "核心模型 · 12 题", "维持亲近关系或处理人际分歧对你有多困难？", "选择最接近整体情况的一项。", DIFFICULTY_5),
    item("function-core-9", "function", "life-activities", "生活事务", "core", "核心模型 · 12 题", "完成主要家务和日常事务对你有多困难？", "考虑需要帮助或无法完成的程度。", DIFFICULTY_5),
    item("function-core-10", "function", "life-activities", "生活事务", "core", "核心模型 · 12 题", "完成工作或学习中最重要的任务对你有多困难？", "如果当前没有工作或学习，按主要日常责任回答。", DIFFICULTY_5),
    item("function-core-11", "function", "participation", "社会参与", "core", "核心模型 · 12 题", "参与家庭、社区或个人重要活动对你有多困难？", "考虑健康状态带来的限制。", DIFFICULTY_5),
    item("function-core-12", "function", "participation", "社会参与", "core", "核心模型 · 12 题", "健康状态对你正常生活的总体影响有多大？", "选择最接近过去 30 天整体情况的一项。", IMPACT_5),
    item("function-supp-1", "function", "support", "支持需求", "supplemental", "行动信息 · 3 题", "你目前是否需要他人帮助才能完成基本日常活动？", "用于安排支持，不计入核心功能分。", IMPACT_5, { scored: false }),
    item("function-supp-2", "function", "support", "支持需求", "supplemental", "行动信息 · 3 题", "你是否因为活动困难而出现跌倒或差点跌倒？", "频繁跌倒或突然变化需要更快评估。", FREQUENCY_5, { scored: false, safetyRule: { atOrAbove: 3, urgency: "today", action: "近期反复跌倒或差点跌倒，建议今天联系专业人员评估安全风险。" } }),
    item("function-supp-3", "function", "support", "支持需求", "supplemental", "行动信息 · 3 题", "你最希望优先改善哪一类活动？", "用于生成个性化行动。", [{ label: "移动和外出", value: 0 }, { label: "自我照顾", value: 1 }, { label: "家务或工作", value: 2 }, { label: "与人相处", value: 3 }, { label: "社会参与", value: 4 }], { scored: false }),
  ],
};

const INSTRUMENTS: Record<SpecialtyId, InstrumentSpec> = {
  sleep: {
    instrumentId: "sleep-disturbance-8-architecture-v1",
    modelName: "PROMIS Sleep Disturbance 8a 架构",
    modelVersion: "模型化预评估 v1",
    language: "原创简体中文结构题",
    recallPeriod: "过去 7 天",
    coreItems: 8,
    delivery: "2 题筛选 + 8 题核心 + 3 题行动信息 + 条件安全追问",
    scoring: "核心 8 题形成 0–100 负担指数；不冒充 PROMIS T 分",
    sourceUrl: "https://www.healthmeasures.net/index.php?Itemid=9%25&id=183&option=com_instruments&view=measure",
    assetStatus: "permission-required",
    validityNote: "正式中文 PROMIS 题项及电子化计分需要 HealthMeasures 许可；当前用于验证产品流程与结构。",
  },
  fatigue: {
    instrumentId: "fatigue-8-architecture-v1",
    modelName: "PROMIS Fatigue 8a 架构",
    modelVersion: "模型化预评估 v1",
    language: "原创简体中文结构题",
    recallPeriod: "过去 7 天",
    coreItems: 8,
    delivery: "2 题筛选 + 8 题核心 + 4 题行动信息",
    scoring: "核心 8 题形成 0–100 负担指数；补充题不混入得分",
    sourceUrl: "https://www.healthmeasures.net/explore-measurement-systems/promis",
    assetStatus: "permission-required",
    validityNote: "正式中文 PROMIS 题项及 T 分转换需许可接入；当前不输出官方分数。",
  },
  pain: {
    instrumentId: "pain-interference-8-architecture-v1",
    modelName: "PROMIS Pain Interference 8a 架构",
    modelVersion: "模型化预评估 v1",
    language: "原创简体中文结构题",
    recallPeriod: "过去 7 天",
    coreItems: 8,
    delivery: "3 题背景与强度 + 8 题疼痛干扰 + 3 题行动与安全",
    scoring: "疼痛强度与核心干扰分开保存；核心 8 题形成 0–100 负担指数",
    sourceUrl: "https://www.healthmeasures.net/images/PROMIS/manuals/Scoring_Manual_Only/PROMIS_Pain_Interference_Scoring_Manual_05Dec2023.pdf",
    assetStatus: "permission-required",
    validityNote: "正式中文 PROMIS 题项及 T 分转换需许可接入；当前不输出官方分数。",
  },
  anxiety: {
    instrumentId: "anxiety-8-architecture-v1",
    modelName: "PROMIS Anxiety 8a 架构",
    modelVersion: "模型化预评估 v1",
    language: "原创简体中文结构题",
    recallPeriod: "过去 7 天",
    coreItems: 8,
    delivery: "2 题筛选 + 8 题核心 + 2 题行动信息 + 1 题安全确认",
    scoring: "核心 8 题形成 0–100 负担指数；安全结论独立于量表分",
    sourceUrl: "https://www.healthmeasures.net/explore-measurement-systems/promis",
    assetStatus: "permission-required",
    validityNote: "本专项只测焦虑构念，不与抑郁题混算；正式中文 T 分需许可接入。",
  },
  depression: {
    instrumentId: "depression-8-architecture-v1",
    modelName: "PROMIS Depression 8a 架构",
    modelVersion: "模型化预评估 v1",
    language: "原创简体中文结构题",
    recallPeriod: "过去 7 天",
    coreItems: 8,
    delivery: "2 题筛选 + 8 题核心 + 2 题行动信息 + 1 题安全确认",
    scoring: "核心 8 题形成 0–100 负担指数；安全结论独立于量表分",
    sourceUrl: "https://www.healthmeasures.net/explore-measurement-systems/promis",
    assetStatus: "permission-required",
    validityNote: "本专项只测抑郁情绪构念，不与焦虑题混算；正式中文 T 分需许可接入。",
  },
  function: {
    instrumentId: "whodas12-architecture-v1",
    modelName: "WHODAS 2.0 12 题领域架构",
    modelVersion: "模型化预评估 v1",
    language: "原创简体中文结构题",
    recallPeriod: "过去 30 天",
    coreItems: 12,
    delivery: "2 题筛选 + 12 题核心 + 3 题行动信息",
    scoring: "核心 12 题按 0–4 简单相加并转换为 0–100 影响指数",
    sourceUrl: "https://www.who.int/standards/classifications/international-classification-of-functioning-disability-and-health/who-disability-assessment-schedule",
    assetStatus: "permission-required",
    validityNote: "采用 WHODAS 六领域和 12 题结构；正式产品需锁定 WHO 正式语言资产和计分版本。",
  },
};

export const SPECIALTIES: Specialty[] = [
  {
    id: "sleep",
    name: "睡眠评估",
    shortName: "睡眠",
    description: "区分睡眠困扰、白天影响和需要更快处理的安全信号。",
    canAnswer: "描述近期睡眠困扰的形式、负担和白天影响。",
    estimatedMinutes: "6–8 分钟",
    questionCount: SPECIALTY_QUESTIONS.sleep.length,
    questions: SPECIALTY_QUESTIONS.sleep,
    instrument: INSTRUMENTS.sleep,
    relatedSpecialtyId: "fatigue",
    relatedReason: "如果白天精力下降也很明显，可以进一步了解疲劳影响。",
    canExplain: "近期睡眠困扰的形式、频率以及对白天状态的影响。",
    cannotExplain: "不能判断失眠或其他疾病的具体病因，也不能单独决定检查或用药。",
    observationPlan: "连续两周记录上床、入睡、夜醒、起床时间和白天困倦。",
  },
  {
    id: "fatigue",
    name: "疲劳与精力评估",
    shortName: "疲劳与精力",
    description: "区分疲劳体验、功能干扰、恢复模式和现实影响。",
    canAnswer: "描述近期疲劳负担、恢复感及受影响的活动。",
    estimatedMinutes: "6–8 分钟",
    questionCount: SPECIALTY_QUESTIONS.fatigue.length,
    questions: SPECIALTY_QUESTIONS.fatigue,
    instrument: INSTRUMENTS.fatigue,
    relatedSpecialtyId: "sleep",
    relatedReason: "如果休息后仍难恢复，可以继续了解睡眠状态。",
    canExplain: "近期疲劳体验、恢复模式以及对日常功能的影响。",
    cannotExplain: "不能判断疲劳的具体病因，也不能仅凭本结果决定化验项目。",
    observationPlan: "连续两周记录疲劳最明显的时段、睡眠、活动量和恢复情况。",
  },
  {
    id: "pain",
    name: "疼痛影响评估",
    shortName: "疼痛",
    description: "将疼痛强度、生活干扰和安全信号分开评估。",
    canAnswer: "描述疼痛如何影响活动、睡眠、角色和生活享受。",
    estimatedMinutes: "7–9 分钟",
    questionCount: SPECIALTY_QUESTIONS.pain.length,
    questions: SPECIALTY_QUESTIONS.pain,
    instrument: INSTRUMENTS.pain,
    relatedSpecialtyId: "function",
    relatedReason: "如果疼痛限制了走动或日常任务，可以继续评估活动能力。",
    canExplain: "疼痛强度与疼痛对活动、睡眠、工作和社会生活的干扰。",
    cannotExplain: "不能确定疼痛来源或诊断，也不能据此自行选择影像或药物。",
    observationPlan: "记录疼痛部位、强度、持续时间、诱发活动和最受影响的任务。",
  },
  {
    id: "anxiety",
    name: "焦虑评估",
    shortName: "焦虑",
    description: "单独评估担心、紧张、难以放松及其生活影响。",
    canAnswer: "描述焦虑体验和对专注、睡眠与日常责任的影响。",
    estimatedMinutes: "6–8 分钟",
    questionCount: SPECIALTY_QUESTIONS.anxiety.length,
    questions: SPECIALTY_QUESTIONS.anxiety,
    instrument: INSTRUMENTS.anxiety,
    relatedSpecialtyId: "sleep",
    relatedReason: "如果紧张和担心同时影响睡眠，可以继续了解睡眠状态。",
    canExplain: "近期焦虑体验的频率和对生活的影响。",
    cannotExplain: "不能据此诊断焦虑障碍，也不能推断病因或替代安全评估。",
    observationPlan: "记录最常出现担心的情境、身体反应、回避行为和恢复方式。",
  },
  {
    id: "depression",
    name: "抑郁情绪评估",
    shortName: "抑郁情绪",
    description: "单独评估低落、兴趣下降、生活影响和安全状况。",
    canAnswer: "描述抑郁情绪体验、功能影响和需要优先处理的信息。",
    estimatedMinutes: "6–8 分钟",
    questionCount: SPECIALTY_QUESTIONS.depression.length,
    questions: SPECIALTY_QUESTIONS.depression,
    instrument: INSTRUMENTS.depression,
    relatedSpecialtyId: "sleep",
    relatedReason: "如果低落或兴趣下降同时影响睡眠，可以继续了解睡眠状态。",
    canExplain: "近期低落、兴趣下降及其对日常生活的影响。",
    cannotExplain: "不能据此诊断抑郁障碍，也不能替代面对面的安全和临床评估。",
    observationPlan: "记录情绪、兴趣、睡眠、基本活动和可以联系的支持者。",
  },
  {
    id: "function",
    name: "活动能力评估",
    shortName: "活动能力",
    description: "覆盖理解沟通、移动、自理、生活事务和社会参与。",
    canAnswer: "描述活动受限的范围、程度和支持需求。",
    estimatedMinutes: "8–10 分钟",
    questionCount: SPECIALTY_QUESTIONS.function.length,
    questions: SPECIALTY_QUESTIONS.function,
    instrument: INSTRUMENTS.function,
    relatedSpecialtyId: "pain",
    relatedReason: "如果活动困难主要伴随疼痛，可以继续评估疼痛影响。",
    canExplain: "过去 30 天在六类功能领域遇到的困难与总体影响。",
    cannotExplain: "不能判断功能下降的疾病原因，也不能代替体格或康复评估。",
    observationPlan: "选择一项最受限的日常活动，记录完成时间、需要的帮助和变化。",
  },
];

export function getVisibleQuestions(questions: AssessmentQuestion[], answers: Record<string, number>) {
  return questions.filter((question) => {
    if (!question.showWhen) return true;
    const value = answers[question.showWhen.questionId];
    if (value === undefined) return false;
    if (question.showWhen.equals !== undefined) return value === question.showWhen.equals;
    if (question.showWhen.atOrAbove !== undefined) return value >= question.showWhen.atOrAbove;
    return true;
  });
}
