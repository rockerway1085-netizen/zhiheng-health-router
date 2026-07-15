"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEMO_SESSIONS,
  MODEL_RECORDS,
  REPORT_TEMPLATES,
  ROUTING_RULES,
  SAFETY_RULES,
} from "../product-data";

type AdminSection = "overview" | "models" | "routing" | "safety" | "templates" | "sessions";

type AdminConsoleProps = {
  onBackToAssessment: () => void;
};

const NAV_ITEMS: Array<{ id: AdminSection; label: string; short: string }> = [
  { id: "overview", label: "概览", short: "OV" },
  { id: "models", label: "模型库", short: "MO" },
  { id: "routing", label: "路由规则", short: "RO" },
  { id: "safety", label: "安全规则", short: "SA" },
  { id: "templates", label: "报告模板", short: "RE" },
  { id: "sessions", label: "演示会话", short: "SE" },
];

const SECTION_COPY: Record<AdminSection, { title: string; subtitle: string }> = {
  overview: { title: "运营概览", subtitle: "查看发布阻塞、安全质量和近期运行情况。" },
  models: { title: "模型库", subtitle: "管理科学证据、授权、语言和程序实现四种独立状态。" },
  routing: { title: "路由规则", subtitle: "决定用户在什么条件下进入哪个已发布评估。" },
  safety: { title: "安全规则", subtitle: "安全优先于普通问卷，生产变更需要独立审核。" },
  templates: { title: "报告与 AI 模板", subtitle: "只解释结构化结果，不参与计分或改变安全等级。" },
  sessions: { title: "会话检查器", subtitle: "使用脱敏会话回放路径、结果和用户选择。" },
};

function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "positive" | "warning" | "danger" | "neutral" }) {
  return <span className={`status-pill pill-${tone}`}>{children}</span>;
}

function toneFor(value: string): "positive" | "warning" | "danger" | "neutral" {
  if (/已发布|已核查|可用|已完成|开放候选/.test(value)) return "positive";
  if (/阻塞|过期|拦截/.test(value)) return "danger";
  if (/待|核查中|测试中|需注册|退出/.test(value)) return "warning";
  return "neutral";
}

export default function AdminConsole({ onBackToAssessment }: AdminConsoleProps) {
  const [section, setSection] = useState<AdminSection>("overview");
  const [query, setQuery] = useState("");
  const [releaseFilter, setReleaseFilter] = useState("全部状态");
  const [selectedModelId, setSelectedModelId] = useState(MODEL_RECORDS[1].id);
  const [enabledRules, setEnabledRules] = useState<Record<string, boolean>>(
    Object.fromEntries(ROUTING_RULES.map((rule) => [rule.id, rule.enabled])),
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState(REPORT_TEMPLATES[0].id);

  useEffect(() => {
    const syncFromHash = () => {
      const candidate = window.location.hash.split("/")[2] as AdminSection | undefined;
      if (candidate && NAV_ITEMS.some((item) => item.id === candidate)) setSection(candidate);
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  function navigate(next: AdminSection) {
    setSection(next);
    window.location.hash = `#/admin/${next}`;
  }

  const filteredModels = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return MODEL_RECORDS.filter((model) => {
      const matchesText = !normalized || `${model.name} ${model.provider} ${model.role}`.toLowerCase().includes(normalized);
      const matchesRelease = releaseFilter === "全部状态" || model.release === releaseFilter;
      return matchesText && matchesRelease;
    });
  }, [query, releaseFilter]);

  const selectedModel = MODEL_RECORDS.find((model) => model.id === selectedModelId) ?? MODEL_RECORDS[0];
  const selectedTemplate = REPORT_TEMPLATES.find((template) => template.id === selectedTemplateId) ?? REPORT_TEMPLATES[0];

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <button className="admin-brand" type="button" onClick={() => navigate("overview")}>
          <span className="brand-symbol">衡</span>
          <span><strong>知衡 Console</strong><small>Assessment OS</small></span>
        </button>
        <div className="admin-environment"><span /> 演示环境</div>
        <nav aria-label="控制台导航">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} className={section === item.id ? "active" : ""} type="button" onClick={() => navigate(item.id)}>
              <span className="nav-short">{item.short}</span>
              <span>{item.label}</span>
              {item.id === "models" && <em>4</em>}
              {item.id === "safety" && <em>2</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button type="button" onClick={onBackToAssessment}>← 返回用户端</button>
          <p>公开原型无登录与数据库，请勿录入真实个人健康资料。</p>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <span className="admin-breadcrumb">工作台 / {NAV_ITEMS.find((item) => item.id === section)?.label}</span>
            <h1>{SECTION_COPY[section].title}</h1>
            <p>{SECTION_COPY[section].subtitle}</p>
          </div>
          <div className="admin-top-actions">
            <span className="demo-data-badge">演示数据</span>
            <button className="admin-ghost-button" type="button">查看发布记录</button>
            <button className="admin-primary-button" type="button">创建草稿</button>
            <span className="avatar" aria-label="当前用户：产品负责人">产</span>
          </div>
        </header>

        <main className="admin-content">
          {section === "overview" && (
            <div className="admin-overview">
              <section className="metrics-grid" aria-label="关键指标">
                <article><span>模型资产</span><strong>6</strong><small><b>1</b> 个框架可用</small></article>
                <article><span>生产阻塞</span><strong>4</strong><small><b>3</b> 个授权或译本待处理</small></article>
                <article><span>待安全审核</span><strong>2</strong><small><b>+1</b> 较上周</small></article>
                <article><span>演示完成率</span><strong>72.4%</strong><small><b>+3.8%</b> 过去 7 天</small></article>
              </section>

              <div className="overview-columns">
                <section className="admin-panel work-queue">
                  <div className="panel-heading"><div><span className="panel-kicker">需要处理</span><h2>上线前阻塞</h2></div><button type="button" onClick={() => navigate("models")}>查看全部</button></div>
                  <div className="queue-list">
                    <button type="button" onClick={() => { setSelectedModelId("rand-36"); navigate("models"); }}>
                      <span className="queue-icon danger">译</span><span><strong>RAND-36 简体中文版本未通过复核</strong><small>阻塞整体评估生产发布 · 测量学负责人</small></span><StatusPill tone="danger">高优先级</StatusPill>
                    </button>
                    <button type="button" onClick={() => { setSelectedModelId("promis-29"); navigate("models"); }}>
                      <span className="queue-icon warning">授</span><span><strong>PROMIS-29 数字化授权范围待确认</strong><small>询证中 · 授权负责人 · 7 天前更新</small></span><StatusPill tone="warning">待跟进</StatusPill>
                    </button>
                    <button type="button" onClick={() => navigate("safety")}>
                      <span className="queue-icon warning">安</span><span><strong>2 条安全规则等待双人审核</strong><small>发布包 2026.07-RC2 · 医学安全负责人</small></span><StatusPill tone="warning">待审核</StatusPill>
                    </button>
                    <button type="button" onClick={() => navigate("templates")}>
                      <span className="queue-icon neutral">AI</span><span><strong>AI 解读模板回归测试未完成</strong><small>还有 4 / 18 个病例未通过</small></span><StatusPill>测试中</StatusPill>
                    </button>
                  </div>
                </section>

                <section className="admin-panel release-health">
                  <div className="panel-heading"><div><span className="panel-kicker">当前环境</span><h2>发布健康度</h2></div><StatusPill tone="warning">不可上线</StatusPill></div>
                  <div className="health-ring" aria-label="发布检查 7 项中 4 项通过"><span><strong>4/7</strong><small>检查通过</small></span></div>
                  <ul>
                    <li className="passed"><span>✓</span>路由依赖均已锁定版本</li>
                    <li className="passed"><span>✓</span>历史发布包可重复回放</li>
                    <li><span>!</span>正式中文版本尚未批准</li>
                    <li><span>!</span>安全规则缺少医学双审</li>
                    <li><span>!</span>标准测试病例未全部通过</li>
                  </ul>
                </section>
              </div>

              <div className="overview-bottom">
                <section className="admin-panel activity-panel">
                  <div className="panel-heading"><div><span className="panel-kicker">过去 7 天</span><h2>评估漏斗</h2></div><span className="muted-label">演示流量</span></div>
                  <div className="funnel-bars">
                    <div><span>进入评估</span><i><b style={{ width: "100%" }} /></i><strong>1,284</strong></div>
                    <div><span>开始作答</span><i><b style={{ width: "86%" }} /></i><strong>1,106</strong></div>
                    <div><span>完成评估</span><i><b style={{ width: "72%" }} /></i><strong>930</strong></div>
                    <div><span>接受下一步</span><i><b style={{ width: "41%" }} /></i><strong>524</strong></div>
                  </div>
                </section>
                <section className="admin-panel change-panel">
                  <div className="panel-heading"><div><span className="panel-kicker">审计日志</span><h2>最近变更</h2></div><button type="button">打开日志</button></div>
                  <ol className="change-list">
                    <li><span>路</span><div><strong>调整“整体 → 单一专项”优先级</strong><small>林产品 · 草稿 v12 · 18 分钟前</small></div></li>
                    <li><span>模</span><div><strong>更新 RAND-36 译本核查记录</strong><small>周测量学 · 未解决 · 2 小时前</small></div></li>
                    <li><span>报</span><div><strong>用户结果模板进入回归测试</strong><small>陈内容 · build 164 · 昨天</small></div></li>
                  </ol>
                </section>
              </div>
            </div>
          )}

          {section === "models" && (
            <div className="models-layout">
              <section className="admin-panel model-list-panel">
                <div className="table-tools">
                  <label className="search-field"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索模型、机构或用途" /></label>
                  <select value={releaseFilter} onChange={(event) => setReleaseFilter(event.target.value)} aria-label="按发布状态筛选">
                    <option>全部状态</option><option>框架可用</option><option>研究候选</option><option>生产阻塞</option>
                  </select>
                  <span className="result-count">{filteredModels.length} 个模型</span>
                </div>
                <div className="data-table model-table" role="table" aria-label="模型库">
                  <div className="data-row data-head" role="row"><span>模型</span><span>角色 / 人群</span><span>授权</span><span>中文版本</span><span>发布状态</span></div>
                  {filteredModels.map((model) => (
                    <button key={model.id} className={`data-row ${selectedModel.id === model.id ? "selected" : ""}`} type="button" onClick={() => setSelectedModelId(model.id)}>
                      <span className="model-name"><strong>{model.name}</strong><small>{model.provider}</small></span>
                      <span><strong>{model.role}</strong><small>{model.population}</small></span>
                      <span><StatusPill tone={toneFor(model.license)}>{model.license}</StatusPill></span>
                      <span><small>{model.language}</small></span>
                      <span><StatusPill tone={toneFor(model.release)}>{model.release}</StatusPill></span>
                    </button>
                  ))}
                </div>
              </section>

              <aside className="admin-panel model-detail">
                <div className="detail-heading"><span className="detail-monogram">{selectedModel.name.slice(0, 2).toUpperCase()}</span><div><span className="panel-kicker">模型详情</span><h2>{selectedModel.name}</h2><p>{selectedModel.provider}</p></div><button type="button" aria-label="关闭详情">×</button></div>
                <div className="detail-statuses">
                  <div><span>科学证据</span><StatusPill tone={toneFor(selectedModel.evidence)}>{selectedModel.evidence}</StatusPill></div>
                  <div><span>商业授权</span><StatusPill tone={toneFor(selectedModel.license)}>{selectedModel.license}</StatusPill></div>
                  <div><span>中文版本</span><StatusPill tone={toneFor(selectedModel.language)}>{selectedModel.language}</StatusPill></div>
                  <div><span>程序实施</span><StatusPill tone="warning">待验证</StatusPill></div>
                </div>
                <dl className="detail-grid">
                  <div><dt>当前版本</dt><dd>{selectedModel.version}</dd></div>
                  <div><dt>题量</dt><dd>{selectedModel.items}</dd></div>
                  <div><dt>目标人群</dt><dd>{selectedModel.population}</dd></div>
                  <div><dt>产品角色</dt><dd>{selectedModel.role}</dd></div>
                </dl>
                <div className="blocker-box"><span>生产门禁</span><strong>{selectedModel.blocker}</strong></div>
                <div className="detail-tabs"><button className="active" type="button">基本信息</button><button type="button">证据</button><button type="button">授权</button><button type="button">版本</button></div>
                <div className="provenance-note"><span>来源可追溯</span><p>正式记录应保存官方页面、许可文件、原始版本校验值和核查日期。本原型只展示研究结论摘要。</p></div>
                <button className="admin-primary-button full" type="button">打开完整档案</button>
              </aside>
            </div>
          )}

          {section === "routing" && (
            <div className="routing-layout">
              <section className="admin-panel flow-panel">
                <div className="panel-heading"><div><span className="panel-kicker">用户端公开路径</span><h2>两入口评估编排</h2></div><StatusPill tone="positive">结构已锁定</StatusPill></div>
                <div className="route-map">
                  <div className="route-start"><span>用户进入</span></div>
                  <div className="route-branches">
                    <div><span className="route-number">01</span><strong>整体评估</strong><small>没有明确专项目标</small><i>→</i><em>唯一主模型</em><i>→</i><b>结果后最多推荐 1 个专项</b></div>
                    <div><span className="route-number">02</span><strong>专项评估</strong><small>目标已经明确</small><i>→</i><em>直接匹配专项模块</em><i>→</i><b>解释结果与行动建议</b></div>
                  </div>
                  <div className="route-override"><span>安全规则</span><strong>在任意步骤命中时停止普通流程</strong></div>
                </div>
              </section>

              <section className="admin-panel rules-panel">
                <div className="panel-heading"><div><span className="panel-kicker">规则集 draft-12</span><h2>路由规则</h2></div><button className="admin-primary-button" type="button">新增规则</button></div>
                <div className="rule-list">
                  {ROUTING_RULES.map((rule) => (
                    <article key={rule.id}>
                      <button className={`toggle ${enabledRules[rule.id] ? "on" : ""}`} type="button" aria-pressed={enabledRules[rule.id]} onClick={() => setEnabledRules((current) => ({ ...current, [rule.id]: !current[rule.id] }))}><span /></button>
                      <div className="rule-main"><div><code>{rule.id}</code><strong>{rule.name}</strong></div><p><span>如果</span> {rule.condition}</p><p><span>则</span> {rule.action}</p></div>
                      <div className="rule-priority"><span>优先级</span><strong>{rule.priority}</strong></div>
                      <button className="row-menu" type="button" aria-label={`编辑 ${rule.name}`}>•••</button>
                    </article>
                  ))}
                </div>
                <div className="rule-warning"><span>!</span><p><strong>生产规则不能使用自由文本执行。</strong>所有条件必须引用已发布字段和固定动作，非安全性的二级评估必须获得用户确认。</p></div>
              </section>
            </div>
          )}

          {section === "safety" && (
            <div className="safety-admin-layout">
              <section className="admin-panel safety-banner">
                <div><span className="safety-lock">!</span><div><span className="panel-kicker">独立安全层</span><h2>安全规则优先于评估、计分和 AI 解释</h2><p>生产变更需要医学安全角色双人批准；高危命中后不得继续普通问卷。</p></div></div>
                <button className="admin-primary-button" type="button">创建安全规则</button>
              </section>
              <section className="admin-panel safety-rule-panel">
                <div className="panel-heading"><div><span className="panel-kicker">规则清单</span><h2>当前安全规则</h2></div><span className="muted-label">3 条演示记录</span></div>
                <div className="safety-rule-list">
                  {SAFETY_RULES.map((rule) => (
                    <article key={rule.id}>
                      <div className="safety-rule-id"><code>{rule.id}</code><span className={rule.status === "演示已发布" ? "published-dot" : "draft-dot"} /></div>
                      <div><strong>{rule.name}</strong><small>{rule.version} · {rule.owner}</small></div>
                      <div><span>紧急程度</span><strong>{rule.level}</strong></div>
                      <div><span>测试病例</span><strong>{rule.tests}</strong></div>
                      <StatusPill tone={toneFor(rule.status)}>{rule.status}</StatusPill>
                      <button className="row-menu" type="button" aria-label={`查看 ${rule.name}`}>→</button>
                    </article>
                  ))}
                </div>
              </section>
              <div className="safety-admin-bottom">
                <section className="admin-panel approval-flow"><div className="panel-heading"><div><span className="panel-kicker">发布门禁</span><h2>审核链</h2></div></div><ol><li className="done"><span>1</span><div><strong>规则所有者提交</strong><small>固定条件、来源和行动文案</small></div></li><li className="current"><span>2</span><div><strong>医学安全双审</strong><small>当前有 2 条等待复核</small></div></li><li><span>3</span><div><strong>标准病例回归测试</strong><small>验证误触发和漏触发</small></div></li><li><span>4</span><div><strong>进入不可变发布包</strong><small>支持撤回和历史回放</small></div></li></ol></section>
                <section className="admin-panel safety-quality"><div className="panel-heading"><div><span className="panel-kicker">质量概况</span><h2>安全测试</h2></div></div><div className="quality-stats"><div><strong>41</strong><span>标准病例</span></div><div><strong>4</strong><span>未通过</span></div><div><strong>0</strong><span>生产事件</span></div></div><p>当前所有红旗路径都属于演示状态，尚未授权用于真实医疗分流。</p></section>
              </div>
            </div>
          )}

          {section === "templates" && (
            <div className="template-layout">
              <section className="admin-panel template-list">
                <div className="panel-heading"><div><span className="panel-kicker">模板资产</span><h2>结果输出</h2></div><button className="admin-primary-button" type="button">新建模板</button></div>
                {REPORT_TEMPLATES.map((template) => (
                  <button key={template.id} className={selectedTemplate.id === template.id ? "selected" : ""} type="button" onClick={() => setSelectedTemplateId(template.id)}>
                    <span className="template-icon">{template.channel === "用户端" ? "用" : template.channel === "复制文本" ? "AI" : "文"}</span>
                    <span><strong>{template.name}</strong><small>{template.channel} · {template.version}</small></span>
                    <StatusPill tone={toneFor(template.status)}>{template.status}</StatusPill>
                  </button>
                ))}
              </section>
              <section className="admin-panel template-editor">
                <div className="editor-head"><div><span className="panel-kicker">预览与约束</span><h2>{selectedTemplate.name}</h2><p>{selectedTemplate.description}</p></div><button className="admin-ghost-button" type="button">编辑草稿</button></div>
                <div className="template-tabs"><button className="active" type="button">用户预览</button><button type="button">输入 Schema</button><button type="button">安全约束</button><button type="button">回归测试</button></div>
                <div className="result-template-preview">
                  <span className="preview-label">结果预览 · 睡眠领域</span>
                  <span className="preview-status">值得关注</span>
                  <h3>你的睡眠近期值得进一步关注</h3>
                  <p>从本次回答看，睡眠问题对第二天状态的影响较明显。这个结果描述的是影响，不说明具体病因。</p>
                  <div><strong>建议下一步</strong><span>继续做睡眠专项评估</span><small>只有用户确认后才会继续。</small></div>
                </div>
                <div className="template-constraints">
                  <div><span>✓</span><p><strong>允许</strong>解释自报事实、量表结果、限制和已发布建议。</p></div>
                  <div><span>×</span><p><strong>禁止</strong>创造诊断、改变安全等级、从通用结果推导检查项目。</p></div>
                </div>
              </section>
            </div>
          )}

          {section === "sessions" && (
            <section className="admin-panel sessions-panel">
              <div className="session-toolbar">
                <div><span className="panel-kicker">仅脱敏演示数据</span><h2>最近会话</h2></div>
                <label className="search-field"><span>⌕</span><input placeholder="搜索会话 ID" /></label>
                <select aria-label="筛选路径"><option>全部路径</option><option>整体评估</option><option>专项评估</option></select>
                <button className="admin-ghost-button" type="button">导出审计摘要</button>
              </div>
              <div className="data-table sessions-table" role="table" aria-label="演示会话">
                <div className="data-row data-head"><span>会话 ID</span><span>入口</span><span>执行模块</span><span>内部信号</span><span>用户下一步</span><span>耗时</span><span>状态</span></div>
                {DEMO_SESSIONS.map((session) => (
                  <button key={session.id} className="data-row" type="button">
                    <span><code>{session.id}</code></span><span>{session.route}</span><span>{session.module}</span><span>{session.signal}</span><span>{session.next}</span><span>{session.duration}</span><span><StatusPill tone={toneFor(session.status)}>{session.status}</StatusPill></span>
                  </button>
                ))}
              </div>
              <div className="session-foot"><span>显示 5 / 1,284 个演示会话</span><p>已完成记录不可编辑；生产版只能使用原发布包进行可重复回放。</p></div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
