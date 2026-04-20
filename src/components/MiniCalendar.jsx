import { useMemo, useState } from 'react'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const MiniCalendar = () => {
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const today = useMemo(() => new Date(), [])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const title = useMemo(
    () =>
      cursor.toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
    [cursor],
  )

  const cells = useMemo(() => {
    const firstDow = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const out = []
    for (let i = 0; i < firstDow; i++) out.push(null)
    for (let day = 1; day <= daysInMonth; day++) out.push(day)
    return out
  }, [year, month])

  const goPrev = () => setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const goNext = () => setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  return (
    <div className="sm-calendar">
      <div className="sm-calendar__header">
        <button type="button" className="sm-calendar__nav" onClick={goPrev} aria-label="Previous month">
          <i className="ri-arrow-left-s-line"></i>
        </button>

        <div className="sm-calendar__title" aria-live="polite">
          {title}
        </div>

        <button type="button" className="sm-calendar__nav" onClick={goNext} aria-label="Next month">
          <i className="ri-arrow-right-s-line"></i>
        </button>
      </div>

      <div className="sm-calendar__week">
        {WEEKDAYS.map((w) => (
          <div key={w} className="sm-calendar__weekday">
            {w}
          </div>
        ))}
      </div>

      <div className="sm-calendar__grid">
        {cells.map((day, idx) => {
          if (day == null) {
            return <div key={idx} className="sm-calendar__day is-empty" />
          }

          const d = new Date(year, month, day)
          const isToday = isSameDay(d, today)

          return (
            <div key={idx} className={`sm-calendar__day ${isToday ? 'is-today' : ''}`}>
              {day}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MiniCalendar

