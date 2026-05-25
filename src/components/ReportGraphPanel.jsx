import { useMemo } from 'react'
import { BarChart, DonutChart, StepAreaChart } from './SimpleCharts'

const DEFAULT_EXCLUDE_KEYS = new Set([
  'id',
  'schoolId',
  'headOfficeId',
  'classId',
  'sectionId',
  'studentId',
  'bookId',
  'teacherId',
  'employeeId',
  'createdBy',
  'updatedBy',
])

const STATUS_KEYS = ['status', 'paidStatus', 'transactionType', 'gender', 'attendanceStatus']
const DATE_KEYS = ['date', 'createdAt', 'updatedAt', 'incomeDate', 'expenditureDate', 'transactionDate', 'month']
const LABEL_KEYS = [
  'schoolName',
  'className',
  'studentName',
  'title',
  'name',
  'month',
  'category',
  'feeTypeTitle',
  'incomeHeadName',
  'expenditureHeadName',
  'subject',
  'note',
]

const isNumericLike = (value) => {
  if (value == null || value === '') return false
  const n = Number(value)
  return Number.isFinite(n)
}

const formatMoney = (value) => {
  const n = Number(value) || 0
  return `Rs. ${n.toFixed(2)}`
}

const normalizeLabel = (value) => {
  if (value == null || value === '') return 'Unknown'
  return String(value)
}

const pickFirstExistingKey = (keys, rows) => {
  const sample = rows.find((row) => row && typeof row === 'object') || {}
  return keys.find((key) => key in sample)
}

const scoreNumericKeys = (rows) => {
  const sample = rows.slice(0, 50)
  return Object.keys(sample[0] || {})
    .filter((key) => !DEFAULT_EXCLUDE_KEYS.has(key))
    .filter((key) => !DATE_KEYS.some((dateKey) => key.toLowerCase().includes(dateKey.toLowerCase())))
    .map((key) => {
      const numericCount = sample.filter((row) => isNumericLike(row?.[key])).length
      return { key, numericCount }
    })
    .filter((item) => item.numericCount > 0)
    .sort((a, b) => b.numericCount - a.numericCount)
    .map((item) => item.key)
}

const summarizeAsCategory = (rows, labelKey, valueKey) => {
  const map = new Map()
  for (const row of rows) {
    const label = normalizeLabel(row?.[labelKey])
    const value = valueKey ? Number(row?.[valueKey]) || 0 : 1
    map.set(label, (map.get(label) || 0) + value)
  }
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

const summarizeAsTimeline = (rows, labelKey, valueKey) => {
  const map = new Map()
  for (const row of rows) {
    const rawLabel = normalizeLabel(row?.[labelKey])
    const value = Number(row?.[valueKey]) || 0
    map.set(rawLabel, (map.get(rawLabel) || 0) + value)
  }
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime() || a.label.localeCompare(b.label))
}

const buildSeriesColor = (index) => {
  const palette = ['#487FFF', '#FF9F29', '#45B369', '#9935FE', '#14B8A6', '#F43F5E', '#0EA5E9']
  return palette[index % palette.length]
}

export function ReportGraphPanel({
  rows = [],
  title,
  emptyMessage = 'No data available for graphical report.',
  hint = 'auto',
  labelKeys,
  valueKey,
}) {
  const model = useMemo(() => {
    const safeRows = Array.isArray(rows) ? rows.filter(Boolean) : []
    if (!safeRows.length) {
      return { kind: 'empty', total: 0 }
    }

    const sample = safeRows[0] || {}
    const statusKey = STATUS_KEYS.find((key) => key in sample)
    const dateKey = DATE_KEYS.find((key) => key in sample)
    const labelKey =
      pickFirstExistingKey(labelKeys || LABEL_KEYS, safeRows) ||
      Object.keys(sample).find((key) => !DEFAULT_EXCLUDE_KEYS.has(key)) ||
      'label'
    const numericKeys = scoreNumericKeys(safeRows)
    const resolvedValueKey = valueKey || numericKeys[0] || null
    const total = safeRows.length

    if (hint === 'status' || (statusKey && (hint === 'auto' || hint === 'category'))) {
      const segments = summarizeAsCategory(safeRows, statusKey || labelKey, resolvedValueKey)
      return {
        kind: 'donut',
        total,
        segments: segments.map((segment, index) => ({
          label: segment.label,
          value: segment.value,
          color: buildSeriesColor(index),
        })),
        centerLabel: 'Records',
        centerValue: String(total),
      }
    }

    if (hint === 'time' || (dateKey && resolvedValueKey && safeRows.some((row) => row?.[dateKey]))) {
      const timeline = summarizeAsTimeline(safeRows, dateKey || labelKey, resolvedValueKey)
      const labels = timeline.map((item) => item.label)
      const data = timeline.map((item) => item.value)
      return {
        kind: 'step',
        total,
        labels,
        series: [
          {
            name: resolvedValueKey || 'Records',
            data,
            color: '#487FFF',
            fill: 'rgba(72,127,255,0.16)',
          },
        ],
        valueKey: resolvedValueKey,
      }
    }

    const categories = summarizeAsCategory(safeRows, labelKey, resolvedValueKey)
    return {
      kind: 'bar',
      total,
      labels: categories.slice(0, 8).map((item) => item.label),
      series: [
        {
          name: resolvedValueKey || 'Records',
          data: categories.slice(0, 8).map((item) => item.value),
          color: '#487FFF',
        },
      ],
      valueKey: resolvedValueKey,
    }
  }, [hint, labelKeys, rows, valueKey])

  if (model.kind === 'empty') {
    return (
      <div className="px-20 py-40 text-center text-secondary-light">
        {emptyMessage}
      </div>
    )
  }

  if (model.kind === 'donut') {
    return (
      <div className="px-20 py-24">
        {title ? (
          <div className="text-center mb-24">
            <h6 className="mb-0 fw-semibold text-primary-light">{title}</h6>
          </div>
        ) : null}
        <div className="d-flex justify-content-center">
          <DonutChart
            segments={model.segments}
            size={320}
            thickness={42}
            centerLabel={model.centerLabel}
            centerValue={model.centerValue}
            legendMode="values"
            showLegend
          />
        </div>
      </div>
    )
  }

  if (model.kind === 'step') {
    return (
      <div className="px-20 py-24">
        {title ? (
          <div className="text-center mb-24">
            <h6 className="mb-0 fw-semibold text-primary-light">{title}</h6>
          </div>
        ) : null}
        <StepAreaChart
          labels={model.labels}
          series={model.series}
          height={320}
          maxValue={Math.max(...model.series.flatMap((series) => series.data.map((v) => Number(v) || 0)), 1)}
          valueFormatter={(value) => formatMoney(value)}
        />
      </div>
    )
  }

  return (
    <div className="px-20 py-24">
      {title ? (
        <div className="text-center mb-24">
          <h6 className="mb-0 fw-semibold text-primary-light">{title}</h6>
        </div>
      ) : null}
      <BarChart
        labels={model.labels}
        series={model.series}
        height={320}
        showValueLabels
        valueFormatter={(value) => formatMoney(value)}
        valueLabelFormatter={(value) => formatMoney(value)}
        yLabelFormatter={(value) => formatMoney(value)}
        tooltip
        tooltipTitleFormatter={(label) => label}
      />
    </div>
  )
}
