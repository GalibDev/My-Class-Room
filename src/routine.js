export const college = "Shyamoli Textile Engineering College";
export const semester = "2nd Year · 2nd Semester";
export const teachers = {
  AK: "Afroz Khan",
  AIK: "S M Alauddin Kabir",
  YA: "Yeamin Ashraf",
  GRH: "Golam Rabbi Hasan",
  ZN: "Zannatul Naim",
  AA: "Ashraful Alam",
  AP: "Ashik Pramanik",
};
export const subjects = [
  {
    id: "cse2201",
    code: "CSE-2201",
    name: "Database Management Systems-I",
    teacherCodes: ["YA"],
  },
  {
    id: "cse2202",
    code: "CSE-2202",
    name: "Design and Analysis of Algorithms-I",
    teacherCodes: ["GRH"],
  },
  {
    id: "cse2203",
    code: "CSE-2203",
    name: "Data and Telecommunication",
    teacherCodes: ["AK"],
  },
  {
    id: "cse2204",
    code: "CSE-2204",
    name: "Computer Architecture and Organization",
    teacherCodes: ["AIK"],
  },
  {
    id: "cse2205",
    code: "CSE-2205",
    name: "Introduction to Mechatronics",
    teacherCodes: ["AA"],
  },
  {
    id: "cse2211",
    code: "CSE-2211",
    name: "Database Management Systems-I Lab",
    teacherCodes: ["YA"],
    lab: true,
  },
  {
    id: "cse2212",
    code: "CSE-2212",
    name: "Design and Analysis of Algorithms-I Lab",
    teacherCodes: ["GRH"],
    lab: true,
  },
  {
    id: "cse2213",
    code: "CSE-2213",
    name: "Data and Telecommunication Lab",
    teacherCodes: ["AK"],
    lab: true,
  },
  {
    id: "cse2216",
    code: "CSE-2216",
    name: "Application Development Lab",
    teacherCodes: ["YA", "GRH"],
    lab: true,
  },
].map((s) => ({
  ...s,
  teacher: s.teacherCodes.map((c) => teachers[c]).join(" & "),
}));
export const periods = [
  { number: 1, start: "8:00 AM", end: "8:50 AM" },
  { number: 2, start: "8:50 AM", end: "9:40 AM" },
  { number: 3, start: "10:10 AM", end: "11:00 AM" },
  { number: 4, start: "11:00 AM", end: "11:50 AM" },
  { number: 5, start: "11:50 AM", end: "12:40 PM" },
];
export const week = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
// Period spans follow the supplied 4th semester routine dated 08 Oct 2026.
export const routine = {
  Sunday: [
    ["cse2203", 1],
    ["extra", 2],
    ["cse2201", 3],
    ["cse2204", 4],
    ["cse2202", 5],
  ],
  Monday: [
    ["cse2205", 1],
    ["cse2203", 2],
    ["cse2216", 3, 4],
    ["cse2201", 5],
  ],
  Tuesday: [
    ["cse2203", 1],
    ["cse2205", 2],
    ["cse2204", 3],
    ["cse2202", 4],
    ["extra", 5],
  ],
  Wednesday: [
    ["cse2201", 1],
    ["cse2202", 2],
    ["cse2212", 3, 4],
    ["extra", 5],
  ],
  Thursday: [
    ["cse2211", 1, 2],
    ["cse2204", 3],
    ["cse2213", 4, 5],
  ],
};
export function dayOf(date) {
  return new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
  });
}
export function timeOf(start, end = start) {
  return `${periods[start - 1].start} – ${periods[end - 1].end}`;
}
export function classesFor(date) {
  return (routine[dayOf(date)] || []).map(([id, start, end = start]) => ({
    ...subjects.find((s) => s.id === id),
    id,
    start,
    end,
    time: timeOf(start, end),
    extra: id === "extra",
    name:
      id === "extra"
        ? "Extra-curricular activities"
        : subjects.find((s) => s.id === id).name,
  }));
}
export function subjectTime(id, date) {
  return (
    classesFor(date).find((s) => s.id === id)?.time ||
    "Not scheduled on this day"
  );
}
