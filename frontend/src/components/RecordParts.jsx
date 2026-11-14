export function Status({ value }) {
  return (
    <span className={`status status-${String(value).toLowerCase()}`}>
      {String(value).replaceAll('_', ' ')}
    </span>
  )
}
export function title(incident) {
  return incident.description.length > 90
    ? `${incident.description.slice(0, 90)}…`
    : incident.description
}
export function date(value) {
  const parsed = new Date(
    /[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`,
  )
  return Number.isNaN(parsed.getTime())
    ? 'Date unavailable'
    : parsed.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
}
