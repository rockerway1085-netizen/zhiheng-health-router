import {
  EVIDENCE_GROUPS,
  OVERALL_CAPABILITY_GROUPS,
  SPECIALTY_CATALOG,
} from "../assessment-catalog";

type AssessmentEntryProps = {
  onChooseOverall: () => void;
  onChooseSpecialty: () => void;
};

function Arrow() {
  return <span aria-hidden="true">→</span>;
}

export default function AssessmentEntry({
  onChooseOverall,
  onChooseSpecialty,
}: AssessmentEntryProps) {
  return (
    <section className="assessment-entry" aria-labelledby="entry-title">
      <div className="entry-hero">
        <div className="entry-hero-copy">
          <span className="entry-eyebrow">PERSONAL HEALTH ASSESSMENT</span>
          <h1 id="entry-title">先回答你真正想了解的健康问题</h1>
          <p>
            不知道从哪里开始，就看整体；目标明确，就直接进入专项。系统会根据年龄、作答者与目标，在后台组合适合的国际模型。
          </p>
        </div>
        <dl className="entry-metrics" aria-label="评估能力概览">
          <div><dt>整体评估</dt><dd><strong>17</strong><span>个模块</span></dd></div>
          <div><dt>专项评估</dt><dd><strong>14</strong><span>个方向</span></dd></div>
          <div><dt>方法依据</dt><dd><strong>国际</strong><span>模型与指南</span></dd></div>
        </dl>
      </div>

      <div className="entry-route-grid" aria-label="选择评估入口">
        <article className="entry-route-card entry-route-primary">
          <div className="entry-route-copy">
            <span className="entry-route-badge">还不确定时推荐</span>
            <h2>整体评估</h2>
            <p>了解身体功能、睡眠、精力、情绪、疼痛、社会参与与近期变化。</p>
          </div>
          <div className="entry-route-action">
            <span>PROMIS-29 领域结构 · 29 题 · 约 8–10 分钟</span>
            <button type="button" onClick={onChooseOverall}>开始整体评估 <Arrow /></button>
          </div>
        </article>

        <article className="entry-route-card">
          <div className="entry-route-copy">
            <span className="entry-route-badge">目标已经明确</span>
            <h2>专项评估</h2>
            <p>直接评估一个具体问题，并获得针对性的解释与下一步。</p>
          </div>
          <div className="entry-route-action">
            <span>当前 6 个可运行专项 · 每次 13–17 题 · 约 6–10 分钟</span>
            <button className="secondary" type="button" onClick={onChooseSpecialty}>选择专项评估 <Arrow /></button>
          </div>
        </article>
      </div>

      <section className="capability-overview" aria-labelledby="capability-title">
        <div className="capability-heading">
          <div>
            <span>ASSESSMENT COVERAGE</span>
            <h2 id="capability-title">评估能力全景</h2>
          </div>
          <p>入口只有两个；模块和模型由系统在后台按需组合。</p>
        </div>

        <div className="capability-grid">
          <article className="capability-panel overall-capability">
            <header><h3>17 个整体评估模块</h3><span>一次连续评估</span></header>
            <div className="overall-group-grid">
              {OVERALL_CAPABILITY_GROUPS.map((group) => (
                <section key={group.name} className="overall-group">
                  <h4>{group.name}</h4>
                  <ul>
                    {group.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </section>
              ))}
            </div>
            <footer>一次连续评估，后台按需组合</footer>
          </article>

          <article className="capability-panel specialty-capability">
            <header><h3>14 个专项方向</h3><span>按目标直达</span></header>
            <ol>
              {SPECIALTY_CATALOG.map((item, index) => (
                <li key={item.name}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><strong>{item.name}</strong><small>{item.model}</small></div>
                </li>
              ))}
            </ol>
            <footer>用户确认需求，系统选择适合模型</footer>
          </article>
        </div>
      </section>

      <section className="evidence-strip" aria-labelledby="evidence-title">
        <header>
          <div><span>METHODS &amp; PROVENANCE</span><h2 id="evidence-title">主要国际模型与指南依据</h2></div>
          <p>模型不是入口，只负责在后台完成对应任务。</p>
        </header>
        <div className="evidence-grid">
          {EVIDENCE_GROUPS.map((group) => (
            <section key={group.name}>
              <h3>{group.name}</h3>
              <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          ))}
        </div>
        <p className="evidence-note">模型负责描述状态；体检建议由年龄、风险与既往史匹配；就医行动由独立安全规则判断。</p>
      </section>
    </section>
  );
}
