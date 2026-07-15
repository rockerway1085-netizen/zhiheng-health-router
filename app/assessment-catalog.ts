export type CapabilityGroup = {
  name: string;
  items: readonly string[];
};

export type SpecialtyCatalogItem = {
  name: string;
  model: string;
};

export type EvidenceGroup = {
  name: string;
  items: readonly string[];
};

export const OVERALL_CAPABILITY_GROUPS: readonly CapabilityGroup[] = [
  {
    name: "基础与路由",
    items: ["开始前确认", "健康背景", "自评与近期变化"],
  },
  {
    name: "核心健康状态",
    items: ["身体功能", "疼痛", "疲劳", "睡眠", "焦虑", "抑郁情绪", "社会角色"],
  },
  {
    name: "风险与行动资料",
    items: ["生活方式", "客观体征", "家族与个人风险", "既往筛查与疫苗", "现实条件"],
  },
  {
    name: "后台保障",
    items: ["质量检查", "报告组装"],
  },
] as const;

export const SPECIALTY_CATALOG: readonly SpecialtyCatalogItem[] = [
  { name: "身体功能 / 日常活动", model: "WHODAS 2.0" },
  { name: "生活质量", model: "WHOQOL-BREF" },
  { name: "睡眠", model: "PROMIS Sleep" },
  { name: "疲劳与精力", model: "PROMIS Fatigue" },
  { name: "焦虑", model: "PROMIS Anxiety" },
  { name: "抑郁情绪", model: "PROMIS Depression" },
  { name: "疼痛影响", model: "PROMIS Pain Interference" },
  { name: "正向福祉", model: "Secure Flourishing Index" },
  { name: "近期健康负担", model: "CDC HRQOL-14" },
  { name: "儿童一般健康", model: "KIDSCREEN-27" },
  { name: "儿童临床状态", model: "PedsQL 4.0" },
  { name: "老年能力", model: "WHO ICOPE" },
  { name: "客观认知 / 运动 / 感觉", model: "NIH Toolbox" },
  { name: "研究与群体评价", model: "EQ-5D / 15D / AQoL / HUI / QWB" },
] as const;

export const EVIDENCE_GROUPS: readonly EvidenceGroup[] = [
  {
    name: "整体与专项模型",
    items: [
      "CDC HRA",
      "PROMIS-29",
      "WHODAS 2.0",
      "WHOQOL-BREF",
      "PROMIS Domain Short Forms / CAT",
      "Secure Flourishing Index",
      "CDC HRQOL-14",
    ],
  },
  {
    name: "人群专项模型",
    items: ["KIDSCREEN-27", "PedsQL 4.0", "WHO ICOPE", "NIH Toolbox"],
  },
  {
    name: "行动依据",
    items: [
      "USPSTF Preventive Services",
      "CDC Immunization Schedules",
      "Independent Red-Flag Triage Rules",
    ],
  },
] as const;
