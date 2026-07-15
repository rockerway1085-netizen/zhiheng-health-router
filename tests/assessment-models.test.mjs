import assert from "node:assert/strict";
import test from "node:test";

import {
  OVERALL_QUESTIONS,
  SPECIALTIES,
  getVisibleQuestions,
} from "../app/assessment-models.ts";

test("runs a 29-item overall profile across seven distinct constructs", () => {
  assert.equal(OVERALL_QUESTIONS.length, 29);
  assert.equal(new Set(OVERALL_QUESTIONS.map((question) => question.dimension)).size, 7);
  assert.ok(OVERALL_QUESTIONS.every((question) => question.section === "core"));
});

test("keeps specialty core instruments separate from supplemental and safety questions", () => {
  const expectedCounts = {
    sleep: 14,
    fatigue: 14,
    pain: 14,
    anxiety: 13,
    depression: 13,
    function: 17,
  };

  for (const specialty of SPECIALTIES) {
    assert.equal(specialty.questions.length, expectedCounts[specialty.id]);
    assert.equal(
      specialty.questions.filter((question) => question.section === "core").length,
      specialty.instrument.coreItems,
    );
    assert.ok(
      specialty.questions
        .filter((question) => question.section === "supplemental" || question.section === "safety")
        .every((question) => question.scored === false),
    );
    assert.ok(
      specialty.questions
        .filter((question) => question.safetyRule)
        .every((question) => question.scored === false),
    );
  }
});

test("adds the sleep safety follow-up only when daytime impairment warrants it", () => {
  const sleep = SPECIALTIES.find((specialty) => specialty.id === "sleep");
  assert.ok(sleep);
  assert.equal(getVisibleQuestions(sleep.questions, {}).length, 13);
  assert.equal(getVisibleQuestions(sleep.questions, { "sleep-impact-1": 2 }).length, 13);
  assert.equal(getVisibleQuestions(sleep.questions, { "sleep-impact-1": 3 }).length, 14);
});
