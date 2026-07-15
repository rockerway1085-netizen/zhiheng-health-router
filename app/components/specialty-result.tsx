"use client";

import { useState } from "react";
import type { CareUrgency, Specialty, SpecialtyId } from "../assessment-models";

export type SpecialtyResultSnapshot = {
  level: "low" | "attention" | "high";
  burdenScore: number;
  title: string;
  coreAnswered: number;
  coreTotal: number;
  validityStatus: "valid" | "incomplete";
  careUrgency: CareUrgency;
  safetySignals: Array<{ urgency: "immediate" | "today"; action: string }>;
  dimensions: Array<{
    id: string;
    label: string;
    domain: SpecialtyId;
    value: number;
  }>;
};

type Props = {
  specialty: Specialty;
  result: SpecialtyResultSnapshot;
  onContinueSpecialty: (specialtyId: SpecialtyId) => void;
  onRetake: () => void;
  onOpenAi: () => void;
  onExit: () => void;
};

const LEVEL_COPY = {
  low: {
    label: "负担较轻",
    action: "先观察两周，记录变化",
    care: "如果问题持续、反复或开始影响基本活动，再考虑预约专业评估。",
  },
  attention: {
    label: "值得关注",
    action: "记录最影响生活的场景",
    care: "如果持续两周以上，或已经影响工作、学习和自理，建议预约专业评估。",
  },
  high: {
    label: "影响明显",
    action: "准备一次专业评估",
    care: "建议在 1–2 周内安排专业评估；如突然加重或出现警示信号，不要等待复测。",
  },
};

const URGENCY_COPY: Record<CareUrgency, string> = {
  immediate: "立即行动",
  today: "建议今天处理",
  appointment: "建议预约评估",
  "self-care": "可先自我管理",
  undetermined: "尚未判断",
};

function levelFor(value: number) {
  if (value >= 2) return "影响明显";
  if (value >= 1) return "值得关注";
  return "负担较轻";
}

export default function SpecialtyResult({ specialty, result, onContinueSpecialty, onRetake, onOpenAi, onExit }: Props) {
  const [planCopied, setPlanCopied] = useState(false);
  const copy = LEVEL_COPY[result.level];
  const careCopy = result.safetySignals[0]?.action ?? copy.care;
  const primaryAction = result.safetySignals.length > 0 ? "优先完成安全行动" : copy.action;
  const primaryPlan = result.safetySignals[0]?.action ?? specialty.observationPlan;

  async function copyObservationPlan() {
    try {
      await navigator.clipboard.writeText(`${specialty.shortName}${result.safetySignals.length > 0 ? "安全行动" : "观察计划"}：${primaryPlan}`);
      setPlanCopied(true);
      window.setTimeout(() => setPlanCopied(false), 1800);
    } catch {
      setPlanCopied(false);
    }
  }

  return (
    <section className="specialty-result-page" aria-labelledby="specialty-result-title">
      <div className="specialty-result-header">
        <div>
          <span className="section-kicker">{specialty.name} · 已完成</span>
          <h1 id="specialty-result-title">你的{specialty.shortName}评估结果</h1>
          <p>{specialty.instrument.recallPeriod} · {result.validityStatus === "valid" ? `核心模型已完成 ${result.coreAnswered}/${result.coreTotal} 题` : `安全分流已中断普通计分 · 完成 ${result.coreAnswered}/${result.coreTotal} 个核心项`}</p>
        </div>
        <button className="action-secondary" type="button" onClick={() => window.print()}>打印 / 保存</button>
      </div>

      {result.safetySignals.length > 0 && (
        <section className={`specialty-safety specialty-safety-${result.careUrgency}`} aria-label="需要优先处理">
          <span>{result.careUrgency === "immediate" ? "请立即行动" : "建议今天处理"}</span>
          <h2>{result.safetySignals[0].action}</h2>
          <p>安全行动独立于量表分数；不要为了完成网页流程而继续等待。</p>
        </section>
      )}

      <section className={`specialty-outcome outcome-${result.level}`}>
        <div className="specialty-outcome-copy">
          <span>本次回答所反映的近期负担</span>
          <h2>{result.validityStatus === "valid" ? result.title : "安全分流优先，本次不输出完整负担结果"}</h2>
          <p>负担分层描述的是近期影响，不等于疾病风险；是否需要就医由症状、变化速度和警示信号单独判断。</p>
        </div>
        <div className="specialty-score" aria-label={result.validityStatus === "valid" ? `模型化负担指数 ${result.burdenScore} 分` : "核心模型信息不足，未计分"}>
          <strong>{result.validityStatus === "valid" ? result.burdenScore : "—"}</strong><small>{result.validityStatus === "valid" ? "/ 100" : ""}</small>
          <span>{result.validityStatus === "valid" ? copy.label : "信息不足"}</span>
          <em>{result.validityStatus === "valid" ? "模型化负担指数" : "核心模型未完整计分"}</em>
        </div>
      </section>

      <div className="specialty-boundary-grid">
        <article>
          <span>这项评估能说明什么</span>
          <p>{specialty.canExplain}</p>
        </article>
        <article>
          <span>不能据此判断什么</span>
          <p>{specialty.cannotExplain}</p>
        </article>
      </div>

      {result.validityStatus === "valid" && <section className="specialty-dimensions" aria-labelledby="dimension-title">
        <div className="compact-section-heading">
          <div><span>01</span><h2 id="dimension-title">核心模型内部结构</h2></div>
          <p>只比较本专项内部维度，不生成跨专项总健康分。</p>
        </div>
        <div className="dimension-table">
          {result.dimensions.map((dimension) => (
            <div key={dimension.id}>
              <span>{dimension.label}</span>
              <div aria-hidden="true"><i style={{ width: `${Math.max(4, (dimension.value / 4) * 100)}%` }} /></div>
              <strong>{levelFor(dimension.value)}</strong>
            </div>
          ))}
        </div>
      </section>}

      <section className="specialty-primary-action" aria-labelledby="primary-action-title">
        <div>
          <span className="section-kicker">首要下一步</span>
          <h2 id="primary-action-title">{primaryAction}</h2>
          <p>{primaryPlan}</p>
        </div>
        <button className="action-primary" type="button" onClick={copyObservationPlan}>{planCopied ? "已复制" : result.safetySignals.length > 0 ? "复制安全行动" : "复制观察计划"}</button>
      </section>

      {result.safetySignals.length === 0 && (
        <section className="specialty-followup" aria-labelledby="related-title">
          <div className="compact-section-heading">
            <div><span>02</span><h2 id="related-title">最多再推荐一个相关评估</h2></div>
            <p>只有你确认后才会继续。</p>
          </div>
          <div className="related-assessment-row">
            <div>
              <span>相关专项</span>
              <h3>{specialty.relatedReason}</h3>
            </div>
            <button className="action-secondary" type="button" onClick={() => onContinueSpecialty(specialty.relatedSpecialtyId)}>继续相关评估 →</button>
          </div>
        </section>
      )}

      <section className="specialty-care-grid" aria-label="体检与就医建议">
        <article>
          <span>体检建议</span>
          <h3>专项结果不能单独决定检查项目</h3>
          <p>需要补充年龄、生理相关条件、家族史、风险因素、既往疾病和上次检查时间后，才能匹配预防服务建议。</p>
        </article>
        <article>
          <span>就医建议 · {URGENCY_COPY[result.careUrgency]}</span>
          <h3>{careCopy}</h3>
          <p>如症状突然出现、快速加重或出现新的警示信号，不要等待复测。</p>
        </article>
      </section>

      <section className="specialty-ai-row">
        <div>
          <span>AI 解读</span>
          <h3>用本次结构化事实准备下一次沟通</h3>
          <p>提示词会带入模型、回顾期、负担分层、行动等级和解释边界，并禁止 AI 重新计分或诊断。</p>
        </div>
        <button className="action-secondary" type="button" onClick={onOpenAi}>生成解读提示词 →</button>
      </section>

      <details className="specialty-evidence">
        <summary>模型、评分与许可边界</summary>
        <div>
          <dl>
            <div><dt>模型架构</dt><dd>{specialty.instrument.modelName}</dd></div>
            <div><dt>运行版本</dt><dd>{specialty.instrument.modelVersion}</dd></div>
            <div><dt>执行结构</dt><dd>{specialty.instrument.delivery}</dd></div>
            <div><dt>评分方式</dt><dd>{specialty.instrument.scoring}</dd></div>
          </dl>
          <p>{specialty.instrument.validityNote}</p>
          <a href={specialty.instrument.sourceUrl} target="_blank" rel="noreferrer">查看国际模型出处 →</a>
        </div>
      </details>

      <div className="specialty-result-actions">
        <button className="action-secondary" type="button" onClick={onRetake}>用同一版本重新评估</button>
        <button className="text-action" type="button" onClick={onExit}>结束并返回首页</button>
      </div>
    </section>
  );
}
