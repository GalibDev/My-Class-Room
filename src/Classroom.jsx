import React, { useState } from "react";
import {
  GraduationCap,
  Bell,
  Home,
  BookOpen,
  Clock3,
  UserRound,
  Users,
  ChartNoAxesColumnIncreasing,
  Play,
  ChevronRight,
  ArrowLeft,
  Check,
  X,
  Search,
  Hash,
  Info,
  Download,
  Printer,
  Square,
  CalendarDays,
  Send,
  LogOut,
  FileSpreadsheet,
  CheckCheck,
} from "lucide-react";

import "./purple.css";

const initials = (name) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
export default function Classroom({
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
  logout,
  bulkMark,
}) {
  const [screen, setScreen] = useState("Home"),
    [tab, setTab] = useState("Requests"),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("All"),
    [selected, setSelected] = useState([]),
    [rollText, setRollText] = useState(""),
    [busy, setBusy] = useState(false);
  const sub = subjects.find((s) => s.id === subject),
    absents = students.filter((s) => status(s.id) === "absent").length;
  const dateText = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const go = (s) => {
    setScreen(s);
    setSearch("");
    setFilter("All");
    setSelected([]);
  };
  function enter(s) {
    setSubject(s.id);
    setTab(isCR ? "Requests" : "Student List");
    go("Attendance");
  }
  const liveCount = subjects.filter(
    (s) => sessions[`${s.id}_${date}`]?.open,
  ).length;
  const presentStudents = students.filter((s) => status(s.id) === "present");
  const rolls = [...new Set(rollText.split(/[\s,;]+/).filter(Boolean))];
  async function save(ids, rest = false) {
    setBusy(true);
    try {
      await bulkMark(ids, rest);
      setSelected([]);
      setNotice(
        `${ids.length} student${ids.length === 1 ? "" : "s"} marked present${rest ? "; remaining students marked absent" : ""}.`,
      );
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  }
  function manual(e) {
    e.preventDefault();
    const unknown = rolls.filter((r) => !students.some((s) => s.roll === r));
    if (!rolls.length) {
      setNotice("Enter at least one roll number.");
      return;
    }
    if (unknown.length) {
      setNotice(
        `Unknown roll: ${unknown.join(", ")}. Please check before saving.`,
      );
      return;
    }
    save(
      students.filter((s) => rolls.includes(s.roll)).map((s) => s.id),
      true,
    );
  }
  async function pdf() {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF();
    let y = 20;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(109, 40, 217);
    pdf.text("My Class Room", 16, y);
    y += 10;
    pdf.setTextColor(25, 22, 48);
    pdf.setFontSize(13);
    pdf.text("Class Attendance — Present List", 16, y);
    y += 12;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    [
      `${sub.code}: ${sub.name}`,
      "Section: A",
      `Date: ${dateText}`,
      `Time: ${sub.time}`,
    ].forEach((t) => {
      pdf.text(t, 16, y);
      y += 7;
    });
    y += 5;
    const header = () => {
      pdf.setFillColor(237, 226, 255);
      pdf.rect(16, y - 5, 178, 9, "F");
      pdf.setFont("helvetica", "bold");
      pdf.text("SL", 20, y);
      pdf.text("Roll", 38, y);
      pdf.text("Student Name", 90, y);
      pdf.setFont("helvetica", "normal");
      y += 10;
    };
    header();
    presentStudents.forEach((s, i) => {
      if (y > 275) {
        pdf.addPage();
        y = 20;
        header();
      }
      pdf.text(String(i + 1), 20, y);
      pdf.text(s.roll, 38, y);
      pdf.text(s.name, 90, y);
      pdf.setDrawColor(229, 219, 244);
      pdf.line(16, y + 3, 194, y + 3);
      y += 9;
    });
    if (y > 270) {
      pdf.addPage();
      y = 20;
    }
    pdf.setFont("helvetica", "bold");
    pdf.text(`Total Present: ${present} / ${students.length}`, 16, y + 9);
    pdf.save(`present-${sub.code.replaceAll(" ", "-")}-${date}.pdf`);
    setNotice("Present list downloaded as PDF.");
  }
  const filtered = students.filter(
    (s) =>
      (s.name + " " + s.roll).toLowerCase().includes(search.toLowerCase()) &&
      (filter === "All" || status(s.id) === filter.toLowerCase()),
  );
  const nav = [
    ["Home", Home],
    ["Subjects", BookOpen],
    ["History", Clock3],
    ["Profile", UserRound],
  ];
  function subjectCard(s) {
    const active = !!sessions[`${s.id}_${date}`]?.open;
    return (
      <div className={"p-subject " + (active ? "live" : "")} key={s.id}>
        <button className="p-subject-main" onClick={() => enter(s)}>
          <span className="p-book">
            <BookOpen size={24} />
          </span>
          <span className="p-subject-copy">
            <strong>{s.code}</strong>
            <span>{s.name}</span>
            <span className={"p-badge " + (active ? "is-live" : "is-off")}>
              <i />
              {active ? "Attendance ON" : "OFF"}
            </span>
            <small>
              <Clock3 size={13} />
              {s.time}
            </small>
          </span>
        </button>
        <div className="p-subject-actions">
          {isCR && (
            <button
              className={"p-switch " + (active ? "on" : "")}
              role="switch"
              aria-checked={active}
              aria-label={`Allow requests for ${s.name}`}
              onClick={() => toggle(s.id)}
            >
              <span />
            </button>
          )}
          <button
            className="p-chevron"
            aria-label={`Open ${s.name}`}
            onClick={() => enter(s)}
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </div>
    );
  }
  const avatar = (s, i = 0) => (
    <span className={"p-avatar tone-" + (i % 4)}>{initials(s.name)}</span>
  );
  return (
    <div className="purple-app">
      <div className="p-shell">
        <div className="p-desktop-brand">
          <GraduationCap size={22} />
          <span>My Class Room</span>
          <small>YOUR EVERYDAY CLASSROOM</small>
        </div>
        <div className="p-demo-tools">
          <span>
            <i />
            {configured ? "Connected classroom" : "Interactive demo"}
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
        </div>
        {screen === "Home" ? (
          <>
            <header className="p-home-header">
              <div className="p-brand">
                <GraduationCap size={43} strokeWidth={1.5} />
                <div>
                  <h1>My Class Room</h1>
                  <p>{isCR ? "CR Panel" : "Student Panel"}</p>
                </div>
                <button
                  aria-label="View requests"
                  className="p-bell"
                  onClick={() => {
                    setTab("Requests");
                    go("Attendance");
                  }}
                >
                  <Bell size={24} />
                  {pending.length > 0 && <span>{pending.length}</span>}
                </button>
              </div>
              <div className="p-greeting">
                {avatar(current)}
                <div>
                  <h2>
                    Hi, {current.name.split(" ")[0]} <span>👋</span>
                  </h2>
                  <strong>
                    {isCR
                      ? "Class Representative (CR)"
                      : "Welcome to your classroom"}
                  </strong>
                  <p>CSE 3rd Year · Section A</p>
                </div>
                <span className="p-wave" />
                <span className="p-wave wave-two" />
              </div>
            </header>
            <div className="p-content p-home-content">
              <div className="p-stats">
                {[
                  [BookOpen, subjects.length, "Subjects", "violet"],
                  [Play, liveCount, "Live Class", "green"],
                  [Users, present, "Present", "violet"],
                  [
                    ChartNoAxesColumnIncreasing,
                    percent + "%",
                    "Attendance",
                    "violet",
                  ],
                ].map(([Icon, value, label, color]) => (
                  <div className="p-stat" key={label}>
                    <span className={color}>
                      <Icon size={25} />
                    </span>
                    <strong>{value}</strong>
                    <small>{label}</small>
                  </div>
                ))}
              </div>
              <button
                className="p-primary p-take"
                onClick={() => go("Subjects")}
              >
                <Play fill="currentColor" size={23} />
                {isCR ? "Take Attendance" : "My Attendance"}
              </button>
              <div className="p-section-heading">
                <h2>Today’s Classes</h2>
                <button onClick={() => go("Subjects")}>View All</button>
              </div>
              <div className="p-date-line">
                <CalendarDays size={14} />
                {dateText}
              </div>
              <div className="p-home-subjects">{subjects.map(subjectCard)}</div>
              <div className="p-home-note">
                <CheckCheck size={20} />
                <div>
                  <strong>Every class counts.</strong>
                  <p>One check-in. A clearer picture.</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <header className="p-page-header">
              <button
                aria-label="Go back"
                onClick={() =>
                  go(
                    screen === "Attendance" || screen === "Report"
                      ? "Subjects"
                      : "Home",
                  )
                }
              >
                <ArrowLeft size={23} />
              </button>
              <div>
                <h1>
                  {screen === "Subjects"
                    ? `My Subjects${isCR ? " (CR Control)" : ""}`
                    : screen === "Attendance"
                      ? `${sub.code} – Attendance`
                      : screen === "Report"
                        ? "Present Card"
                        : screen === "History"
                          ? "Attendance History"
                          : "My Profile"}
                </h1>
                <p>
                  {screen === "Subjects"
                    ? "Manage attendance for each subject"
                    : screen === "Attendance"
                      ? `${sub.name} · Section A`
                      : screen === "History"
                        ? "Every class, kept on record"
                        : screen === "Profile"
                          ? "Your classroom identity"
                          : "Class attendance – present list"}
                </p>
              </div>
              {screen === "Report" ? (
                <button aria-label="Download present card" onClick={pdf}>
                  <Download size={21} />
                </button>
              ) : (
                <span className="p-header-space" />
              )}
            </header>
            <div className="p-content">
              {screen === "Subjects" && (
                <>
                  <label className="p-date-control">
                    <CalendarDays size={17} />
                    <span>Class date</span>
                    <input
                      aria-label="Class date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </label>
                  <div className="p-subjects-list">
                    {subjects.map(subjectCard)}
                  </div>
                  <div className="p-hint">
                    <Info size={18} />
                    <p>
                      {isCR
                        ? "Turn on a subject to let students request attendance. Each date has its own attendance window."
                        : "Open a subject to check your attendance or send a request when your CR enables it."}
                    </p>
                  </div>
                </>
              )}
              {screen === "Attendance" && (
                <>
                  <label className="p-date-control">
                    <CalendarDays size={16} />
                    <input
                      aria-label="Class date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                    <button className="p-text-btn" onClick={() => go("Report")}>
                      Present card
                      <ChevronRight size={15} />
                    </button>
                  </label>
                  <div className={"p-live-banner " + (!open ? "closed" : "")}>
                    <span>
                      <i />
                      {open ? "Attendance is Live" : "Attendance is Closed"}
                    </span>
                    <small>
                      <Clock3 size={16} />
                      {open ? "Requests open" : "Requests disabled"}
                    </small>
                  </div>
                  {isCR ? (
                    <>
                      <div className="p-session-stats">
                        {[
                          [Users, students.length, "Total", "violet"],
                          [Check, present, "Present", "green"],
                          [Clock3, pending.length, "Pending", "amber"],
                          [X, absents, "Absent", "red"],
                        ].map(([Icon, n, label, color]) => (
                          <div key={label} className={color}>
                            <span>
                              <Icon size={23} />
                            </span>
                            <strong>{n}</strong>
                            <small>{label}</small>
                          </div>
                        ))}
                      </div>
                      <div className="p-tabs">
                        {["Requests", "Student List", "Manual (Roll)"].map(
                          (t) => (
                            <button
                              key={t}
                              className={tab === t ? "active" : ""}
                              onClick={() => setTab(t)}
                            >
                              {t}
                              {t === "Requests" ? ` (${pending.length})` : ""}
                            </button>
                          ),
                        )}
                      </div>
                      {tab === "Requests" ? (
                        <>
                          <div className="p-request-list">
                            {pending.map((s, i) => (
                              <div className="p-request" key={s.id}>
                                {avatar(s, i)}
                                <div>
                                  <strong>{s.name}</strong>
                                  <small>
                                    Roll {s.roll} · Awaiting approval
                                  </small>
                                </div>
                                <button
                                  className="p-round green"
                                  aria-label={`Approve ${s.name}`}
                                  onClick={() => mark(s.id, "present")}
                                >
                                  <Check size={22} />
                                </button>
                                <button
                                  className="p-round red"
                                  aria-label={`Decline ${s.name}`}
                                  onClick={() => mark(s.id, "absent")}
                                >
                                  <X size={22} />
                                </button>
                              </div>
                            ))}
                            {!pending.length && (
                              <div className="p-empty">
                                <span>
                                  <CheckCheck size={32} />
                                </span>
                                <h3>You’re all caught up</h3>
                                <p>
                                  {open
                                    ? "New attendance requests will appear here."
                                    : "Open attendance to receive student requests."}
                                </p>
                                <button
                                  className="p-text-btn"
                                  onClick={() => setTab("Student List")}
                                >
                                  Go to student list <ChevronRight size={15} />
                                </button>
                              </div>
                            )}
                          </div>
                          <button
                            className={open ? "p-end" : "p-primary"}
                            onClick={() => toggle()}
                          >
                            {open ? <Square size={19} /> : <Play size={19} />}{" "}
                            {open ? "End Attendance" : "Start Attendance"}
                          </button>
                        </>
                      ) : tab === "Student List" ? (
                        <>
                          <div className="p-filter">
                            {["All", "Present", "Absent", "Pending"].map(
                              (t) => (
                                <button
                                  key={t}
                                  className={filter === t ? "active" : ""}
                                  onClick={() => setFilter(t)}
                                >
                                  {t}{" "}
                                  <small>
                                    (
                                    {t === "All"
                                      ? students.length
                                      : t === "Present"
                                        ? present
                                        : t === "Absent"
                                          ? absents
                                          : pending.length}
                                    )
                                  </small>
                                </button>
                              ),
                            )}
                          </div>
                          <div className="p-search">
                            <Search size={18} />
                            <input
                              aria-label="Search students"
                              placeholder="Search by name or roll…"
                              value={search}
                              onChange={(e) => setSearch(e.target.value)}
                            />
                          </div>
                          <div className="p-student-list">
                            {filtered.map((s, i) => (
                              <div className="p-student" key={s.id}>
                                <input
                                  type="checkbox"
                                  aria-label={`Select ${s.name}`}
                                  checked={selected.includes(s.id)}
                                  onChange={(e) =>
                                    setSelected((ids) =>
                                      e.target.checked
                                        ? [...ids, s.id]
                                        : ids.filter((id) => id !== s.id),
                                    )
                                  }
                                />
                                {avatar(s, i)}
                                <div>
                                  <strong>{s.name}</strong>
                                  <small>{s.roll}</small>
                                </div>
                                <button
                                  aria-label={`Toggle attendance for ${s.name}`}
                                  className={
                                    "p-status " + (status(s.id) || "unmarked")
                                  }
                                  onClick={() =>
                                    mark(
                                      s.id,
                                      status(s.id) === "present"
                                        ? "absent"
                                        : "present",
                                    )
                                  }
                                >
                                  {status(s.id) || "Unmarked"}
                                </button>
                              </div>
                            ))}
                            {!filtered.length && (
                              <div className="p-empty">
                                <Users size={28} />
                                <h3>No students found</h3>
                                <p>Try a different name or roll.</p>
                              </div>
                            )}
                          </div>
                          <div className="p-student-actions">
                            <button
                              className="p-secondary"
                              disabled={!selected.length || busy}
                              onClick={() => save(selected)}
                            >
                              <Users size={18} />
                              Mark Present{" "}
                              {selected.length > 0 && `(${selected.length})`}
                            </button>
                            <button
                              className="p-primary"
                              onClick={() => go("Report")}
                            >
                              <Check size={20} />
                              View Card
                            </button>
                          </div>
                          <p className="p-caption">
                            Attendance changes save automatically.
                          </p>
                        </>
                      ) : (
                        <form className="p-manual" onSubmit={manual}>
                          <div className="p-input-card">
                            <div className="p-manual-heading">
                              <span>
                                <Hash size={28} />
                              </span>
                              <div>
                                <h2>Enter Present Roll Numbers</h2>
                                <p>
                                  Add roll numbers separated by comma,
                                  <br />
                                  space or new line.
                                </p>
                              </div>
                            </div>
                            <textarea
                              aria-label="Present roll numbers"
                              placeholder="2301001, 2301002, 2301004…"
                              value={rollText}
                              onChange={(e) => setRollText(e.target.value)}
                            />
                            <small>{rolls.length} rolls</small>
                          </div>
                          <div className="p-hint">
                            <Info size={25} />
                            <p>
                              The entered rolls will be marked{" "}
                              <strong>Present</strong> and the rest will be{" "}
                              <strong>Absent</strong>.
                            </p>
                          </div>
                          <button
                            disabled={busy || !rolls.length}
                            className="p-primary"
                          >
                            <Check size={23} />
                            {busy ? "Saving attendance…" : "Mark Attendance"}
                          </button>
                        </form>
                      )}
                    </>
                  ) : (
                    <div className="p-student-attendance">
                      <div className="p-my-status">
                        <span
                          className={
                            "p-status " + (status(current.id) || "unmarked")
                          }
                        >
                          {status(current.id) || "Not marked"}
                        </span>
                        <h2>
                          {status(current.id) === "present"
                            ? "You’re present!"
                            : status(current.id) === "pending"
                              ? "Request sent"
                              : "Ready for class?"}
                        </h2>
                        <p>
                          {status(current.id) === "pending"
                            ? "Your CR will review your request."
                            : `${sub.name} · ${dateText}`}
                        </p>
                      </div>
                      <button
                        className="p-primary"
                        disabled={
                          !open ||
                          status(current.id) === "present" ||
                          status(current.id) === "pending"
                        }
                        onClick={() => mark(current.id, "pending")}
                      >
                        <Send size={20} />
                        {status(current.id) === "present"
                          ? "Attendance confirmed"
                          : status(current.id) === "pending"
                            ? "Awaiting approval"
                            : open
                              ? "Request Present"
                              : "Requests Closed"}
                      </button>
                    </div>
                  )}
                </>
              )}
              {screen === "Report" && (
                <>
                  <section className="p-present-card">
                    <div className="p-card-brand">
                      <GraduationCap size={47} />
                      <div>
                        <h2>My Class Room</h2>
                        <p>Class Attendance – Present List</p>
                      </div>
                    </div>
                    <dl>
                      <div>
                        <dt>Subject</dt>
                        <dd>
                          {sub.code} ({sub.name})
                        </dd>
                      </div>
                      <div>
                        <dt>Section</dt>
                        <dd>A</dd>
                      </div>
                      <div>
                        <dt>Date</dt>
                        <dd>{dateText}</dd>
                      </div>
                      <div>
                        <dt>Time</dt>
                        <dd>{sub.time}</dd>
                      </div>
                    </dl>
                    <table>
                      <thead>
                        <tr>
                          <th>SL</th>
                          <th>Roll</th>
                          <th>Student Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {presentStudents.map((s, i) => (
                          <tr key={s.id}>
                            <td>{i + 1}</td>
                            <td>{s.roll}</td>
                            <td>{s.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!presentStudents.length && (
                      <p className="p-no-present">
                        No students marked present for this class.
                      </p>
                    )}
                  </section>
                  <div className="p-report-summary">
                    <span>
                      <Users size={23} />
                      Total Present:{" "}
                      <strong>
                        {present} / {students.length}
                      </strong>
                    </span>
                    <button
                      aria-label="Print present card"
                      onClick={() => window.print()}
                    >
                      <Printer size={23} />
                    </button>
                  </div>
                  <button className="p-primary" onClick={pdf}>
                    <Download size={23} />
                    Download as PDF
                  </button>
                  {isCR && (
                    <button className="p-secondary p-csv" onClick={download}>
                      <FileSpreadsheet size={18} />
                      Download full register as CSV
                    </button>
                  )}
                </>
              )}
              {screen === "History" && (
                <>
                  <label className="p-date-control">
                    <CalendarDays size={18} />
                    <span>View date</span>
                    <input
                      aria-label="History date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </label>
                  <div className="p-history-list">
                    {subjects.map((s) => {
                      const count = students.filter(
                        (st) => status(st.id, s.id) === "present",
                      ).length;
                      return (
                        <button
                          className="p-history-card"
                          key={s.id}
                          onClick={() => {
                            setSubject(s.id);
                            go(isCR ? "Report" : "Attendance");
                          }}
                        >
                          <span className="p-book">
                            <BookOpen size={24} />
                          </span>
                          <div>
                            <strong>{s.code}</strong>
                            <p>{s.name}</p>
                            <small>{dateText}</small>
                          </div>
                          <span className="p-history-count">
                            {isCR
                              ? `${count}/${students.length}`
                              : status(current.id, s.id) || "Unmarked"}
                            <ChevronRight size={16} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              {screen === "Profile" && (
                <>
                  <div className="p-profile-card">
                    {avatar(current)}
                    <h2>{current.name}</h2>
                    <span className="p-status present">
                      {isCR ? "Class Representative" : "Student"}
                    </span>
                    <p>CSE 3rd Year · Section A</p>
                    {!isCR && <p>Roll: {current.roll}</p>}
                  </div>
                  <div className="p-profile-details">
                    <div>
                      <span>Classroom</span>
                      <strong>My Class Room</strong>
                    </div>
                    <div>
                      <span>Department</span>
                      <strong>Computer Science</strong>
                    </div>
                    <div>
                      <span>Section</span>
                      <strong>A · Class of 2027</strong>
                    </div>
                    <div>
                      <span>Connection</span>
                      <strong>
                        {configured
                          ? "Firebase connected"
                          : "Demo · This device"}
                      </strong>
                    </div>
                  </div>
                  {configured && (
                    <button className="p-end" onClick={logout}>
                      <LogOut size={18} />
                      Sign Out
                    </button>
                  )}
                  <div className="p-hint">
                    <Info size={19} />
                    <p>
                      {configured
                        ? "Your role is managed by your classroom administrator."
                        : "You’re exploring a demo. Attendance is saved on this device; connect Firebase for real classroom accounts."}
                    </p>
                  </div>
                </>
              )}
            </div>
          </>
        )}
        <nav className="p-bottom-nav" aria-label="Main navigation">
          {nav.map(([label, Icon]) => (
            <button
              className={
                screen === label ||
                (label === "Subjects" &&
                  ["Attendance", "Report"].includes(screen))
                  ? "active"
                  : ""
              }
              key={label}
              onClick={() => go(label)}
            >
              <span>
                <Icon size={24} strokeWidth={1.8} />
              </span>
              {label}
            </button>
          ))}
        </nav>
      </div>
      {notice && (
        <div className="p-toast" role="status">
          <Check size={18} />
          <span>{notice}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
