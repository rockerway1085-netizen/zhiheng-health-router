import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the user assessment as the default surface", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="zh-CN">/i);
  assert.match(html, /<title>知衡评估｜个人健康评估工具<\/title>/i);
  assert.match(html, /这次，你最想了解什么？/);
  assert.match(html, /开始整体评估/);
  assert.match(html, /选择专项/);
  assert.match(html, /按需求开始/);

  assert.doesNotMatch(html, /评估之后/);
  assert.doesNotMatch(html, /体检、就医、解读和追踪，都不是入口/);
  assert.doesNotMatch(html, /国际预防服务指南/);
  assert.doesNotMatch(html, /临床分流规则/);
  assert.doesNotMatch(html, /R0–R4/);
});

test("keeps the consumer assessment independent from the internal console", async () => {
  const [page, userTool, consoleSource, staticIndex, viteConfig] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/user-assessment.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/admin-console.tsx", import.meta.url), "utf8"),
    readFile(new URL("../github-pages/index.html", import.meta.url), "utf8"),
    readFile(new URL("../vite.pages.config.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<UserAssessment/);
  assert.doesNotMatch(page, /AdminConsole/);
  assert.doesNotMatch(page, /#\/admin/);
  assert.match(userTool, /route: "overall"/);
  assert.match(userTool, /route: "specialty"/);
  assert.match(userTool, /stage: "questions"/);
  assert.match(userTool, /帮我找到专项/);
  assert.match(userTool, /ai-drawer/);
  assert.match(userTool, /未触发紧急行动/);
  assert.doesNotMatch(userTool, /type IntentId/);
  assert.doesNotMatch(userTool, /开始前的安全确认/);
  assert.doesNotMatch(userTool, /可能危急或正在迅速加重/);
  assert.doesNotMatch(userTool, /产品方控制台/);
  assert.doesNotMatch(userTool, /流程演示/);
  assert.match(consoleSource, /模型库/);
  assert.match(consoleSource, /路由规则/);
  assert.match(consoleSource, /安全规则/);
  assert.match(consoleSource, /演示会话/);
  assert.match(staticIndex, /zhiheng-health-router\/og\.png/);
  assert.match(viteConfig, /github-pages/);
  assert.match(viteConfig, /\/zhiheng-health-router\//);
});
