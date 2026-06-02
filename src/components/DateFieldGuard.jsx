import { useEffect } from 'react'

const MAX_DATE = '9999-12-31'

const isDateInput = (target) => {
  if (!target || target.tagName !== 'INPUT') return false
  return target.type === 'date'
}

const isValidDateValue = (value) => {
  if (!value) return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  return value <= MAX_DATE
}

const applyMaxToDateInputs = (root = document) => {
  root.querySelectorAll?.('input[type="date"]').forEach((input) => {
    input.setAttribute('max', MAX_DATE)
  })
}

function DateFieldGuard() {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined

    const handleEvent = (event) => {
      const target = event.target
      if (!isDateInput(target)) return

      target.setAttribute('max', MAX_DATE)

      if (event.type === 'paste') {
        const pastedText = event.clipboardData?.getData('text') || ''
        if (/\b\d{5,}\b/.test(pastedText)) {
          event.preventDefault()
          event.stopPropagation()
          event.stopImmediatePropagation?.()
        }
        return
      }

      if (!isValidDateValue(target.value)) {
        target.value = ''
        event.stopPropagation()
        event.stopImmediatePropagation?.()
      }
    }

    applyMaxToDateInputs()

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!node || node.nodeType !== Node.ELEMENT_NODE) return
          if (node.matches?.('input[type="date"]')) {
            node.setAttribute('max', MAX_DATE)
          }
          applyMaxToDateInputs(node)
        })
      }
    })

    document.addEventListener('input', handleEvent, true)
    document.addEventListener('change', handleEvent, true)
    document.addEventListener('paste', handleEvent, true)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      document.removeEventListener('input', handleEvent, true)
      document.removeEventListener('change', handleEvent, true)
      document.removeEventListener('paste', handleEvent, true)
      observer.disconnect()
    }
  }, [])

  return null
}

export default DateFieldGuard
