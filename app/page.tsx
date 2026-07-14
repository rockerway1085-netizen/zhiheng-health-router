"use client";

import { useMemo, useState } from "react";

type IntentId =
  | "overall"
  | "concern"
  | "screening"
  | "triage"
  | "report"
  | "tracking"
  | "unsure";

type Stage = "intent" | "setup" | "assessment" | "result" | "plan" | "prompt";

type Option = {
  label: string;
  detail: string;
  value: number;
};

type Question = {
  id: string;
  domain: string;
  eyebrow: string;
  title: string;
  helper: string;
  options: Option[];
};

const INTENTS: Array<{
  id: IntentId;
  number: string;
  title: string;
  description: string;
  meta: string;
}> = [
  {
    id: "overall",
    number: "01",
    title: "整体评估",
    description: "适合没有明确专项问题、希望先了解整体健康状态的人。先形成领域画像，再决定是否需要专项评估。",
    meta: "不确定时选这个",
  },
  {
    id: "concern",
    number: "02",
    title: "专项评估",
    description: "只适合需求已经非常明确的人，例如明确要评估睡眠、疲劳、疼痛、情绪或活动能力。",
    meta: "需求明确时选择",
  },
];

const INTENT_LABELS: Record<IntentId, string> = {
  overall: "整体健康概览",
  concern: "专项评估",
  screening: "体检与筛查规划",
  triage: "就医安全分流",
  report: "已有报告解读",
  tracking: "健康目标追踪",
  unsure: "需求梳理",
};

const CONCERNS = [
  { id: "sleep", label: "睡眠", short: "入睡、夜醒、睡醒后的状态" },
  { id: "fatigue", label: "疲劳", short: "精力不足、恢复感、日常影响" },
  { id: "pain", label: "疼痛", short: "疼痛体验与活动干扰" },
  { id: "mood", label: "情绪", short: "情绪困扰与生活影响" },
  { id: "function", label: "活动能力", short: "移动、工作与独立生活" },
  { id: "social", label: "关系与参与", short: "支持、连接与社会活动" },
];

const ROUTING_OPTIONS: Option[] = [
  { label: "基本没有", detail: "没有明显影响", value: 0 },
  { label: "有一点", detail: "能注意到，但影响不大", value: 1 },
  { label: "比较明显", detail: "已经影响部分日常生活", value: 2 },
  { label: "影响很大", detail: "明显妨碍日常活动", value: 3 },
];

const OVERALL_QUESTIONS: Question[] = [
  {
    id: "physical",
    domain: "身体功能",
    eyebrow: "最近两周 · 身体功能",
    title: "身体状态对走动、工作或日常活动有多大影响？",
    helper: "只按你的实际感受回答，不需要推测原因。",
    options: ROUTING_OPTIONS,
  },
  {
    id: "energy",
    domain: "精力与疲劳",
    eyebrow: "最近两周 · 精力",
    title: "精力不足或疲劳感，对日常生活有多大影响？",
    helper: "这里记录体验，不据此推断贫血、甲状腺或其他疾病。",
    options: ROUTING_OPTIONS,
  },
  {
    id: "sleep",
    domain: "睡眠",
    eyebrow: "最近两周 · 睡眠",
    title: "睡眠问题对第二天的状态有多大影响？",
    helper: "包括难入睡、夜醒、早醒或睡后仍不恢复。",
    options: ROUTING_OPTIONS,
  },
  {
    id: "mood",
    domain: "情绪健康",
    eyebrow: "最近两周 · 情绪",
    title: "情绪困扰对生活、工作或专注有多大影响？",
    helper: "这是一道路径问题，不是心理疾病筛查。",
    options: ROUTING_OPTIONS,
  },
  {
    id: "pain",
    domain: "疼痛干扰",
    eyebrow: "最近两周 · 疼痛",
    title: "疼痛或身体不适对活动和休息有多大影响？",
    helper: "若你担心情况紧急，应改走就医安全分流。",
    options: ROUTING_OPTIONS,
  },
  {
    id: "social",
    domain: "社会参与",
    eyebrow: "最近两周 · 关系与参与",
    title: "健康状态对关系、支持或参与重要活动有多大影响？",
    helper: "社会处境不会被自动医学化。",
    options: ROUTING_OPTIONS,
  },
];

const TRIAGE_QUESTIONS: Question[] = [
  {
    id: "rapid",
    domain: "安全门",
    eyebrow: "安全分流 · 1/3",
    title: "你是否认为现在的情况可能危及生命，或正在快速加重？",
    helper: "如果直觉上觉得不能等，请不要为了完成网页流程而等待。",
    options: [
      { label: "否", detail: "目前没有这种感觉", value: 0 },
      { label: "不确定", detail: "我无法判断", value: 1 },
      { label: "是", detail: "可能危急或正在快速加重", value: 3 },
    ],
  },
  {
    id: "sudden",
    domain: "安全门",
    eyebrow: "安全分流 · 2/3",
    title: "是否出现突然且明显的意识、呼吸、行动或交流异常？",
    helper: "本问题只用于最低限度的安全拦截，不能排除其他急症。",
    options: [
      { label: "否", detail: "没有出现", value: 0 },
      { label: "不确定", detail: "我无法确认", value: 1 },
      { label: "是", detail: "出现了突然、明显的异常", value: 3 },
    ],
  },
  {
    id: "advised",
    domain: "安全门",
    eyebrow: "安全分流 · 3/3",
    title: "是否有人在现场建议你立即联系急救或前往急诊？",
    helper: "现场人员看到的信息可能比在线问题更完整。",
    options: [
      { label: "否", detail: "没有这样的建议", value: 0 },
      { label: "不确定", detail: "目前没有人在现场", value: 1 },
      { label: "是", detail: "有人建议立即处理", value: 3 },
    ],
  },
];

const MODEL_MAP: Record<
  string,
  { name: string; source: string; time: string; purpose: string; limitation: string }
> = {
  sleep: {
    name: "PROMIS 睡眠障碍专项",
    source: "HealthMeasures / PROMIS",
    time: "短表或获授权 CAT，约 4–12 题",
    purpose: "更精确地描述睡眠困扰及其程度",
    limitation: "需核对正式中文版本、计分服务与数字化授权；不能单独诊断睡眠疾病。",
  },
  fatigue: {
    name: "PROMIS 疲劳专项",
    source: "HealthMeasures / PROMIS",
    time: "短表或获授权 CAT，约 4–12 题",
    purpose: "区分疲劳体验与其对功能的影响",
    limitation: "不能仅凭结果推断贫血、内分泌或其他病因。",
  },
  pain: {
    name: "PROMIS 疼痛干扰专项",
    source: "HealthMeasures / PROMIS",
    time: "短表或获授权 CAT，约 4–12 题",
    purpose: "描述疼痛对活动、睡眠和参与的影响",
    limitation: "不替代疼痛红旗核查、体格检查或病因诊断。",
  },
  mood: {
    name: "情绪健康专项工具",
    source: "WHO-5 / PROMIS 候选路径",
    time: "约 2–5 分钟，按授权与目标选一种",
    purpose: "把整体情绪关注信号转成更明确的专项描述",
    limitation: "通用画像和专项筛查都不等同于精神疾病诊断。",
  },
  function: {
    name: "WHODAS 2.0 或 PROMIS 身体功能",
    source: "WHO / HealthMeasures",
    time: "约 3–8 分钟，按目标选一种",
    purpose: "进一步了解活动受限、参与和独立生活能力",
    limitation: "需按适用人群、版本与施测方式选择，不能把不同工具分数混用。",
  },
  social: {
    name: "社会参与或生活质量专项",
    source: "PROMIS / WHOQOL 候选路径",
    time: "约 3–8 分钟，按目标选一种",
    purpose: "区分社会参与、支持、孤独感与生活质量",
    limitation: "不把社会处境自动解释为疾病。",
  },
  physical: {
    name: "WHODAS 2.0 或 PROMIS 身体功能",
    source: "WHO / HealthMeasures",
    time: "约 3–8 分钟，按目标选一种",
    purpose: "进一步区分活动能力、日常限制与参与受限",
    limitation: "需要结合用户目标和适用版本；不能单独判断疾病原因。",
  },
  energy: {
    name: "PROMIS 疲劳专项",
    source: "HealthMeasures / PROMIS",
    time: "短表或获授权 CAT，约 4–12 题",
    purpose: "更精确地描述精力不足和疲劳干扰",
    limitation: "不能据此自动推荐化验或推断病因。",
  },
};

function concernQuestions(label: string): Question[] {
  return [
    {
      id: "frequency",
      domain: label,
      eyebrow: `${label} · 出现频率`,
      title: `最近两周，${label}相关困扰出现得有多频繁？`,
      helper: "这一步用于澄清构念和选择工具，不使用自创总分。",
      options: [
        { label: "很少", detail: "偶尔出现", value: 0 },
        { label: "有时", detail: "一周中有几次", value: 1 },
        { label: "经常", detail: "多数日子会出现", value: 2 },
        { label: "几乎每天", detail: "持续或反复出现", value: 3 },
      ],
    },
    {
      id: "interference",
      domain: label,
      eyebrow: `${label} · 日常影响`,
      title: `它对工作、学习、照护自己或重要活动有多大影响？`,
      helper: "影响程度往往比单纯“有没有”更能决定下一步。",
      options: ROUTING_OPTIONS,
    },
    {
      id: "change",
      domain: label,
      eyebrow: `${label} · 近期变化`,
      title: "与平时相比，这个问题最近有什么变化？",
      helper: "这里不根据变化自动判断病因或紧急程度。",
      options: [
        { label: "已经改善", detail: "比之前轻", value: 0 },
        { label: "差不多", detail: "没有明显变化", value: 1 },
        { label: "有所加重", detail: "比之前更明显", value: 2 },
        { label: "明显加重", detail: "变化很快或影响显著", value: 3 },
      ],
    },
  ];
}

function inferIntent(text: string): IntentId {
  const normalized = text.toLowerCase();
  if (/报告|化验|影像|体检单|指标|检查单/.test(normalized)) return "report";
  if (/急|医院|就医|危险|严重|加重/.test(normalized)) return "triage";
  if (/体检|筛查|预防|疫苗/.test(normalized)) return "screening";
  if (/跟踪|趋势|复测|变化|目标/.test(normalized)) return "tracking";
  if (/睡|疲劳|疼|痛|情绪|焦虑|活动|功能|关系/.test(normalized)) return "concern";
  return "overall";
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("intent");
  const [intent, setIntent] = useState<IntentId | null>(null);
  const [freeText, setFreeText] = useState("");
  const [timeBudget, setTimeBudget] = useState("5");
  const [focus, setFocus] = useState("balanced");
  const [concern, setConcern] = useState("sleep");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [screeningScope, setScreeningScope] = useState("general");
  const [ageBand, setAgeBand] = useState("adult");
  const [existingData, setExistingData] = useState("");
  const [reportType, setReportType] = useState("checkup");
  const [reportText, setReportText] = useState("");
  const [reportQuestion, setReportQuestion] = useState("");
  const [trackingTarget, setTrackingTarget] = useState("sleep");
  const [cadence, setCadence] = useState("weekly");
  const [desiredOutput, setDesiredOutput] = useState("understand");
  const [planDecision, setPlanDecision] = useState<"accepted" | "later" | "declined" | null>(null);
  const [copied, setCopied] = useState(false);

  const concernLabel = CONCERNS.find((item) => item.id === concern)?.label ?? "专项问题";
  const activeQuestions = useMemo(() => {
    if (intent === "overall") return OVERALL_QUESTIONS;
    if (intent === "triage") return TRIAGE_QUESTIONS;
    return concernQuestions(concernLabel);
  }, [intent, concernLabel]);

  const activeQuestion = activeQuestions[questionIndex];
  const attentionAnswers = Object.entries(answers)
    .filter(([, value]) => value >= 2)
    .sort((a, b) => b[1] - a[1]);
  const attentionDomains = attentionAnswers.map(([id]) => {
    const question = activeQuestions.find((item) => item.id === id);
    return question?.domain ?? id;
  });
  const hasUrgentSignal = intent === "triage" && Object.values(answers).some((value) => value === 3);
  const hasUncertainty = intent === "triage" && Object.values(answers).some((value) => value === 1);
  const suggestedIntent = inferIntent(freeText);

  const primaryModelKey = useMemo(() => {
    if (intent === "concern") return concern;
    if (intent === "overall" && attentionAnswers.length > 0) return attentionAnswers[0][0];
    return "physical";
  }, [intent, concern, attentionAnswers]);
  const proposedModel = MODEL_MAP[primaryModelKey] ?? MODEL_MAP.physical;

  const result = useMemo(() => {
    if (intent === "triage") {
      if (hasUrgentSignal) {
        return {
          code: "R4",
          label: "安全红旗",
          title: "请停止在线评估，优先联系线下紧急医疗服务",
          description:
            "你的回答命中了本原型的最小安全门。在线问题无法确认原因，也不应延误现场评估。请联系所在地急救服务或尽快前往急诊。",
          tone: "urgent",
        };
      }
      return {
        code: "R1",
        label: "信息仍不足",
        title: hasUncertainty ? "目前不能仅凭在线回答判断是否安全" : "未命中这三项最低安全拦截",
        description:
          "这不等于排除急症。若症状严重、快速变化，或你直觉上觉得不能等，应直接寻求线下医疗帮助。",
        tone: "caution",
      };
    }
    if (intent === "overall" || intent === "concern") {
      if (attentionAnswers.length > 0) {
        return {
          code: "R2",
          label: "领域关注信号",
          title: `有${attentionDomains.length > 1 ? "几个" : "一个"}领域值得进一步了解`,
          description:
            "当前结果只说明某个体验或功能领域较受影响，不能据此判断疾病风险。下一步应选择一个更匹配的正式专项工具。",
          tone: "focus",
        };
      }
      return {
        code: "R0",
        label: "未见需加深信号",
        title: "这轮需求梳理暂未发现明显需要加深的领域",
        description:
          "这不是“健康证明”，只表示当前路由问题没有发现需要立即追加专项评估的信号。你仍可按自己的目标继续或建立追踪。",
        tone: "clear",
      };
    }
    if (intent === "screening") {
      return {
        code: "GUIDE",
        label: "指南路径已准备",
        title: "已整理出体检规划需要核对的个人条件",
        description:
          "本版不会从问卷分数自动开检查。正式建议需要逐条匹配适用人群、既往检查、风险因素和最新国际预防服务指南。",
        tone: "focus",
      };
    }
    if (intent === "report") {
      return {
        code: "READY",
        label: "资料已就绪",
        title: "可以生成一份有边界的报告解读提示词",
        description:
          "提示词会要求 AI 区分报告事实、可能解释、信息缺口和需要问医生的问题，不把异常值直接写成诊断。",
        tone: "clear",
      };
    }
    if (intent === "tracking") {
      return {
        code: "TRACK",
        label: "追踪方案",
        title: "已建立一个轻量、可重复的追踪框架",
        description:
          "后续应尽量使用同一工具、版本、回忆期和施测方式，只有当结果会改变下一步时才复测。",
        tone: "clear",
      };
    }
    return {
      code: "ROUTE",
      label: "需求已梳理",
      title: `更适合从“${INTENT_LABELS[suggestedIntent]}”开始`,
      description:
        "这是根据你写下的需求做的初步路由，不是医学判断。你可以接受建议，也可以返回入口自己选择。",
      tone: "focus",
    };
  }, [
    intent,
    hasUrgentSignal,
    hasUncertainty,
    attentionAnswers.length,
    attentionDomains.length,
    suggestedIntent,
  ]);

  const promptText = useMemo(() => {
    const route = intent ? INTENT_LABELS[intent] : "未选择";
    const answerSummary = activeQuestions
      .filter((question) => answers[question.id] !== undefined)
      .map((question) => {
        const selected = question.options.find((option) => option.value === answers[question.id]);
        return `- ${question.domain}：${selected?.label ?? "已回答"}`;
      })
      .join("\n");
    const planLine = planDecision
      ? `用户对后续专项评估的选择：${
          planDecision === "accepted" ? "同意加入下一阶段" : planDecision === "later" ? "稍后再做" : "暂不进行"
        }。`
      : "";

    return `你是一名谨慎的个人健康信息解释助手。请基于以下资料，生成一份清晰、可核查、非诊断性的说明。\n\n【用户本次目标】\n${route}\n${
      freeText ? `用户原话：${freeText}\n` : ""
    }${reportQuestion ? `最想弄清：${reportQuestion}\n` : ""}\n【本轮结果】\n- 结果类别：${result.code} ${result.label}\n- 结果解释：${
      result.description
    }\n${attentionDomains.length ? `- 关注领域：${attentionDomains.join("、")}\n` : ""}${
      answerSummary || "- 本路径没有生成量表分数"
    }\n${planLine}\n${reportText ? `\n【已有报告原文】\n${reportText}\n` : ""}${
      existingData ? `\n【已有检查或资料】\n${existingData}\n` : ""
    }\n【输出要求】\n1. 先区分“报告或回答中的事实”“可能的解释”“目前不知道的信息”，不要混在一起。\n2. 不做诊断，不承诺排除疾病，不根据生活质量或路由问题直接推荐化验、影像或药物。\n3. 如资料包含参考范围，说明参考范围受实验室、单位、人群与测量条件影响；不要只看单次高低箭头。\n4. 按重要性列出需要向医生确认的问题；若存在明确且可靠的紧急信号，优先说明行动和紧急程度。\n5. 对每个建议注明依据类型：报告事实、经验证量表、国际指南、一般健康信息或信息不足。\n6. 最后用简短清单总结“现在可以做什么”“可以稍后做什么”“不要据此做什么”。\n\n请使用普通人能理解的中文，并主动说明局限性。`;
  }, [
    intent,
    activeQuestions,
    answers,
    freeText,
    reportQuestion,
    result,
    attentionDomains,
    planDecision,
    reportText,
    existingData,
  ]);

  const progress = stage === "setup" ? 25 : stage === "assessment" ? 50 : stage === "result" ? 75 : 100;

  function resetSession() {
    setStage("intent");
    setIntent(null);
    setQuestionIndex(0);
    setAnswers({});
    setPlanDecision(null);
    setCopied(false);
  }

  function chooseIntent(nextIntent: IntentId) {
    setIntent(nextIntent);
    setStage("setup");
    setQuestionIndex(0);
    setAnswers({});
    setPlanDecision(null);
    setCopied(false);
  }

  function beginRoute() {
    setQuestionIndex(0);
    setAnswers({});
    if (intent === "overall" || intent === "concern" || intent === "triage") {
      setStage("assessment");
      return;
    }
    setStage("result");
  }

  function answerQuestion(value: number) {
    if (!activeQuestion) return;
    setAnswers((current) => ({ ...current, [activeQuestion.id]: value }));
  }

  function nextQuestion() {
    if (questionIndex < activeQuestions.length - 1) {
      setQuestionIndex((current) => current + 1);
      return;
    }
    setStage("result");
  }

  function previousQuestion() {
    if (questionIndex > 0) {
      setQuestionIndex((current) => current - 1);
      return;
    }
    setStage("setup");
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  function renderSetup() {
    return (
      <>
        <div className="flow-heading">
          <span className="section-kicker">{intent === "overall" ? "整体评估" : "专项评估"}</span>
          <h1>{intent === "overall" ? "先形成整体健康画像" : "选择一个已经明确的专项"}</h1>
          <p>
            {intent === "overall"
              ? "整体评估用于发现哪些领域值得关注；它不会自动诊断疾病，结果出现信号后才会建议是否继续专项评估。"
              : "专项评估不再做一遍整体筛查，而是直接选择与你当前明确需求相匹配的国际模型。"}
          </p>
        </div>

        {(intent === "overall" || intent === "concern") && (
          <div className="setup-stack">
            {intent === "concern" && (
              <fieldset className="field-group">
                <legend>你已经明确要评估哪一个专项？</legend>
                <div className="choice-grid compact">
                  {CONCERNS.map((item) => (
                    <button
                      className={`choice-tile ${concern === item.id ? "selected" : ""}`}
                      type="button"
                      key={item.id}
                      onClick={() => setConcern(item.id)}
                      aria-pressed={concern === item.id}
                    >
                      <span>{item.label}</span>
                      <small>{item.short}</small>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {intent === "overall" && (
              <fieldset className="field-group">
                <legend>整体概览更偏向什么？</legend>
                <div className="segmented-row">
                  {[
                    ["balanced", "均衡了解"],
                    ["body", "身体与功能"],
                    ["mind", "睡眠与心理"],
                    ["life", "关系与生活"],
                  ].map(([value, label]) => (
                    <button
                      type="button"
                      key={value}
                      className={focus === value ? "active" : ""}
                      onClick={() => setFocus(value)}
                      aria-pressed={focus === value}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <fieldset className="field-group">
              <legend>这次愿意投入多长时间？</legend>
              <div className="segmented-row time-row">
                {[
                  ["3", "3 分钟"],
                  ["5", "5 分钟"],
                  ["10", "10 分钟"],
                ].map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    className={timeBudget === value ? "active" : ""}
                    onClick={() => setTimeBudget(value)}
                    aria-pressed={timeBudget === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="science-note">
              <span className="note-mark">i</span>
              <p>
                本版先用<strong>非计分路由问题</strong>演示编排，不冒充医学量表。正式量表只有在版本、中文验证、计分和授权都确认后才会接入。
              </p>
            </div>
          </div>
        )}

        {intent === "screening" && (
          <div className="setup-stack">
            <fieldset className="field-group">
              <legend>你处于哪个生命阶段？</legend>
              <div className="segmented-row">
                {[
                  ["young", "18–39 岁"],
                  ["adult", "40–64 岁"],
                  ["older", "65 岁及以上"],
                  ["special", "其他/特殊阶段"],
                ].map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    className={ageBand === value ? "active" : ""}
                    onClick={() => setAgeBand(value)}
                    aria-pressed={ageBand === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="field-group">
              <legend>这次主要想核对什么？</legend>
              <div className="choice-grid compact">
                {[
                  ["general", "常规预防", "按年龄和个人条件核对"],
                  ["cardio", "心血管风险", "核对风险因素与既往结果"],
                  ["cancer", "癌症筛查", "按器官、年龄与风险匹配"],
                  ["immunization", "成人免疫", "核对接种史与适用指南"],
                ].map(([value, label, detail]) => (
                  <button
                    className={`choice-tile ${screeningScope === value ? "selected" : ""}`}
                    type="button"
                    key={value}
                    onClick={() => setScreeningScope(value)}
                    aria-pressed={screeningScope === value}
                  >
                    <span>{label}</span>
                    <small>{detail}</small>
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="text-field">
              <span>已有检查、家族史或你认为重要的情况（可选）</span>
              <textarea
                value={existingData}
                onChange={(event) => setExistingData(event.target.value)}
                placeholder="例如：去年做过哪些检查、医生曾提醒过什么……"
              />
            </label>
            <div className="science-note">
              <span className="note-mark">i</span>
              <p>体检项目必须由逐条指南匹配得出，不能由“整体健康分数低”自动推出。本版先生成规划所需的信息清单。</p>
            </div>
          </div>
        )}

        {intent === "triage" && (
          <div className="setup-stack">
            <div className="urgent-intro">
              <span className="urgent-dot" />
              <div>
                <strong>如果你认为情况危急或正在迅速恶化</strong>
                <p>请直接联系所在地急救服务或尽快前往急诊，不要等待在线评估完成。</p>
              </div>
            </div>
            <div className="boundary-panel">
              <span className="mini-label">这条路径能做什么</span>
              <ul>
                <li>运行三项最低限度的安全拦截</li>
                <li>命中安全信号时停止普通问卷</li>
                <li>明确说明在线结果不能排除急症</li>
              </ul>
            </div>
          </div>
        )}

        {intent === "report" && (
          <div className="setup-stack">
            <fieldset className="field-group">
              <legend>这是什么类型的资料？</legend>
              <div className="segmented-row">
                {[
                  ["checkup", "体检报告"],
                  ["lab", "化验结果"],
                  ["imaging", "影像报告"],
                  ["visit", "就诊记录"],
                ].map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    className={reportType === value ? "active" : ""}
                    onClick={() => setReportType(value)}
                    aria-pressed={reportType === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="text-field">
              <span>粘贴报告内容</span>
              <textarea
                className="large"
                value={reportText}
                onChange={(event) => setReportText(event.target.value)}
                placeholder="请去掉姓名、证件号、地址等不必要的身份信息后再粘贴……"
              />
              <small>内容只保留在当前页面状态；刷新页面后清空。</small>
            </label>
            <label className="text-field">
              <span>你最想弄清什么？（可选）</span>
              <input
                value={reportQuestion}
                onChange={(event) => setReportQuestion(event.target.value)}
                placeholder="例如：哪些异常值得优先问医生？"
              />
            </label>
          </div>
        )}

        {intent === "tracking" && (
          <div className="setup-stack">
            <fieldset className="field-group">
              <legend>想追踪哪个目标？</legend>
              <div className="choice-grid compact">
                {CONCERNS.slice(0, 5).map((item) => (
                  <button
                    className={`choice-tile ${trackingTarget === item.id ? "selected" : ""}`}
                    type="button"
                    key={item.id}
                    onClick={() => setTrackingTarget(item.id)}
                    aria-pressed={trackingTarget === item.id}
                  >
                    <span>{item.label}</span>
                    <small>{item.short}</small>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="field-group">
              <legend>你希望多久回看一次？</legend>
              <div className="segmented-row">
                {[
                  ["weekly", "每周"],
                  ["biweekly", "每两周"],
                  ["monthly", "每月"],
                  ["event", "发生变化时"],
                ].map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    className={cadence === value ? "active" : ""}
                    onClick={() => setCadence(value)}
                    aria-pressed={cadence === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="science-note">
              <span className="note-mark">i</span>
              <p>趋势要可比：后续应固定工具、版本、回忆期和测量条件，不要每次换一套题。</p>
            </div>
          </div>
        )}

        {intent === "unsure" && (
          <div className="setup-stack">
            <label className="text-field">
              <span>用自己的话描述这次想解决的事</span>
              <textarea
                className="large"
                value={freeText}
                onChange={(event) => setFreeText(event.target.value)}
                placeholder="不用知道医学分类。例如：最近总觉得没精神，想知道该先了解什么……"
              />
            </label>
            <fieldset className="field-group">
              <legend>你希望最后得到什么？</legend>
              <div className="segmented-row">
                {[
                  ["understand", "看懂现状"],
                  ["next", "知道下一步"],
                  ["doctor", "准备看医生"],
                  ["track", "建立追踪"],
                ].map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    className={desiredOutput === value ? "active" : ""}
                    onClick={() => setDesiredOutput(value)}
                    aria-pressed={desiredOutput === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        <div className="flow-actions">
          <button className="button secondary" type="button" onClick={() => setStage("intent")}>
            返回选择
          </button>
          <button
            className={`button primary ${intent === "triage" ? "danger" : ""}`}
            type="button"
            onClick={beginRoute}
            disabled={intent === "report" ? reportText.trim().length < 10 : intent === "unsure" ? freeText.trim().length < 4 : false}
          >
            {intent === "overall"
              ? "开始整体评估"
              : intent === "concern"
                ? `进入${concernLabel}专项`
                : intent === "triage"
                  ? "开始安全核对"
                  : intent === "unsure"
                    ? "帮我选择路径"
                    : "继续"}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </>
    );
  }

  function renderAssessment() {
    if (!activeQuestion) return null;
    const selectedValue = answers[activeQuestion.id];
    return (
      <>
        <div className="question-meta">
          <span>{activeQuestion.eyebrow}</span>
          <span>
            {questionIndex + 1} / {activeQuestions.length}
          </span>
        </div>
        <div className="question-copy">
          <h1>{activeQuestion.title}</h1>
          <p>{activeQuestion.helper}</p>
        </div>
        <div className="answer-list" role="radiogroup" aria-label={activeQuestion.title}>
          {activeQuestion.options.map((option) => (
            <button
              key={`${activeQuestion.id}-${option.value}`}
              className={`answer-option ${selectedValue === option.value ? "selected" : ""}`}
              type="button"
              role="radio"
              aria-checked={selectedValue === option.value}
              onClick={() => answerQuestion(option.value)}
            >
              <span className="radio-mark" aria-hidden="true" />
              <span className="answer-copy">
                <strong>{option.label}</strong>
                <small>{option.detail}</small>
              </span>
            </button>
          ))}
        </div>
        <div className="flow-actions">
          <button className="button secondary" type="button" onClick={previousQuestion}>
            上一步
          </button>
          <button className="button primary" type="button" onClick={nextQuestion} disabled={selectedValue === undefined}>
            {questionIndex === activeQuestions.length - 1 ? "查看结果" : "下一题"}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </>
    );
  }

  function renderResult() {
    const trackingLabel = CONCERNS.find((item) => item.id === trackingTarget)?.label ?? "当前目标";
    const scopeLabels: Record<string, string> = {
      general: "常规预防",
      cardio: "心血管风险",
      cancer: "癌症筛查",
      immunization: "成人免疫",
    };
    return (
      <>
        <div className={`result-hero ${result.tone}`}>
          <div className="result-code">
            <span>{result.code}</span>
            <small>{result.label}</small>
          </div>
          <div>
            <span className="section-kicker">本轮结果</span>
            <h1>{result.title}</h1>
            <p>{result.description}</p>
          </div>
        </div>

        {(intent === "overall" || intent === "concern") && (
          <div className="result-grid">
            <section className="result-panel">
              <span className="mini-label">结果是怎么来的</span>
              <h2>{attentionDomains.length ? "值得关注的领域" : "本轮已完成的领域"}</h2>
              <div className="domain-list">
                {(attentionDomains.length ? attentionDomains : activeQuestions.map((item) => item.domain)).map((domain, index) => (
                  <div className="domain-row" key={`${domain}-${index}`}>
                    <span className="domain-index">{String(index + 1).padStart(2, "0")}</span>
                    <span>{domain}</span>
                    <small>{attentionDomains.length ? "R2 关注" : "未见加深信号"}</small>
                  </div>
                ))}
              </div>
              <p className="fine-print">
                这是路由结果，不是经验证量表分数。正式版接入模型后，每个结果还会保存工具版本、回忆期、计分依据和授权状态。
              </p>
            </section>

            {result.code === "R2" && (
              <section className="result-panel recommendation">
                <div className="panel-topline">
                  <span className="mini-label">优先建议 1 项</span>
                  <span className="priority-pill">建议继续</span>
                </div>
                <h2>{proposedModel.name}</h2>
                <p>{proposedModel.purpose}</p>
                <div className="model-facts">
                  <div>
                    <span>国际来源</span>
                    <strong>{proposedModel.source}</strong>
                  </div>
                  <div>
                    <span>预计负担</span>
                    <strong>{proposedModel.time}</strong>
                  </div>
                </div>
                <div className="limit-box">
                  <span>它不能做什么</span>
                  <p>{proposedModel.limitation}</p>
                </div>
              </section>
            )}
          </div>
        )}

        {intent === "triage" && (
          <section className={`action-panel ${hasUrgentSignal ? "urgent-action" : ""}`}>
            <span className="mini-label">现在的行动</span>
            <h2>{hasUrgentSignal ? "不要继续完成普通问卷" : "根据真实症状决定下一步"}</h2>
            <ul>
              {hasUrgentSignal ? (
                <>
                  <li>联系所在地急救服务，或尽快前往能够提供紧急评估的医疗机构。</li>
                  <li>如果身边有人，请让对方协助并提供你当前的情况与用药信息。</li>
                  <li>不要把本页面当作诊断或急症排除工具。</li>
                </>
              ) : (
                <>
                  <li>未命中三项最低拦截，不代表已经排除急症。</li>
                  <li>若情况严重、快速变化或你直觉上觉得不能等，直接寻求线下帮助。</li>
                  <li>若情况稳定，可返回选择与你症状最匹配的专项路径。</li>
                </>
              )}
            </ul>
          </section>
        )}

        {intent === "screening" && (
          <div className="result-grid">
            <section className="result-panel">
              <span className="mini-label">已收集</span>
              <h2>{scopeLabels[screeningScope]} · {ageBand === "young" ? "18–39 岁" : ageBand === "adult" ? "40–64 岁" : ageBand === "older" ? "65 岁及以上" : "特殊阶段"}</h2>
              <div className="check-list">
                <span>年龄与生命阶段</span>
                <span>本次筛查目标</span>
                <span className={existingData ? "" : "muted"}>{existingData ? "已有检查资料" : "既往检查资料待补充"}</span>
              </div>
            </section>
            <section className="result-panel recommendation">
              <span className="mini-label">正式版下一步</span>
              <h2>逐条匹配国际预防服务指南</h2>
              <p>需要补齐器官/生理相关条件、风险因素、既往结果和测量时间，再输出“适用、暂不适用、证据不足”的项目清单。</p>
              <div className="limit-box">
                <span>科学边界</span>
                <p>当前页面不生成具体体检项目，避免把未接入的指南规则伪装成医学建议。</p>
              </div>
            </section>
          </div>
        )}

        {intent === "report" && (
          <section className="action-panel">
            <span className="mini-label">准备完成</span>
            <h2>{reportQuestion || "围绕报告事实组织一份安全、可核查的解释"}</h2>
            <p>下一步会生成可直接复制的 AI 提示词，并包含你粘贴的报告内容。提交给任何外部 AI 前，请再次检查隐私信息。</p>
          </section>
        )}

        {intent === "tracking" && (
          <div className="result-grid">
            <section className="result-panel">
              <span className="mini-label">追踪目标</span>
              <h2>{trackingLabel}</h2>
              <p>建议节奏：{cadence === "weekly" ? "每周" : cadence === "biweekly" ? "每两周" : cadence === "monthly" ? "每月" : "发生重要变化时"}</p>
            </section>
            <section className="result-panel recommendation">
              <span className="mini-label">可比性规则</span>
              <h2>同一把尺子，才看得见变化</h2>
              <div className="check-list">
                <span>固定工具与版本</span>
                <span>固定回忆期与测量条件</span>
                <span>只有会改变行动时才复测</span>
              </div>
            </section>
          </div>
        )}

        {intent === "unsure" && (
          <section className="route-suggestion">
            <div>
              <span className="mini-label">根据你的描述</span>
              <p>“{freeText}”</p>
            </div>
            <button className="button primary" type="button" onClick={() => chooseIntent(suggestedIntent)}>
              按建议进入{INTENT_LABELS[suggestedIntent]}
              <span aria-hidden="true">→</span>
            </button>
          </section>
        )}

        {planDecision && result.code === "R2" && (
          <div className="decision-note" role="status">
            {planDecision === "later" ? "已记录：稍后再做这项专项评估。" : "已记录：本次不继续这项专项评估。"}
          </div>
        )}

        <div className="flow-actions result-actions">
          <button className="button secondary" type="button" onClick={resetSession}>
            结束并返回首页
          </button>
          {result.code === "R2" && (
            <button className="button primary" type="button" onClick={() => setStage("plan")}>
              查看下一步评估
              <span aria-hidden="true">→</span>
            </button>
          )}
          {intent !== "unsure" && result.code !== "R4" && result.code !== "R2" && (
            <button className="button primary" type="button" onClick={() => setStage("prompt")}>
              生成 AI 解读提示词
              <span aria-hidden="true">→</span>
            </button>
          )}
          {result.code === "R4" && (
            <button className="button primary danger" type="button" onClick={resetSession}>
              我已知晓，结束评估
            </button>
          )}
        </div>
      </>
    );
  }

  function renderPlan() {
    return (
      <>
        <div className="flow-heading">
          <span className="section-kicker">二级评估建议</span>
          <h1>先看清楚为什么继续，再由你决定</h1>
          <p>平台不会因为出现一个 R2 信号，就自动连续发送所有相关问卷。</p>
        </div>
        <section className="plan-card">
          <div className="plan-card-header">
            <div>
              <span className="mini-label">拟推荐模型</span>
              <h2>{proposedModel.name}</h2>
            </div>
            <span className="evidence-status">授权核查后接入</span>
          </div>
          <div className="plan-why">
            <span>触发原因</span>
            <p>{attentionDomains[0] ?? concernLabel}在本轮出现了 R2 领域关注信号，通用路由问题还不足以精确描述它。</p>
          </div>
          <div className="plan-columns">
            <div>
              <span className="mini-label">可以得到</span>
              <strong>{proposedModel.purpose}</strong>
            </div>
            <div>
              <span className="mini-label">预计负担</span>
              <strong>{proposedModel.time}</strong>
            </div>
            <div>
              <span className="mini-label">国际来源</span>
              <strong>{proposedModel.source}</strong>
            </div>
          </div>
          <div className="limit-box large-limit">
            <span>限制与上线条件</span>
            <p>{proposedModel.limitation}</p>
            <p>当前原型不加载未经核准的中文题目，也不模拟官方计分。</p>
          </div>
        </section>
        <div className="consent-block">
          <span className="mini-label">你的选择会被记录</span>
          <h2>是否把它加入下一阶段？</h2>
          <div className="consent-actions">
            <button
              className="button primary"
              type="button"
              onClick={() => {
                setPlanDecision("accepted");
                setStage("prompt");
              }}
            >
              同意加入
              <span aria-hidden="true">→</span>
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setPlanDecision("later");
                setStage("result");
              }}
            >
              稍后再做
            </button>
            <button
              className="button ghost"
              type="button"
              onClick={() => {
                setPlanDecision("declined");
                setStage("result");
              }}
            >
              暂不进行
            </button>
          </div>
        </div>
      </>
    );
  }

  function renderPrompt() {
    return (
      <>
        <div className="flow-heading prompt-heading">
          <span className="section-kicker">AI 报告解读提示词</span>
          <h1>把事实、推断和下一步分开</h1>
          <p>这份提示词根据本次目标和结果生成。复制前请检查其中是否包含你不想提交给外部 AI 的信息。</p>
        </div>
        <div className="prompt-shell">
          <div className="prompt-toolbar">
            <div>
              <span className="status-dot" />
              <span>已加入安全边界</span>
            </div>
            <button type="button" onClick={copyPrompt}>
              {copied ? "已复制" : "复制提示词"}
            </button>
          </div>
          <pre>{promptText}</pre>
        </div>
        <div className="privacy-callout">
          <span className="note-mark">!</span>
          <p>提示词不能把 AI 变成医生。任何紧急情况、诊断、用药或治疗决定，都应由合格医疗专业人员结合完整信息处理。</p>
        </div>
        <div className="flow-actions">
          <button className="button secondary" type="button" onClick={() => setStage("result")}>
            返回结果
          </button>
          <button className="button primary" type="button" onClick={resetSession}>
            完成本次评估
          </button>
        </div>
      </>
    );
  }

  function renderSessionAside() {
    return (
      <aside className="session-aside">
        <div className="session-top">
          <span className="session-pulse" />
          <span>本次会话</span>
        </div>
        <h2>{intent ? INTENT_LABELS[intent] : "尚未选择"}</h2>
        <dl>
          <div>
            <dt>当前阶段</dt>
            <dd>{stage === "setup" ? "确认路径" : stage === "assessment" ? "一级评估" : stage === "result" ? "结果分类" : stage === "plan" ? "二级建议" : "报告解读"}</dd>
          </div>
          {(intent === "overall" || intent === "concern") && (
            <div>
              <dt>负担上限</dt>
              <dd>{timeBudget} 分钟</dd>
            </div>
          )}
          <div>
            <dt>医学结论</dt>
            <dd>本原型不生成</dd>
          </div>
        </dl>
        <div className="aside-divider" />
        <ol className="mini-timeline">
          {[
            ["需求", "先确定你想解决什么"],
            ["选择", "只选真正需要的路径"],
            ["分类", "结果区分 R0–R4"],
            ["确认", "继续评估前征得同意"],
          ].map(([title, detail], index) => (
            <li key={title} className={progress >= (index + 1) * 25 ? "done" : ""}>
              <span>{index + 1}</span>
              <div>
                <strong>{title}</strong>
                <small>{detail}</small>
              </div>
            </li>
          ))}
        </ol>
        <div className="local-note">本版数据仅保留在当前浏览器页面状态中</div>
      </aside>
    );
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <button className="brand" type="button" onClick={resetSession} aria-label="返回知衡首页">
          <span className="brand-mark">知</span>
          <span>
            <strong>知衡</strong>
            <small>个人健康导航</small>
          </span>
        </button>
        <nav aria-label="页面导航">
          <a href="#boundary">科学边界</a>
          <span className="prototype-badge">研究原型 · 不作诊断</span>
          {stage !== "intent" && (
            <button type="button" onClick={resetSession}>
              重新开始
            </button>
          )}
        </nav>
      </header>

      {stage === "intent" ? (
        <main>
          <section className="hero-section">
            <div className="hero-copy">
              <div className="eyebrow-row">
                <span className="eyebrow-line" />
                <span>评估入口只有两个</span>
              </div>
              <h1>
                先选整体，
                <span>或者明确专项。</span>
              </h1>
              <p>
                还不确定自己要评什么，就做整体评估；已经明确只想评睡眠、疲劳、疼痛、情绪或活动能力，才进入专项评估。
              </p>

              <div className="hero-entry-grid" aria-label="选择评估入口">
                {INTENTS.map((item) => (
                  <button
                    className={`entry-card ${item.id === "concern" ? "entry-card-dark" : ""}`}
                    type="button"
                    key={item.id}
                    onClick={() => chooseIntent(item.id)}
                  >
                    <div className="entry-topline">
                      <span className="entry-number">{item.number}</span>
                      <span className="entry-meta">{item.meta}</span>
                    </div>
                    <h2>{item.title}</h2>
                    <p>{item.description}</p>
                    <span className="entry-action">
                      进入评估 <b aria-hidden="true">→</b>
                    </span>
                  </button>
                ))}
              </div>

              <div className="hero-principles" aria-label="入口规则">
                <span>不确定 → 整体评估</span>
                <span>需求明确 → 专项评估</span>
                <span>其他能力都在结果之后</span>
              </div>
            </div>
            <aside className="journey-card">
              <div className="journey-orbit" aria-hidden="true">
                <span className="orbit-core">你</span>
                <span className="orbit-dot dot-one" />
                <span className="orbit-dot dot-two" />
                <span className="orbit-dot dot-three" />
              </div>
              <div className="journey-copy">
                <span className="mini-label">一次正确的评估流程</span>
                <ol>
                  <li><span>01</span>选择整体或专项</li>
                  <li><span>02</span>调用匹配的模型</li>
                  <li><span>03</span>识别结果信号</li>
                  <li><span>04</span>结果决定下一步</li>
                </ol>
              </div>
            </aside>
          </section>

          <section className="safety-strip" aria-label="紧急情况提示">
            <span className="safety-icon">!</span>
            <div>
              <strong>安全提醒不是第三个评估入口</strong>
              <p>它会贯穿整体和专项两条路径；如果你认为情况危急或正在迅速恶化，请直接联系所在地急救服务，不要等待网页评估。</p>
            </div>
          </section>

          <section className="boundary-section" id="boundary">
            <div className="boundary-heading">
              <span className="section-kicker">评估之后</span>
              <h2>体检、就医、解读和追踪，都不是入口。</h2>
              <p className="boundary-lead">它们是评估结果触发的后续输出，各自使用不同证据，不能与“开始评估”混在同一层。</p>
            </div>
            <div className="boundary-grid">
              {[
                ["评估状态", "经验证的国际量表", "描述体验、功能和趋势"],
                ["规划体检", "国际预防服务指南", "按个人条件逐条匹配"],
                ["是否就医", "红旗与临床分流规则", "安全优先，不等问卷做完"],
                ["AI 解读", "结构化事实与限制提示词", "解释信息，不制造诊断"],
              ].map(([title, source, purpose]) => (
                <article key={title}>
                  <span>{title}</span>
                  <h3>{source}</h3>
                  <p>{purpose}</p>
                </article>
              ))}
            </div>
          </section>
        </main>
      ) : (
        <main className="flow-main">
          <div className="progress-wrap" aria-label={`评估进度 ${progress}%`}>
            <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
            <div className="progress-labels">
              <span>需求</span><span>方案</span><span>评估</span><span>结果</span>
            </div>
          </div>
          <div className="flow-layout">
            <section className="flow-card" aria-live="polite">
              {stage === "setup" && renderSetup()}
              {stage === "assessment" && renderAssessment()}
              {stage === "result" && renderResult()}
              {stage === "plan" && renderPlan()}
              {stage === "prompt" && renderPrompt()}
            </section>
            {renderSessionAside()}
          </div>
        </main>
      )}

      <footer>
        <div>
          <strong>知衡</strong>
          <span>基于国际模型研究构建的个性化健康评估编排原型</span>
        </div>
        <p>本网站不提供诊断、急症排除、用药或治疗建议。研究依据核查至 2026-07-14。</p>
      </footer>
    </div>
  );
}
