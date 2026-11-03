import React, { useEffect, useState } from "react";

import { GraduationCap, ArrowRight } from "lucide-react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db, configured } from "./firebase";
import "./style.css";
import Classroom from "./Classroom";
import { subjects } from "./routine";

const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Dhaka",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const names = [
  "Aarav Rahman",
  "Afsana Ahmed",
  "Arif Hossain",
  "Fahim Islam",
  "Farhana Akter",
  "Mehedi Hasan",
  "Nabila Tasnim",
  "Nafis Ahmed",
  "Rafiul Islam",
  "Sadia Sultana",
  "Samiul Haque",
  "Tanvir Hasan",
];
const seedStudents = names.map((name, i) => ({
  id: `demo-${i}`,
  name,
  roll: `${2301001 + i}`,
  role: "student",
}));
const sessionId = (subject, date) => `${subject}_${date}`;
export default function App() {
  const [subject, setSubject] = useState("cse2201"),
    [date, setDate] = useState(today),
    [notice, setNotice] = useState(""),
    [modal, setModal] = useState(null),
    [authUser, setAuthUser] = useState(null),
    [profile, setProfile] = useState(null),
    [mode, setMode] = useState("cr"),
    [students, setStudents] = useState(() =>
      configured
        ? []
        : JSON.parse(localStorage.getItem("mcr-students") || "null") ||
          seedStudents,
    ),
    [sessions, setSessions] = useState(() =>
      configured
        ? {}
        : JSON.parse(localStorage.getItem("mcr-sessions") || "{}"),
    ),
    [records, setRecords] = useState(() =>
      configured
        ? {}
        : JSON.parse(localStorage.getItem("mcr-records") || "null") ||
          Object.fromEntries(
            seedStudents.slice(0, 8).map((s) => [
              `${sessionId("cse2201", today)}_${s.id}`,
              {
                studentId: s.id,
                subject: "cse2201",
                date: today,
                status: "present",
              },
            ]),
          ),
    ),
    [loading, setLoading] = useState(configured),
    [formError, setFormError] = useState("");
  const current = profile || {
    ...seedStudents[8],
    name: mode === "cr" ? "Galib Ahmed" : "Rafiul Islam",
    role: mode,
  };
  const isCR = current.role === "cr";
  const sub = subjects.find((s) => s.id === subject);
  const sid = sessionId(subject, date);
  const open = !!sessions[sid]?.open;
  useEffect(() => {
    if (!configured) {
      localStorage.setItem("mcr-students", JSON.stringify(students));
      localStorage.setItem("mcr-sessions", JSON.stringify(sessions));
      localStorage.setItem("mcr-records", JSON.stringify(records));
    }
  }, [students, sessions, records]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    if (!configured) return;
    return onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      setProfile(null);
      setStudents([]);
      setRecords({});
      setSessions({});
      if (user) {
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) setProfile({ id: user.uid, ...snap.data() });
          else
            setFormError(
              "Your account needs a classroom profile. Contact your CR.",
            );
        } catch (e) {
          setFormError(e.message);
        }
      }
      setLoading(false);
    });
  }, []);
  useEffect(() => {
    if (!profile) return;
    const fail = (e) => setNotice(e.message);
    const a = onSnapshot(
      query(collection(db, "users"), where("role", "==", "student")),
      (s) => setStudents(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      fail,
    );
    const b = onSnapshot(
      collection(db, "sessions"),
      (s) =>
        setSessions(Object.fromEntries(s.docs.map((d) => [d.id, d.data()]))),
      fail,
    );
    const c = onSnapshot(
      isCR
        ? collection(db, "attendance")
        : query(
            collection(db, "attendance"),
            where("studentId", "==", profile.id),
          ),
      (s) =>
        setRecords(Object.fromEntries(s.docs.map((d) => [d.id, d.data()]))),
      fail,
    );
    return () => {
      a();
      b();
      c();
    };
  }, [profile]);
  const status = (studentId, subjectId = subject, day = date) =>
    records[`${sessionId(subjectId, day)}_${studentId}`]?.status;
  const present = students.filter((s) => status(s.id) === "present").length;
  const pending = students.filter((s) => status(s.id) === "pending");
  const percent = students.length
    ? Math.round((present / students.length) * 100)
    : 0;
  async function mark(studentId, value) {
    try {
      const id = `${sid}_${studentId}`;
      const record = { studentId, subject, date, status: value };
      if (configured) await setDoc(doc(db, "attendance", id), record);
      else setRecords((r) => ({ ...r, [id]: record }));
      setNotice(
        value === "pending"
          ? "Request sent to your class representative."
          : `Attendance marked ${value}.`,
      );
    } catch (e) {
      setNotice(e.message);
    }
  }
  async function toggle(subjectId = subject) {
    try {
      const targetId = sessionId(subjectId, date);
      const wasOpen = !!sessions[targetId]?.open;
      const value = { subject: subjectId, date, open: !wasOpen };
      if (configured) await setDoc(doc(db, "sessions", targetId), value);
      else setSessions((s) => ({ ...s, [targetId]: value }));
      setNotice(
        wasOpen
          ? "Student requests are now closed."
          : "Students can now request attendance.",
      );
    } catch (e) {
      setNotice(e.message);
    }
  }
  function download() {
    const lines = [
      ["Date", "Subject", "Teacher", "Roll", "Name", "Status"],
      ...students.map((s) => [
        date,
        sub.name,
        sub.teacher,
        s.roll,
        s.name,
        status(s.id) || "unmarked",
      ]),
    ];
    const csv =
      "\uFEFF" +
      lines
        .map((row) =>
          row.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(","),
        )
        .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${sub.code.replace(" ", "-")}-${date}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Attendance report downloaded.");
  }
  async function bulkMark(ids, markRestAbsent = false) {
    const updates = students
      .filter((s) => markRestAbsent || ids.includes(s.id))
      .map((s) => ({
        id: `${sid}_${s.id}`,
        data: {
          studentId: s.id,
          subject,
          date,
          status: ids.includes(s.id) ? "present" : "absent",
        },
      }));
    if (configured) {
      if (updates.length > 500)
        throw new Error("Please mark fewer than 500 students at a time.");
      const batch = writeBatch(db);
      updates.forEach((r) => batch.set(doc(db, "attendance", r.id), r.data));
      await batch.commit();
    } else
      setRecords((r) => ({
        ...r,
        ...Object.fromEntries(updates.map((x) => [x.id, x.data])),
      }));
  }
  async function login(e) {
    e.preventDefault();
    setFormError("");
    const f = new FormData(e.target);
    try {
      if (modal === "register") {
        const name = f.get("name").trim(),
          roll = f.get("roll").trim();
        if (!name || !/^\d{1,20}$/.test(roll))
          throw Error("Enter your name and a valid numeric roll.");
        const result = await createUserWithEmailAndPassword(
          auth,
          f.get("email"),
          f.get("password"),
        );
        await setDoc(doc(db, "users", result.user.uid), {
          name,
          roll,
          role: "student",
        });
        setProfile({ id: result.user.uid, name, roll, role: "student" });
        setAuthUser(result.user);
      } else
        await signInWithEmailAndPassword(
          auth,
          f.get("email"),
          f.get("password"),
        );
      setModal(null);
    } catch (e) {
      setFormError(e.message);
    }
  }
  if (loading)
    return (
      <div className="auth-screen">
        <GraduationCap size={48} />
        <h2>Opening your classroom…</h2>
      </div>
    );
  if (configured && !profile)
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="brand-icon">
            <GraduationCap />
          </div>
          <p className="eyebrow">A LITTLE MORE ORGANIZED.</p>
          <h1>
            Your class.
            <br />
            All together.
          </h1>
          <p>
            Welcome to My Class Room. Sign in to keep every class accounted for.
          </p>
          <form onSubmit={login}>
            {modal === "register" && (
              <>
                <label>
                  Full name
                  <input name="name" required />
                </label>
                <label>
                  Student roll
                  <input name="roll" required />
                </label>
              </>
            )}
            <label>
              Email
              <input name="email" type="email" required />
            </label>
            <label>
              Password
              <input name="password" type="password" minLength={6} required />
            </label>
            {formError && (
              <p role="alert" className="error">
                {formError}
              </p>
            )}
            <button className="primary">
              {modal === "register" ? "Create student account" : "Sign in"}
              <ArrowRight size={16} />
            </button>
          </form>
          <button
            className="text-btn"
            onClick={() => {
              setModal(modal === "register" ? null : "register");
              setFormError("");
            }}
          >
            {modal === "register"
              ? "Already a member? Sign in"
              : "New student? Create an account"}
          </button>
          {authUser && (
            <button className="text-btn" onClick={() => signOut(auth)}>
              Sign out
            </button>
          )}
        </div>
      </div>
    );
  return (
    <Classroom
      {...{
        current,
        isCR,
        subjects,
        students,
        sessions,
        records,
        subject,
        setSubject,
        date,
        setDate,
        status,
        mark,
        toggle,
        open,
        present,
        pending,
        percent,
        download,
        configured,
        mode,
        setMode,
        notice,
        setNotice,
        bulkMark,
      }}
      logout={() => signOut(auth)}
    />
  );
}
