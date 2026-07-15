"use client";

import { useMemo, useReducer, useState } from "react";
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
  | "prepare"
  | "questions"
  | "result"
  | "prompt"
  | "complete";

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
  | { type: "GO_TO"; stage: AssessmentStage }
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
        stage: action.route === "overall" ? "prepare" : "specialty",
      };
    case "CHOOSE_SPECIALTY":
      return { ...state, specialtyId: action.specialtyId, stage: "prepare" };
    case "GO_TO":
      return { ...state, stage: action.stage };
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
        stage: "prepare",
      };
    case "RESET":
      return INITIAL_STATE;
    default:
      return state;
  }
}

type UserAssessmentProps = {
  onOpenConsole: () => void;
};

function Arrow() {
  return <span aria-hidden="true">→</span>;
}

function Progress({ current, total }: { current: number; total: number }) {
  const value = Math.round((current / total) * 100);
  return (
    <div className="question-progress" aria-label={`评估进度 ${current}/${total}`}>
      <div className="question-progress-meta">
        <span>第 {current} / {total} 题</span>
        <span>约剩 {Math.max(1, Math.ceil((total - current + 1) * 0.35))} 分钟</span>
      </div>
      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function UserAssessment({ onOpenConsole }: UserAssessmentProps) {
  const [state, dispatch] = useReducer(assessmentReducer, INITIAL_STATE);
  const [copied, setCopied] = useState(false);

  const specialty = useMemo(
    () => SPECIALTIES.find((item) => item.id === state.specialtyId) ?? null,
    [state.specialtyId],
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
      state.route === "overall"
        ? level === "low"
          ? "本次没有发现明显需要继续深入的信号"
          : level === "high"
            ? `${topName}近期对日常状态的影响较明显`
            : `${topName}值得进一步关注`
        : level === "low"
          ? `${topName}目前对日常状态的影响较轻`
          : level === "high"
            ? `${topName}近期对日常状态的影响较明显`
            : `${topName}值得进一步关注`;

    return { domains, top, level, title, topName };
  }, [questions, state.answers, state.route, state.specialtyId]);

  const promptText = useMemo(() => {
    const profile = result.domains
      .map(({ id, value }) => `${DOMAIN_META[id].name}：${value >= 2.25 ? "影响明显" : value >= 1.25 ? "值得关注" : "影响较轻"}`)
      .join("；");
    return `你是一名严谨的健康信息整理助手。请根据下面的自报评估摘要，帮助我理解信息并准备下一步沟通。\n\n本次目标：${state.route === "overall" ? "了解近期整体健康状态" : `了解${result.topName}方面的影响`}\n评估摘要：${profile || "暂无"}\n主要发现：${result.title}\n\n请按以下结构回答：\n1. 用日常语言复述已经确认的事实；\n2. 区分“事实、可能的解释、目前未知”；\n3. 给出我可以向医生或其他专业人员补充的关键信息清单；\n4. 不做疾病诊断，不虚构病因，不自行推荐药物；\n5. 如果信息不足，明确说不知道；\n6. 不改变网页给出的安全行动建议。\n\n说明：以上来自产品流程演示题目，不是正式医疗量表结果。`;
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

  return (
    <div className="assessment-app">
      <header className="app-header">
        <button className="product-brand" type="button" onClick={() => dispatch({ type: "RESET" })} aria-label="返回评估首页">
          <span className="brand-symbol">衡</span>
          <span>
            <strong>知衡评估</strong>
            <small>Personal health assessment</small>
          </span>
        </button>
        <div className="header-actions">
          <span className="local-note">流程演示 · 回答不上传</span>
          <button className="console-link" type="button" onClick={onOpenConsole}>产品方控制台</button>
        </div>
      </header>

      <main className={`assessment-main stage-${state.stage}`}>
        {state.stage === "entry" && (
          <section className="entry-screen" aria-labelledby="entry-title">
            <div className="entry-copy">
              <span className="eyebrow">开始一次评估</span>
              <h1 id="entry-title">这次你想怎么评估？</h1>
              <p>还不确定具体问题，可以先了解整体状态；已经有明确目标，可以直接进入对应专项。</p>
            </div>

            <div className="entry-grid">
              <button className="entry-card entry-card-primary" type="button" onClick={() => dispatch({ type: "CHOOSE_ROUTE", route: "overall" })}>
                <span className="entry-card-top"><span className="entry-index">01</span><span className="entry-tag">适合先看全貌</span></span>
                <span className="entry-card-body">
                  <strong>整体评估</strong>
                  <span>从身体状态、睡眠、精力、情绪和日常活动等方面，了解近期整体情况。</span>
                </span>
                <span className="entry-card-action">开始整体评估 <Arrow /></span>
              </button>

              <button className="entry-card" type="button" onClick={() => dispatch({ type: "CHOOSE_ROUTE", route: "specialty" })}>
                <span className="entry-card-top"><span className="entry-index">02</span><span className="entry-tag">目标已经明确</span></span>
                <span className="entry-card-body">
                  <strong>专项评估</strong>
                  <span>针对一个已经明确的问题进行评估，例如睡眠、疲劳、疼痛、情绪或活动能力。</span>
                </span>
                <span className="entry-card-action">选择专项 <Arrow /></span>
              </button>
            </div>

            <div className="entry-assurance" aria-label="使用说明">
              <span><b>一次只做一件事</b>不堆叠无关问卷</span>
              <span><b>结果说明边界</b>不把评估当诊断</span>
              <span><b>下一步由你确认</b>不会自动追加评估</span>
            </div>

            <p className="safety-footnote">评估不能替代诊断。如当前情况危急或正在迅速加重，请立即联系当地急救服务。</p>
          </section>
        )}

        {state.stage === "specialty" && (
          <section className="tool-screen specialty-screen" aria-labelledby="specialty-title">
            <button className="back-link" type="button" onClick={() => dispatch({ type: "RESET" })}>← 返回</button>
            <div className="screen-heading">
              <span className="step-label">专项评估</span>
              <h1 id="specialty-title">你想评估哪一项？</h1>
              <p>请选择与你当前目标最接近的一项。还不能确定时，建议返回做整体评估。</p>
            </div>
            <div className="specialty-list">
              {SPECIALTIES.map((item) => (
                <button key={item.id} className="specialty-item" type="button" onClick={() => dispatch({ type: "CHOOSE_SPECIALTY", specialtyId: item.id })}>
                  <span className="specialty-dot" style={{ background: DOMAIN_META[item.id].color }} />
                  <span className="specialty-item-copy">
                    <strong>{item.shortName}</strong>
                    <span>{item.description}</span>
                  </span>
                  <span className="specialty-meta">{item.questionCount} 个演示问题</span>
                  <Arrow />
                </button>
              ))}
            </div>
            <button className="text-action" type="button" onClick={() => dispatch({ type: "CHOOSE_ROUTE", route: "overall" })}>还不能确定？改做整体评估</button>
          </section>
        )}

        {state.stage === "prepare" && (
          <section className="tool-screen prepare-screen" aria-labelledby="prepare-title">
            <button className="back-link" type="button" onClick={() => dispatch({ type: "RESET" })}>← 退出本次评估</button>
            <div className="prepare-layout">
              <div className="prepare-main">
                <span className="step-label">评估说明</span>
                <h1 id="prepare-title">{routeLabel}</h1>
                <p className="prepare-lead">
                  {state.route === "overall"
                    ? "这次会了解你近期的身体、精力、睡眠、情绪、疼痛和日常活动状态。"
                    : specialty?.canAnswer}
                </p>
                <div className="prepare-facts">
                  <div><span>问题数量</span><strong>{questions.length} 个演示问题</strong></div>
                  <div><span>作答时间</span><strong>约 {Math.max(2, Math.ceil(questions.length * 0.45))} 分钟</strong></div>
                  <div><span>回顾范围</span><strong>最近两周</strong></div>
                </div>
                <div className="demo-boundary">
                  <span className="info-mark">i</span>
                  <p><strong>当前是产品流程演示。</strong>题目用于验证交互，不是正式国际量表，不会生成医疗诊断或疾病风险。</p>
                </div>
                <button className="primary-button" type="button" onClick={() => dispatch({ type: "GO_TO", stage: "questions" })}>开始评估 <Arrow /></button>
              </div>
              <aside className="prepare-aside">
                <span>结果可以帮助你</span>
                <ul>
                  <li>看清近期最受影响的方面</li>
                  <li>决定是否继续一个专项</li>
                  <li>整理与专业人员沟通的信息</li>
                </ul>
                <span>结果不能</span>
                <ul>
                  <li>诊断疾病或判断病因</li>
                  <li>替代现场检查和医生判断</li>
                </ul>
              </aside>
            </div>
          </section>
        )}

        {state.stage === "questions" && questions.length > 0 && (() => {
          const question = questions[state.questionIndex];
          const answer = state.answers[question.id];
          return (
            <section className="question-screen" aria-labelledby="question-title">
              <div className="question-topline">
                <button className="back-link" type="button" onClick={() => dispatch({ type: "GO_TO", stage: "prepare" })}>退出评估</button>
                <span>{routeLabel}</span>
              </div>
              <Progress current={state.questionIndex + 1} total={questions.length} />
              <div className="question-card">
                <span className="question-domain" style={{ color: DOMAIN_META[question.domain].color }}>{DOMAIN_META[question.domain].name}</span>
                <h1 id="question-title">{question.prompt}</h1>
                <p>{question.helper}</p>
                <fieldset className="answer-options">
                  <legend className="sr-only">请选择一个答案</legend>
                  {question.options.map((option) => (
                    <label key={option.value} className={answer === option.value ? "answer-option selected" : "answer-option"}>
                      <input
                        type="radio"
                        name={question.id}
                        value={option.value}
                        checked={answer === option.value}
                        onChange={() => dispatch({ type: "ANSWER", questionId: question.id, value: option.value })}
                      />
                      <span className="radio-mark" aria-hidden="true" />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </fieldset>
              </div>
              <div className="question-actions">
                <button className="secondary-button" type="button" onClick={() => dispatch({ type: "PREVIOUS" })} disabled={state.questionIndex === 0}>上一题</button>
                <button
                  className="primary-button"
                  type="button"
                  disabled={answer === undefined}
                  onClick={() => dispatch({ type: "NEXT", isLast: state.questionIndex === questions.length - 1 })}
                >
                  {state.questionIndex === questions.length - 1 ? "查看结果" : "下一题"} <Arrow />
                </button>
              </div>
            </section>
          );
        })()}

        {state.stage === "result" && (
          <section className="tool-screen result-screen" aria-labelledby="result-title">
            <div className="result-kicker"><span>✓</span> {routeLabel}已完成</div>
            <div className="result-hero">
              <span className={`result-status status-${result.level}`}>{result.level === "low" ? "近期影响较轻" : result.level === "high" ? "建议关注" : "值得关注"}</span>
              <h1 id="result-title">{result.title}</h1>
              <p>
                {result.level === "low"
                  ? "你的回答中没有出现明显影响日常生活的领域。仍可根据自己的实际感受决定是否咨询专业人员。"
                  : `从本次回答看，${result.topName}是近期最值得先了解的方面。这个结果描述的是影响，不说明具体病因。`}
              </p>
            </div>

            <div className="result-grid">
              <div className="result-profile">
                <h2>{state.route === "overall" ? "你的近期状态画像" : "回答概况"}</h2>
                <div className="profile-bars">
                  {result.domains.map(({ id, value }) => (
                    <div className="profile-row" key={id}>
                      <div><span>{DOMAIN_META[id].name}</span><small>{value >= 2.25 ? "影响明显" : value >= 1.25 ? "值得关注" : "影响较轻"}</small></div>
                      <div className="profile-track" aria-hidden="true"><span style={{ width: `${Math.max(12, (value / 3) * 100)}%`, background: DOMAIN_META[id].color }} /></div>
                    </div>
                  ))}
                </div>
              </div>
              <aside className="result-meaning">
                <div><span className="meaning-mark positive">✓</span><p><strong>这意味着</strong>你的自报体验中，哪些方面近期更影响日常状态。</p></div>
                <div><span className="meaning-mark neutral">×</span><p><strong>这不意味着</strong>你患有某种疾病，也不能仅凭结果确定检查项目。</p></div>
              </aside>
            </div>

            <div className="next-step-panel">
              <span className="step-label">建议下一步</span>
              {state.route === "overall" && result.level !== "low" ? (
                <>
                  <h2>继续做{result.topName}专项评估</h2>
                  <p>进一步描述困扰的形式和影响程度。只有你确认后才会继续。</p>
                  <div className="next-actions">
                    <button className="primary-button" type="button" onClick={() => dispatch({ type: "CONTINUE_SPECIALTY", specialtyId: result.top.id })}>继续专项评估 <Arrow /></button>
                    <button className="secondary-button" type="button" onClick={() => dispatch({ type: "GO_TO", stage: "complete" })}>暂时结束</button>
                  </div>
                </>
              ) : (
                <>
                  <h2>{result.level === "high" ? "如果影响持续或加重，建议咨询专业人员" : "按需要保留这份结果摘要"}</h2>
                  <p>{result.level === "high" ? "可以记录出现时间、变化趋势和日常影响，帮助专业人员更快了解情况。" : "目前没有必要自动追加更多问卷。"}</p>
                  <button className="primary-button" type="button" onClick={() => dispatch({ type: "GO_TO", stage: "complete" })}>完成本次评估 <Arrow /></button>
                </>
              )}
              <button className="ai-action" type="button" onClick={() => dispatch({ type: "GO_TO", stage: "prompt" })}>用 AI 帮我整理结果</button>
            </div>

            <details className="evidence-details">
              <summary>查看评估依据与限制</summary>
              <div>
                <p><strong>当前状态：</strong>交互原型。以上题目是为测试产品流程而写的演示问题，并非已接入的正式量表。</p>
                <p><strong>正式上线要求：</strong>接入明确版本、正式中文译本、许可范围、计分验证和结果解释规则后，才可作为真实健康评估。</p>
                <p><strong>安全边界：</strong>本结果不能排除急症。如出现危急或迅速加重的情况，请立即寻求当地医疗帮助。</p>
              </div>
            </details>
          </section>
        )}

        {state.stage === "prompt" && (
          <section className="tool-screen prompt-screen" aria-labelledby="prompt-title">
            <button className="back-link" type="button" onClick={() => dispatch({ type: "GO_TO", stage: "result" })}>← 返回结果</button>
            <div className="screen-heading">
              <span className="step-label">AI 解读助手</span>
              <h1 id="prompt-title">把结果整理成一段有边界的提示词</h1>
              <p>复制后可以交给你选择的 AI。提示词要求区分事实和推断，并保留评估限制。</p>
            </div>
            <textarea className="prompt-box" value={promptText} readOnly aria-label="AI 解读提示词" />
            <div className="prompt-actions">
              <button className="primary-button" type="button" onClick={copyPrompt}>{copied ? "已复制" : "复制提示词"}</button>
              <button className="secondary-button" type="button" onClick={() => dispatch({ type: "GO_TO", stage: "complete" })}>完成本次评估</button>
            </div>
          </section>
        )}

        {state.stage === "complete" && (
          <section className="tool-screen complete-screen" aria-labelledby="complete-title">
            <div className="complete-mark" aria-hidden="true">✓</div>
            <span className="step-label">本次流程结束</span>
            <h1 id="complete-title">本次评估已完成</h1>
            <p>这份演示结果只保留在当前页面内，不会上传或建立个人健康档案。</p>
            <div className="complete-summary">
              <span>本次目标</span><strong>{state.route === "overall" ? "了解整体状态" : `了解${result.topName}状态`}</strong>
              <span>核心结果</span><strong>{result.title}</strong>
            </div>
            <button className="primary-button" type="button" onClick={() => dispatch({ type: "RESET" })}>返回评估首页 <Arrow /></button>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <span>知衡评估 · 产品流程原型</span>
        <span>不采集真实健康资料 · 不替代医疗诊断</span>
      </footer>
    </div>
  );
}
