import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  BookOpen,
  Download,
  ArrowUpRight,
  ArrowRight,
  Search,
  Check,
  X,
  Plus,
  Bell,
  GraduationCap,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Send,
  Menu,
  CheckCheck,
} from "lucide-react";
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
} from "firebase/firestore";
import { auth, db, configured } from "./firebase";
import "./style.css";

const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Dhaka",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const subjects = [
  {
    id: "cse201",
    name: "Data Structures",
    code: "CSE 201",
    time: "09:00 – 10:30",
    room: "Room 402",
    color: "green",
    abbr: "DS",
  },
  {
    id: "cse203",
    name: "Discrete Mathematics",
    code: "CSE 203",
    time: "11:00 – 12:30",
    room: "Room 305",
    color: "purple",
    abbr: "DM",
  },
  {
    id: "cse205",
    name: "Digital Logic Design",
    code: "CSE 205",
    time: "14:00 – 15:30",
    room: "Lab 201",
    color: "orange",
    abbr: "DL",
  },
];
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
function App() {
  const [page, setPage] = useState("Overview"),
    [subject, setSubject] = useState("cse201"),
    [date, setDate] = useState(today),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("All students"),
    [notice, setNotice] = useState(""),
    [menu, setMenu] = useState(false),
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
            seedStudents
              .slice(0, 8)
              .map((s) => [
                `${sessionId("cse201", today)}_${s.id}`,
                {
                  studentId: s.id,
                  subject: "cse201",
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
  async function toggle() {
    try {
      const value = { subject, date, open: !open };
      if (configured) await setDoc(doc(db, "sessions", sid), value);
      else setSessions((s) => ({ ...s, [sid]: value }));
      setNotice(
        open
          ? "Student requests are now closed."
          : "Students can now request attendance.",
      );
    } catch (e) {
      setNotice(e.message);
    }
  }
  function download() {
    const lines = [
      ["Date", "Subject", "Roll", "Name", "Status"],
      ...students.map((s) => [
        date,
        sub.name,
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
  function shiftDate(n) {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + n);
    setDate(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    );
  }
  const visible = students.filter(
    (s) =>
      (s.name + " " + s.roll).toLowerCase().includes(search.toLowerCase()) &&
      (filter === "All students" ||
        (status(s.id) || "unmarked") === filter.toLowerCase()),
  );
  const navigation = [
    ["Overview", LayoutDashboard],
    ["Attendance", ClipboardCheck],
    ["Students", Users],
    ["Subjects", BookOpen],
    ["Reports", Download],
  ];
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
    <div className="app">
      <aside className={menu ? "sidebar shown" : "sidebar"}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("Overview");
          }}
        >
          <span className="brand-icon">
            <GraduationCap size={24} />
          </span>
          <span>
            my class room
            <span className="brand-caption">A little more organized.</span>
          </span>
        </a>
        <div className="workspace">
          <span className="workspace-icon">C</span>
          <div>
            <strong>CSE · Section A</strong>
            <small>Class of 2027</small>
          </div>
          <span className="workspace-dot" />
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          {navigation.map(([title, Icon]) => (
            <button
              key={title}
              className={page === title ? "nav-item active" : "nav-item"}
              onClick={() => {
                setPage(title);
                setMenu(false);
              }}
            >
              <Icon size={19} />
              {title}
              {title === "Attendance" && pending.length > 0 && (
                <span className="nav-count">{pending.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="tip">
            <span>✦</span>
            <strong>Every class counts.</strong>
            <p>
              A small check-in today.
              <br />A better record tomorrow.
            </p>
            <div className="tip-lines">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
          <button className="nav-item" onClick={() => setModal("settings")}>
            <Settings size={18} />
            Classroom settings
          </button>
          <div className="user">
            <span className="avatar">
              {current.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              <strong>{current.name}</strong>
              <small>
                {isCR ? "Class representative" : "Student · " + current.roll}
              </small>
            </div>
            {configured ? (
              <button
                className="icon-btn"
                aria-label="Sign out"
                onClick={() => signOut(auth)}
              >
                <LogOut size={17} />
              </button>
            ) : (
              <span className="role-badge">{isCR ? "CR" : "ST"}</span>
            )}
          </div>
        </div>
      </aside>
      {menu && <div className="overlay" onClick={() => setMenu(false)} />}
      <div className="main">
        <header className="topbar">
          <div>
            <button
              className="mobile-menu icon-btn"
              aria-label="Open navigation"
              onClick={() => setMenu(true)}
            >
              <Menu />
            </button>
            <span className="breadcrumb">
              Workspace <ChevronRight size={13} /> <b>{page}</b>
            </span>
          </div>
          <div className="top-right">
            <span className="demo-label">
              {configured ? "Firebase connected" : "Interactive demo"}
            </span>
            {!configured && (
              <select
                aria-label="Demo role"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="cr">CR view</option>
                <option value="student">Student view</option>
              </select>
            )}
            <button
              className="icon-btn notification"
              aria-label="View attendance requests"
              onClick={() => {
                setPage("Attendance");
                setFilter("Pending");
              }}
            >
              <Bell size={19} />
              {pending.length > 0 && <i />}
            </button>
            <span className="mini-avatar">{current.name[0]}</span>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <p className="eyebrow">YOUR CLASSROOM, AT A GLANCE</p>
              <h1>
                {page === "Overview"
                  ? `A good day to show up${isCR ? "" : ", " + current.name.split(" ")[0]}`
                  : page === "Attendance"
                    ? "Attendance, made simple"
                    : page === "Students"
                      ? "The people in your class"
                      : page === "Subjects"
                        ? "A place for every subject"
                        : "Every class, on record"}
                <span className="heading-dot">.</span>
              </h1>
              <p className="subtitle">
                {isCR
                  ? "Less paperwork. More presence. Let’s get your class in order."
                  : "Your attendance, requests and class updates. All in one place."}
              </p>
            </div>
            <div className="date-label">
              <CalendarDays size={17} />
              {new Date(date + "T12:00:00").toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
          {page === "Overview" && (
            <>
              <section className="welcome">
                <div>
                  <span className="welcome-tag">
                    <span /> CSE DEPARTMENT · SEMESTER 3
                  </span>
                  <h2>
                    Your classroom.
                    <br />A little more connected.
                  </h2>
                  <p>
                    Keep track of who’s here, make every subject count,
                    <br className="desktop" /> and leave the spreadsheets
                    behind.
                  </p>
                  <button onClick={() => setPage("Attendance")}>
                    {" "}
                    {isCR ? "Take attendance" : "View my attendance"}
                    <ArrowUpRight size={17} />
                  </button>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <div className="art-spark">✦</div>
                  <div className="paper back-paper" />
                  <div className="paper front-paper">
                    <div className="paper-title">
                      <span />
                      <span>CLASS ATTENDANCE</span>
                      <i />
                    </div>
                    {[0, 1, 2, 3].map((n) => (
                      <div className="paper-row" key={n}>
                        <span className="paper-avatar" />
                        <span className="paper-line" />
                        <span className="paper-check">
                          <Check size={13} />
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="art-chip">
                    <span>
                      <CheckCheck size={18} />
                    </span>
                    <div>
                      All accounted for
                      <small>One less thing to worry about.</small>
                    </div>
                  </div>
                  <span className="art-star">+</span>
                </div>
              </section>
              <section className="stats">
                <Stat
                  icon={Users}
                  label="Total students"
                  value={students.length}
                  note="One classroom. Many possibilities."
                />
                <Stat
                  icon={ClipboardCheck}
                  label="Present today"
                  value={present}
                  suffix={`/ ${students.length}`}
                  note={`${percent}% attendance in ${sub.code}`}
                  green
                />
                <Stat
                  icon={Send}
                  label="Pending requests"
                  value={pending.length.toString().padStart(2, "0")}
                  note="A quick review goes a long way."
                />
                <Stat
                  icon={BookOpen}
                  label="Subjects this semester"
                  value="03"
                  note="A little learning, every day."
                />
              </section>
            </>
          )}
          {!isCR && (
            <section className="panel student-profile">
              <div className="section-title">
                <div>
                  <h2>My attendance</h2>
                  <p>
                    {current.name} · Roll {current.roll}
                  </p>
                </div>
                <input
                  aria-label="Attendance date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="subject-grid">
                {subjects.map((s) => {
                  const st = status(current.id, s.id);
                  const canRequest = sessions[sessionId(s.id, date)]?.open;
                  return (
                    <div className="subject-card" key={s.id}>
                      <span className={"subject-icon " + s.color}>
                        {s.abbr}
                      </span>
                      <small>{s.code}</small>
                      <h3>{s.name}</h3>
                      <p>{date}</p>
                      <span className={"status " + (st || "unmarked")}>
                        {st || "Not marked"}
                      </span>
                      <button
                        className="secondary"
                        disabled={
                          !canRequest || st === "pending" || st === "present"
                        }
                        onClick={() => {
                          setSubject(s.id);
                          const record = {
                            studentId: current.id,
                            subject: s.id,
                            date,
                            status: "pending",
                          };
                          const id = `${sessionId(s.id, date)}_${current.id}`;
                          if (configured)
                            setDoc(doc(db, "attendance", id), record)
                              .then(() => setNotice("Request sent."))
                              .catch((e) => setNotice(e.message));
                          else {
                            setRecords((r) => ({ ...r, [id]: record }));
                            setNotice("Request sent.");
                          }
                        }}
                      >
                        {st === "present"
                          ? "You’re present"
                          : st === "pending"
                            ? "Awaiting approval"
                            : canRequest
                              ? "Request present"
                              : "Requests closed"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          {page === "Subjects" ? (
            <section className="panel">
              <div className="section-title">
                <div>
                  <h2>Semester subjects</h2>
                  <p>Your weekly learning lineup.</p>
                </div>
                <span className="pill">3 subjects</span>
              </div>
              <div className="subject-grid">
                {subjects.map((s) => (
                  <button
                    className="subject-card subject-link"
                    key={s.id}
                    onClick={() => {
                      setSubject(s.id);
                      setPage("Attendance");
                    }}
                  >
                    <span className={"subject-icon " + s.color}>{s.abbr}</span>
                    <small>{s.code}</small>
                    <h3>{s.name}</h3>
                    <p>
                      {s.time} · {s.room}
                    </p>
                    <span className="text-link">
                      Open attendance <ArrowRight size={15} />
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : page === "Reports" ? (
            <section className="panel">
              <div className="section-title">
                <div>
                  <h2>Download attendance</h2>
                  <p>A clear record, whenever you need it.</p>
                </div>
                <Download size={22} />
              </div>
              <div className="report-form">
                <label>
                  Subject
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  >
                    {subjects.map((s) => (
                      <option value={s.id} key={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Class date
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
                <div className="report-preview">
                  <ClipboardCheck size={32} />
                  <h3>{sub.name}</h3>
                  <p>
                    {present} present · {pending.length} pending · {date}
                  </p>
                  <small>
                    CSV includes each student’s name, roll, date, subject and
                    status.
                  </small>
                </div>
                {isCR ? (
                  <button className="primary" onClick={download}>
                    <Download size={17} />
                    Download CSV report
                  </button>
                ) : (
                  <p>
                    Your CR manages classroom exports. View your attendance in
                    your profile above.
                  </p>
                )}
              </div>
            </section>
          ) : (
            isCR && (
              <div className="content-grid">
                <section className="panel attendance-panel">
                  <div className="section-title">
                    <div>
                      <h2>
                        {page === "Students"
                          ? "Class directory"
                          : "Attendance register"}{" "}
                        <span className="pill">{students.length} students</span>
                      </h2>
                      <p>
                        {page === "Students"
                          ? "Familiar faces. All in one place."
                          : "A clear view of who’s here and who’s not."}
                      </p>
                    </div>
                    <button
                      className="secondary export"
                      aria-label="Export attendance"
                      onClick={download}
                    >
                      <Download size={15} />
                      <span>Export</span>
                    </button>
                  </div>
                  <div className="register-controls">
                    <select
                      aria-label="Select subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    >
                      {subjects.map((s) => (
                        <option value={s.id} key={s.id}>
                          {s.name} · {s.code}
                        </option>
                      ))}
                    </select>
                    <div className="date-picker">
                      <button
                        aria-label="Previous day"
                        onClick={() => shiftDate(-1)}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <input
                        aria-label="Class date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                      <button
                        aria-label="Next day"
                        onClick={() => shiftDate(1)}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="request-bar">
                    <span className={"live-dot " + (open ? "on" : "")} />
                    <div>
                      <strong>Student attendance requests</strong>
                      <small>
                        {open
                          ? "Open for this subject and date"
                          : "Turn on to let students request present"}
                      </small>
                    </div>
                    <button
                      role="switch"
                      aria-checked={open}
                      aria-label="Allow student attendance requests"
                      className={"toggle " + (open ? "enabled" : "")}
                      onClick={toggle}
                    >
                      <span />
                    </button>
                  </div>
                  <div className="search-row">
                    <div className="search-input">
                      <Search size={17} />
                      <input
                        aria-label="Search student name or roll"
                        placeholder="Search by name or roll number…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <select
                      aria-label="Filter attendance"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      {[
                        "All students",
                        "Present",
                        "Absent",
                        "Pending",
                        "Unmarked",
                      ].map((f) => (
                        <option key={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>STUDENT</th>
                          <th>ROLL NUMBER</th>
                          <th>STATUS</th>
                          <th className="right">MARK ATTENDANCE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map((s, i) => (
                          <tr key={s.id}>
                            <td>
                              <div className="student-cell">
                                <span className={"avatar avatar-" + (i % 4)}>
                                  {s.name
                                    .split(" ")
                                    .map((x) => x[0])
                                    .slice(0, 2)
                                    .join("")}
                                </span>
                                <strong>{s.name}</strong>
                              </div>
                            </td>
                            <td className="roll">{s.roll}</td>
                            <td>
                              <span
                                className={
                                  "status " + (status(s.id) || "unmarked")
                                }
                              >
                                <i />
                                {status(s.id) || "Unmarked"}
                              </span>
                            </td>
                            <td>
                              <div className="mark-actions">
                                <button
                                  aria-label={`Mark ${s.name} present`}
                                  className={
                                    status(s.id) === "present"
                                      ? "selected-present"
                                      : ""
                                  }
                                  onClick={() => mark(s.id, "present")}
                                >
                                  <Check size={16} />
                                  <span>Present</span>
                                </button>
                                <button
                                  aria-label={`Mark ${s.name} absent`}
                                  className={
                                    status(s.id) === "absent"
                                      ? "selected-absent"
                                      : ""
                                  }
                                  onClick={() => mark(s.id, "absent")}
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!visible.length && (
                      <div className="empty">
                        <Users />
                        <h3>No students found</h3>
                        <p>
                          {students.length
                            ? "Try another name, roll or attendance filter."
                            : "Students appear here after creating their accounts."}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="table-footer">
                    <span>
                      Showing {visible.length} of {students.length} students
                    </span>
                    <span>
                      <span className="live-dot on" />{" "}
                      {configured
                        ? "Synced with your classroom"
                        : "Saved on this device"}
                    </span>
                  </div>
                </section>
                <aside className="right-column">
                  <section className="panel day-card">
                    <div className="section-title">
                      <h2>Today’s classes</h2>
                      <span className="pill">03</span>
                    </div>
                    <p className="muted">A little structure for your day.</p>
                    {subjects.map((s, i) => (
                      <button
                        className={
                          "class-item " + (subject === s.id ? "chosen" : "")
                        }
                        key={s.id}
                        onClick={() => setSubject(s.id)}
                      >
                        <div className="class-time">
                          <span>{s.time.split(" – ")[0]}</span>
                          <i />
                        </div>
                        <div className="class-info">
                          <span className={"subject-icon " + s.color}>
                            {s.abbr}
                          </span>
                          <small>{s.code}</small>
                          <h3>{s.name}</h3>
                          <p>
                            {s.room} <span>·</span>{" "}
                            {i === 0 ? "1.5 hours" : "90 min"}
                          </p>
                          {subject === s.id && (
                            <span className="current-subject">
                              Selected subject <ArrowUpRight size={12} />
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </section>
                  <section className="quick-card">
                    <div className="quick-icon">
                      <ClipboardCheck size={21} />
                    </div>
                    <h3>Know a roll? Mark it.</h3>
                    <p>
                      Skip the scroll. Take attendance directly with a roll
                      number.
                    </p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const input = e.target.elements.roll;
                        const student = students.find(
                          (s) => s.roll === input.value.trim(),
                        );
                        if (student) {
                          mark(student.id, "present");
                          input.value = "";
                        } else
                          setNotice("No student found with this roll number.");
                      }}
                    >
                      <input
                        name="roll"
                        aria-label="Quick attendance roll"
                        placeholder="Enter roll number"
                        required
                        inputMode="numeric"
                      />
                      <button aria-label="Mark roll present">
                        <ArrowRight size={19} />
                      </button>
                    </form>
                  </section>
                  <div className="small-note">
                    <span>✧</span> A present today.
                    <br />A possibility tomorrow.
                  </div>
                </aside>
              </div>
            )
          )}
          <footer>
            Made for your everyday classroom.
            <span>
              my class room <span>✦</span>
            </span>
          </footer>
        </main>
      </div>
      {notice && (
        <div className="toast" role="status">
          <Check size={18} />
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {modal === "settings" && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Classroom settings"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close icon-btn"
              aria-label="Close settings"
              onClick={() => setModal(null)}
            >
              <X />
            </button>
            <span className="brand-icon">
              <GraduationCap />
            </span>
            <h2>Your classroom</h2>
            <p>CSE · Section A · Class of 2027</p>
            <div className="setting-row">
              <span>Database</span>
              <strong>
                {configured ? "Firebase Firestore" : "Local demo storage"}
              </strong>
            </div>
            <div className="setting-row">
              <span>Your role</span>
              <strong>{isCR ? "Class representative" : "Student"}</strong>
            </div>
            <p className="muted">
              {configured
                ? "Roles are managed securely by the Firebase project administrator."
                : "Demo changes stay in this browser. Add your Firebase configuration to connect real accounts and shared records."}
            </p>
            <button className="primary" onClick={() => setModal(null)}>
              Back to classroom
              <ArrowRight size={16} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
function Stat({ icon: Icon, label, value, suffix, note, green }) {
  return (
    <article className={"stat " + (green ? "green-stat" : "")}>
      <div className="stat-top">
        <span>{label}</span>
        <Icon size={18} />
      </div>
      <div className="stat-value">
        {value}
        <small>{suffix}</small>
        {green && (
          <span className="stat-trend">
            <ArrowUpRight size={13} />
            Today
          </span>
        )}
      </div>
      <p>{note}</p>
    </article>
  );
}
createRoot(document.getElementById("root")).render(<App />);
