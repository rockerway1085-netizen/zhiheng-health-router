"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import {
  DOMAIN_META,
  OVERALL_QUESTIONS,
  SPECIALTIES,
  type AssessmentQuestion,
  type AssessmentRoute,
  type SpecialtyId,
} from "../product-data";

type AssessmentStage =
  | "entry"
  | "specialty"
  | "questions"
  | "result";

type AssessmentState = {
  stage: AssessmentStage;
  route: AssessmentRoute | null;
  specialtyId: SpecialtyId | null;
  questionIndex: number;
  answers: Record<string, number>;
};

type AssessmentAction =
  | { type: "CHOOSE_ROUTE"; route: AssessmentRoute }
  | { type: "CHOOSE_SPECIALTY"; specialtyId: SpecialtyId }
  | { type: "ANSWER"; questionId: string; value: number }
  | { type: "NEXT"; isLast: boolean }
  | { type: "PREVIOUS" }
  | { type: "CONTINUE_SPECIALTY"; specialtyId: SpecialtyId }
  | { type: "RESET" };

const INITIAL_STATE: AssessmentState = {
  stage: "entry",
  route: null,
  specialtyId: null,
  questionIndex: 0,
  answers: {},
};

function assessmentReducer(state: AssessmentState, action: AssessmentAction): AssessmentState {
  switch (action.type) {
    case "CHOOSE_ROUTE":
      return {
        ...INITIAL_STATE,
        route: action.route,
        stage: action.route === "overall" ? "questions" : "specialty",
      };
    case "CHOOSE_SPECIALTY":
      return { ...state, specialtyId: action.specialtyId, questionIndex: 0, answers: {}, stage: "questions" };
    case "ANSWER":
      return { ...state, answers: { ...state.answers, [action.questionId]: action.value } };
    case "NEXT":
      return action.isLast
        ? { ...state, stage: "result" }
        : { ...state, questionIndex: state.questionIndex + 1 };
    case "PREVIOUS":
      return { ...state, questionIndex: Math.max(0, state.questionIndex - 1) };
    case "CONTINUE_SPECIALTY":
      return {
        ...INITIAL_STATE,
        route: "specialty",
        specialtyId: action.specialtyId,
        stage: "questions",
      };
    case "RESET":
      return INITIAL_STATE;
    default:
      return state;
  }
}

function Arrow() {
  return <span aria-hidden="true">→</span>;
}

function DomainGlyph({ id, size = "normal" }: { id: SpecialtyId; size?: "normal" | "large" }) {
  return (
    <span
      className={`domain-glyph ${size === "large" ? "domain-glyph-large" : ""}`}
      style={{ color: DOMAIN_META[id].color, backgroundColor: `${DOMAIN_META[id].color}12` }}
      aria-hidden="true"
    >
      {DOMAIN_META[id].name.slice(0, 1)}
    </span>
  );
}

function Progress({ current, total }: { current: number; total: number }) {
  const value = Math.round((current / total) * 100);
  return (
    <div className="assessment-progress" role="progressbar" aria-label="评估进度" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
      <div className="progress-meta">
        <span>{String(current).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
        <span>{value}%</span>
      </div>
      <div className="progress-line" aria-hidden="true">
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function UserAssessment() {
  const [state, dispatch] = useReducer(assessmentReducer, INITIAL_STATE);
  const [copied, setCopied] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [intentText, setIntentText] = useState("");
  const [intentNote, setIntentNote] = useState("");
  const [candidateId, setCandidateId] = useState<SpecialtyId | null>(null);

  useEffect(() => {
    if (!aiOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAiOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [aiOpen]);

  const specialty = useMemo(
    () => SPECIALTIES.find((item) => item.id === state.specialtyId) ?? null,
    [state.specialtyId],
  );

  const candidate = useMemo(
    () => SPECIALTIES.find((item) => item.id === candidateId) ?? null,
    [candidateId],
  );

  const questions: AssessmentQuestion[] = useMemo(
    () => (state.route === "overall" ? OVERALL_QUESTIONS : specialty?.questions ?? []),
    [specialty, state.route],
  );

  const result = useMemo(() => {
    const domainValues = new Map<SpecialtyId, number[]>();
    questions.forEach((question) => {
      const answer = state.answers[question.id];
      if (answer === undefined) return;
      const values = domainValues.get(question.domain) ?? [];
      values.push(answer);
      domainValues.set(question.domain, values);
    });

    const domains = [...domainValues.entries()]
      .map(([id, values]) => ({
        id,
        value: values.reduce((sum, value) => sum + value, 0) / values.length,
      }))
      .sort((a, b) => b.value - a.value);

    const top = domains[0] ?? { id: (state.specialtyId ?? "sleep") as SpecialtyId, value: 0 };
    const level = top.value >= 2.25 ? "high" : top.value >= 1.25 ? "attention" : "low";
    const topName = DOMAIN_META[top.id].name;
    const title =
      level === "low"
        ? state.route === "overall"
          ? "整体状态相对平稳"
          : `${topName}对近期生活的影响较轻`
        : level === "high"
          ? `${topName}是目前最需要优先处理的方面`
          : `${topName}值得再深入了解一步`;
    const stableCount = domains.filter((item) => item.value < 1.25).length;
    const attentionCount = domains.length - stableCount;

    return { domains, top, level, title, topName, stableCount, attentionCount };
  }, [questions, state.answers, state.route, state.specialtyId]);

  const promptText = useMemo(() => {
    const profile = result.domains
      .map(({ id, value }) => `${DOMAIN_META[id].name}：${value >= 2.25 ? "影响明显" : value >= 1.25 ? "值得关注" : "影响较轻"}`)
      .join("；");
    return `你是一名严谨的健康信息整理助手。请根据下面的个人自报评估摘要，帮助我理解结果并准备下一步沟通。\n\n评估目标：${state.route === "overall" ? "了解近期整体健康状态" : `了解${result.topName}方面的影响`}\n回顾周期：最近两周\n领域摘要：${profile || "暂无"}\n主要发现：${result.title}\n\n请按以下结构回答：\n1. 用清楚的日常语言复述已经确认的信息；\n2. 分开列出“已知事实、可能解释、仍需补充的信息”；\n3. 给出值得继续观察和记录的项目；\n4. 帮我整理与医生或其他专业人员沟通时可补充的问题；\n5. 不诊断疾病，不虚构病因，不自行推荐药物；\n6. 如果证据不足，请直接说明无法判断。\n\n注意：这是自报健康评估摘要，不能替代病史采集、体格检查或医疗诊断。`;
  }, [result, state.route]);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const routeLabel = state.route === "overall" ? "整体评估" : specialty?.name ?? "专项评估";

  function matchIntent() {
    const value = intentText.trim();
    if (!value) {
      setIntentNote("先写一句最近最困扰你的情况，或直接从下方选择。");
      return;
    }

    const mappings: Array<{ id: SpecialtyId; pattern: RegExp }> = [
      { id: "sleep", pattern: /睡|失眠|夜醒|早醒|梦|困/ },
      { id: "fatigue", pattern: /累|疲|精力|没精神|乏力|恢复/ },
      { id: "pain", pattern: /痛|疼|酸|麻|不适/ },
      { id: "mood", pattern: /情绪|焦虑|紧张|担心|低落|兴趣|压力/ },
      { id: "function", pattern: /走路|活动|行动|上下楼|家务|自理|工作困难/ },
    ];
    const matched = mappings.find((item) => item.pattern.test(value));
    if (matched) {
      setCandidateId(matched.id);
      setIntentNote("");
      return;
    }

    setCandidateId(null);
    setIntentNote("暂时无法可靠判断。请从下方选择最接近的一项，或改做整体评估。");
  }

  return (
    <div className={`health-app health-stage-${state.stage}`}>
      <header className="health-header">
        <button className="health-brand" type="button" onClick={() => dispatch({ type: "RESET" })} aria-label="返回知衡评估首页">
          <span className="brand-mark">知衡</span>
          <span className="brand-copy">
            <strong>个人健康评估</strong>
            <small>PERSONAL HEALTH ASSESSMENT</small>
          </span>
        </button>
        {state.stage !== "entry" && (
          <button className="header-exit" type="button" onClick={() => dispatch({ type: "RESET" })}>退出评估</button>
        )}
      </header>

      <main className="health-main">
        {state.stage === "entry" && (
          <section className="route-entry" aria-labelledby="entry-title">
            <div className="route-intro">
              <span className="section-kicker">开始一次健康评估</span>
              <h1 id="entry-title">这次，你最想了解什么？</h1>
              <p>先看整体状态，或直接评估一个已经明确的问题。完成后，你会得到清晰结论和可选择的下一步。</p>
            </div>

            <div className="route-grid">
              <button className="route-card route-card-overall" type="button" onClick={() => dispatch({ type: "CHOOSE_ROUTE", route: "overall" })}>
                <span className="route-card-number">01</span>
                <span className="route-card-copy">
                  <span className="route-card-label">还不确定具体问题</span>
                  <strong>做一次整体评估</strong>
                  <span>从身体功能、精力、睡眠、情绪和疼痛五个方面，先看清近期健康全貌。</span>
                </span>
                <span className="domain-preview" aria-label="评估领域">
                  {(Object.keys(DOMAIN_META) as SpecialtyId[]).map((id) => (
                    <span key={id} style={{ color: DOMAIN_META[id].color }}>{DOMAIN_META[id].name}</span>
                  ))}
                </span>
                <span className="route-card-footer"><span>约 8–10 分钟</span><b>开始整体评估 <Arrow /></b></span>
              </button>

              <button className="route-card route-card-specialty" type="button" onClick={() => dispatch({ type: "CHOOSE_ROUTE", route: "specialty" })}>
                <span className="route-card-number">02</span>
                <span className="route-card-copy">
                  <span className="route-card-label">已经有明确关注点</span>
                  <strong>直接做专项评估</strong>
                  <span>针对睡眠、疲劳、疼痛、情绪或活动能力，直接进入更聚焦的评估。</span>
                </span>
                <span className="specialty-preview" aria-hidden="true">
                  {SPECIALTIES.slice(0, 5).map((item) => (
                    <span key={item.id}><DomainGlyph id={item.id} />{item.shortName}</span>
                  ))}
                </span>
                <span className="route-card-footer"><span>通常 3–6 分钟</span><b>选择专项 <Arrow /></b></span>
              </button>
            </div>

            <div className="route-assurance" aria-label="评估特点">
              <span><b>按需求开始</b><small>不堆叠无关问卷</small></span>
              <span><b>结果分层呈现</b><small>先结论，再看依据</small></span>
              <span><b>下一步可选择</b><small>是否继续由你决定</small></span>
            </div>
          </section>
        )}

        {state.stage === "specialty" && (
          <section className="flow-page specialty-page" aria-labelledby="specialty-title">
            <button className="quiet-back" type="button" onClick={() => dispatch({ type: "RESET" })}>← 返回首页</button>
            <div className="flow-heading">
              <span className="section-kicker">专项评估</span>
              <h1 id="specialty-title">你想重点了解哪方面？</h1>
              <p>可以直接选择，也可以用一句话描述最近最困扰你的问题。</p>
            </div>

            <div className="intent-search">
              <label htmlFor="intent-description">描述你的情况</label>
              <div>
                <input
                  id="intent-description"
                  value={intentText}
                  onChange={(event) => setIntentText(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") matchIntent(); }}
                  placeholder="例如：最近总是睡不够，白天没精神"
                />
                <button className="action-primary" type="button" onClick={matchIntent}>帮我找到专项</button>
              </div>
              {intentNote && <p role="status">{intentNote}</p>}
            </div>

            {candidate && (
              <div className="intent-confirmation" role="status">
                <DomainGlyph id={candidate.id} size="large" />
                <div>
                  <span>我理解你主要想了解</span>
                  <h2>{candidate.shortName}</h2>
                  <p>{candidate.canAnswer}预计约 3 分钟。</p>
                </div>
                <div className="intent-actions">
                  <button className="action-primary" type="button" onClick={() => dispatch({ type: "CHOOSE_SPECIALTY", specialtyId: candidate.id })}>是的，开始评估 <Arrow /></button>
                  <button className="action-secondary" type="button" onClick={() => setCandidateId(null)}>重新选择</button>
                </div>
              </div>
            )}

            <div className="specialty-subheading"><span>常用专项</span><small>选择后先确认，再开始评估</small></div>
            <div className="specialty-grid">
              {SPECIALTIES.map((item) => (
                <button key={item.id} className={candidateId === item.id ? "specialty-card selected" : "specialty-card"} type="button" onClick={() => { setCandidateId(item.id); setIntentNote(""); }}>
                  <DomainGlyph id={item.id} size="large" />
                  <span className="specialty-card-copy">
                    <strong>{item.shortName}</strong>
                    <span>{item.description}</span>
                  </span>
                  <span className="specialty-card-meta">约 3 分钟</span>
                  <span className="specialty-arrow"><Arrow /></span>
                </button>
              ))}
            </div>
            <button className="overall-instead" type="button" onClick={() => dispatch({ type: "CHOOSE_ROUTE", route: "overall" })}>
              <span><b>还是拿不准？</b><small>先做整体评估，让结果帮你找到重点。</small></span>
              <span>转到整体评估 <Arrow /></span>
            </button>
          </section>
        )}

        {state.stage === "questions" && questions.length > 0 && (() => {
          const question = questions[state.questionIndex];
          const answer = state.answers[question.id];
          return (
            <section className="question-page" aria-labelledby="question-title">
              <div className="question-header">
                <div><span className="section-kicker">{routeLabel}</span><small>请按第一感受作答，不需要判断原因</small></div>
                <button className="quiet-back" type="button" onClick={() => dispatch({ type: "RESET" })}>退出评估</button>
              </div>
              <Progress current={state.questionIndex + 1} total={questions.length} />
              <div className="question-layout">
                <div className="question-number" aria-hidden="true">{String(state.questionIndex + 1).padStart(2, "0")}</div>
                <div className="question-content">
                  <span className="question-domain" style={{ color: DOMAIN_META[question.domain].color }}>{DOMAIN_META[question.domain].name}</span>
                  <h1 id="question-title">{question.prompt}</h1>
                  <p>{question.helper}</p>
                  <fieldset className="answer-list">
                    <legend className="sr-only">请选择一个答案</legend>
                    {question.options.map((option, index) => (
                      <label key={option.value} className={answer === option.value ? "answer-row selected" : "answer-row"}>
                        <input
                          type="radio"
                          name={question.id}
                          value={option.value}
                          checked={answer === option.value}
                          onChange={() => dispatch({ type: "ANSWER", questionId: question.id, value: option.value })}
                        />
                        <span className="answer-key">{String.fromCharCode(65 + index)}</span>
                        <span>{option.label}</span>
                        <span className="answer-check" aria-hidden="true">✓</span>
                      </label>
                    ))}
                  </fieldset>
                </div>
              </div>
              <div className="question-navigation">
                <button className="action-secondary" type="button" onClick={() => dispatch({ type: "PREVIOUS" })} disabled={state.questionIndex === 0}>上一题</button>
                <button
                  className="action-primary"
                  type="button"
                  disabled={answer === undefined}
                  onClick={() => dispatch({ type: "NEXT", isLast: state.questionIndex === questions.length - 1 })}
                >
                  {state.questionIndex === questions.length - 1 ? "生成评估结果" : "下一题"} <Arrow />
                </button>
              </div>
            </section>
          );
        })()}

        {state.stage === "result" && (
          <section className="report-page" aria-labelledby="result-title">
            <div className="report-heading">
              <div>
                <span className="section-kicker">{routeLabel} · 已完成</span>
                <h1 id="result-title">你的健康评估结果</h1>
                <p>先看最重要的结论，再按需要查看细节和下一步。</p>
              </div>
              <button className="action-secondary" type="button" onClick={() => window.print()}>打印 / 保存</button>
            </div>

            <div className={`signal-hero signal-${result.level}`}>
              <div className="signal-copy">
                <span className="signal-label">本次核心发现</span>
                <h2>{result.title}</h2>
                <p>
                  {result.level === "low"
                    ? "从本次回答看，近期各领域对日常生活的影响总体较轻。你仍可以根据真实感受决定是否继续了解某一项。"
                    : `从你的回答看，${result.topName}比其他领域更影响近期状态。结果描述的是影响程度，不等同于疾病诊断。`}
                </p>
              </div>
              <div className="signal-summary" aria-label="结果摘要">
                <div><span>相对稳定</span><strong>{result.stableCount} 项</strong></div>
                <div><span>值得关注</span><strong>{result.attentionCount} 项</strong></div>
                <div><span>当前就医行动</span><strong>未触发紧急行动</strong></div>
              </div>
            </div>

            <div className="report-grid">
              <section className="report-section domain-report">
                <div className="report-section-heading"><span>01</span><div><h2>近期状态画像</h2><p>数值只用于比较本次各领域的相对影响。</p></div></div>
                <div className="domain-bars">
                  {result.domains.map(({ id, value }) => {
                    const status = value >= 2.25 ? "影响明显" : value >= 1.25 ? "值得关注" : "影响较轻";
                    return (
                      <div className="domain-bar" key={id}>
                        <div><span><DomainGlyph id={id} /><b>{DOMAIN_META[id].name}</b></span><em>{status}</em></div>
                        <div className="domain-track" aria-hidden="true"><span style={{ width: `${Math.max(8, (value / 3) * 100)}%`, backgroundColor: DOMAIN_META[id].color }} /></div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <aside className="report-section report-reading">
                <div className="report-section-heading"><span>02</span><div><h2>怎么理解</h2><p>把结果放回真实生活中看。</p></div></div>
                <div className="reading-points">
                  <div><span className="reading-icon positive">✓</span><p><b>它能说明</b>哪些体验近期更影响你的日常状态。</p></div>
                  <div><span className="reading-icon neutral">—</span><p><b>它不能说明</b>具体病因，也不能单独构成诊断。</p></div>
                  <div><span className="reading-icon note">i</span><p><b>更有价值的用法</b>是继续专项评估或带着摘要沟通。</p></div>
                </div>
              </aside>
            </div>

            <section className="next-plan" aria-labelledby="next-plan-title">
              <div className="next-plan-heading">
                <span className="section-kicker">为你整理的下一步</span>
                <h2 id="next-plan-title">从最有价值的一步开始</h2>
              </div>
              <div className="next-plan-list">
                <article className="plan-card plan-primary">
                  <span className="plan-index">01</span>
                  <div className="plan-copy">
                    <span className="plan-status">{state.route === "overall" && result.level !== "low" ? "优先建议" : "按需选择"}</span>
                    <h3>{state.route === "overall" && result.level !== "low" ? `继续做${result.topName}专项评估` : "暂不追加更多评估"}</h3>
                    <p>{state.route === "overall" && result.level !== "low" ? "用更聚焦的问题了解困扰的形式、频率和生活影响。" : "本次结果没有要求你继续堆叠问卷；有明确需要时再选择专项。"}</p>
                  </div>
                  {state.route === "overall" && result.level !== "low" ? (
                    <button className="action-primary" type="button" onClick={() => dispatch({ type: "CONTINUE_SPECIALTY", specialtyId: result.top.id })}>继续评估 <Arrow /></button>
                  ) : (
                    <button className="action-secondary" type="button" onClick={() => dispatch({ type: "RESET" })}>结束本次评估</button>
                  )}
                </article>

                <article className="plan-card">
                  <span className="plan-index">02</span>
                  <div className="plan-copy">
                    <span className="plan-status neutral">体检建议</span>
                    <h3>补充个人条件后匹配检查项目</h3>
                    <p>年龄、既往史、家族史、风险因素和上次检查时间都会改变建议，不会只按问卷分数决定。</p>
                    <details><summary>查看需要补充的信息</summary><ul><li>年龄与生理相关条件</li><li>既往疾病、用药与家族史</li><li>吸烟、饮酒和其他风险因素</li><li>最近一次体检项目与日期</li></ul></details>
                  </div>
                  <span className="plan-state">待补信息</span>
                </article>

                <article className={`plan-card care-card care-${result.level}`}>
                  <span className="plan-index">03</span>
                  <div className="plan-copy">
                    <span className="plan-status neutral">就医建议</span>
                    <h3>{result.level === "high" ? "如影响持续，建议预约专业评估" : "本次结果未触发紧急行动"}</h3>
                    <p>普通状态评分本身不判断急症；如出现严重不适、突然变化或持续加重，请及时升级处理。</p>
                  </div>
                  <span className="plan-state">{result.level === "high" ? "预约评估" : "继续观察"}</span>
                </article>

                <article className="plan-card">
                  <span className="plan-index">04</span>
                  <div className="plan-copy">
                    <span className="plan-status neutral">AI 解读</span>
                    <h3>生成一段带着你的结果去提问的提示词</h3>
                    <p>帮助 AI 区分事实、可能解释和未知信息，不让它把评估结果写成诊断。</p>
                  </div>
                  <button className="action-secondary" type="button" onClick={() => setAiOpen(true)}>生成提示词 <Arrow /></button>
                </article>
              </div>
            </section>

            <details className="report-evidence">
              <summary>评估依据与使用边界</summary>
              <div><p>本产品按整体评估与专项评估两条路径组织；结果用于描述近期状态、识别需要深入的领域并安排下一步。</p><p>体检项目应结合个人条件和国际预防服务建议匹配；就医分层独立于普通问卷分数。任何评估都不能排除所有紧急情况。</p></div>
            </details>
          </section>
        )}

      </main>

      {aiOpen && (
        <div className="ai-drawer-layer" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setAiOpen(false); }}>
          <aside className="ai-drawer" role="dialog" aria-modal="true" aria-labelledby="ai-drawer-title">
            <div className="ai-drawer-header">
              <div><span className="section-kicker">AI 解读提示词</span><h2 id="ai-drawer-title">让 AI 帮你整理，而不是替你诊断</h2></div>
              <button type="button" autoFocus onClick={() => setAiOpen(false)} aria-label="关闭 AI 解读">×</button>
            </div>
            <p>提示词已带入本次结果，并要求 AI 明确区分事实、推断和未知。</p>
            <textarea className="prompt-text" value={promptText} readOnly aria-label="AI 解读提示词" />
            <div className="ai-drawer-actions">
              <button className="action-primary action-full" type="button" onClick={copyPrompt}>{copied ? "已复制到剪贴板" : "复制完整提示词"}</button>
              <button className="action-secondary action-full" type="button" onClick={() => setAiOpen(false)}>返回评估结果</button>
            </div>
          </aside>
        </div>
      )}

      <footer className="health-footer">
        <span>知衡个人健康评估</span>
        <span>评估用于个人健康管理，不替代医疗诊断</span>
        <span>如情况危急或迅速加重，请立即联系当地急救服务</span>
      </footer>
    </div>
  );
}
