import React, { useState } from "react";
import {
  BookOpen,
  Clock3,
  Coffee,
  ChevronRight,
  UserRound,
} from "lucide-react";
import {
  routine,
  week,
  dayOf,
  subjects,
  timeOf,
  teachers,
  college,
} from "./routine";
export default function RoutineView({ date, setDate, enter }) {
  const [day, setDay] = useState(
    week.includes(dayOf(date)) ? dayOf(date) : "Sunday",
  );
  const items = routine[day];
  function openClass(subject) {
    const selected = new Date(date + "T12:00:00");
    selected.setDate(
      selected.getDate() - selected.getDay() + week.indexOf(day),
    );
    setDate(
      `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}`,
    );
    enter(subject);
  }
  return (
    <>
      <div className="r-college">
        <strong>{college}</strong>
        <p>Department of Computer Science & Engineering</p>
        <span>4th Semester · 2nd Year, 2nd Semester · 2026</span>
        <small>Routine dated 08 October 2026</small>
      </div>
      <div className="r-days" role="tablist" aria-label="Routine day">
        {week.map((d) => (
          <button
            role="tab"
            aria-selected={day === d}
            className={day === d ? "active" : ""}
            key={d}
            onClick={() => setDay(d)}
          >
            {d.slice(0, 3)}
          </button>
        ))}
      </div>
      <h2 className="r-day-heading">
        {day}
        <span>{items.filter((x) => x[0] !== "extra").length} classes</span>
      </h2>
      <div className="r-timeline">
        {items.flatMap(([id, start, end = start], index) => {
          const s = subjects.find((s) => s.id === id);
          const cards = [
            <div className={"r-class " + (!s ? "extra" : "")} key={id}>
              <div className="r-period">
                {start === end ? `Period ${start}` : `Periods ${start}–${end}`}
                <span>
                  <Clock3 size={12} />
                  {timeOf(start, end)}
                </span>
              </div>
              <div className="r-class-body">
                <span className="p-book">
                  <BookOpen size={22} />
                </span>
                <div>
                  <small>
                    {s?.code || "ACTIVITIES"}
                    {s?.lab ? " · LAB" : ""}
                  </small>
                  <h3>{s?.name || "Extra-curricular activities"}</h3>
                  {s && (
                    <p>
                      <UserRound size={13} />
                      {s.teacher} <span>({s.teacherCodes.join(", ")})</span>
                    </p>
                  )}
                </div>
              </div>
              {s && (
                <button className="p-text-btn" onClick={() => openClass(s)}>
                  Open subject attendance
                  <ChevronRight size={14} />
                </button>
              )}
            </div>,
          ];
          if (end === 2)
            cards.push(
              <div className="r-break" key="break">
                <Coffee size={17} />
                <strong>Break</strong>
                <span>9:40 AM – 10:10 AM</span>
              </div>,
            );
          return cards;
        })}
      </div>
      <section className="r-faculty">
        <h2>Faculty directory</h2>
        {Object.entries(teachers).map(([code, name]) => (
          <div key={code}>
            <span>{code}</span>
            <strong>{name}</strong>
          </div>
        ))}
        <p>
          ZN and AP are listed in the source faculty key; no class is assigned
          to them in this routine.
        </p>
      </section>
      <p className="p-caption">Friday & Saturday: no scheduled classes.</p>
    </>
  );
}
