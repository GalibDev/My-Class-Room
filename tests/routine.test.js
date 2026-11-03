import test from "node:test";
import assert from "node:assert/strict";
import {
  subjects,
  routine,
  classesFor,
  subjectTime,
  teachers,
} from "../src/routine.js";

test("routine covers all five periods exactly once each teaching day", () => {
  for (const entries of Object.values(routine)) {
    const occupied = entries.flatMap(([, start, end = start]) =>
      Array.from({ length: end - start + 1 }, (_, i) => start + i),
    );
    assert.deepEqual(occupied, [1, 2, 3, 4, 5]);
    for (const [id] of entries)
      assert.ok(id === "extra" || subjects.some((s) => s.id === id));
  }
  assert.equal(subjects.length, 9);
});
test("Wednesday uses the supplied morning routine and double-period algorithms lab", () => {
  assert.deepEqual(
    classesFor("2026-11-04").map((s) => [s.id, s.time]),
    [
      ["cse2201", "8:00 AM – 8:50 AM"],
      ["cse2202", "8:50 AM – 9:40 AM"],
      ["cse2212", "10:10 AM – 11:50 AM"],
      ["extra", "11:50 AM – 12:40 PM"],
    ],
  );
});
test("Thursday labs span the correct periods; Friday and Saturday are free", () => {
  assert.equal(subjectTime("cse2211", "2026-11-05"), "8:00 AM – 9:40 AM");
  assert.equal(subjectTime("cse2213", "2026-11-05"), "11:00 AM – 12:40 PM");
  assert.deepEqual(classesFor("2026-11-06"), []);
  assert.deepEqual(classesFor("2026-11-07"), []);
  assert.equal(
    subjectTime("cse2202", "2026-11-05"),
    "Not scheduled on this day",
  );
});
test("application development has both instructors; every course resolves faculty names", () => {
  assert.equal(
    subjects.find((s) => s.id === "cse2216").teacher,
    "Yeamin Ashraf & Golam Rabbi Hasan",
  );
  for (const s of subjects)
    assert.equal(s.teacher, s.teacherCodes.map((c) => teachers[c]).join(" & "));
});
