import { useEffect, useMemo, useRef, useState } from 'react'
import useCountryCodes from '../hooks/useCountryCodes'

const toFlagEmoji = (iso = '') =>
  iso
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('')

const indiaFallback = { code: '+91', country: 'India', iso: 'IN' }
const PHONE_LENGTH_BY_ISO = {
  IN: { min: 10, max: 10 },
  US: { min: 10, max: 10 },
  CA: { min: 10, max: 10 },
  GB: { min: 10, max: 10 },
  AU: { min: 9, max: 9 },
  DE: { min: 10, max: 11 },
  FR: { min: 9, max: 9 },
  BR: { min: 10, max: 11 },
}
const DEFAULT_PHONE_LENGTH = { min: 6, max: 15 }

const PhoneField = ({ id, value = '', onChange, label, required = false }) => {
  const { countries } = useCountryCodes()
  const wrapperRef = useRef(null)
  const triggerRef = useRef(null)
  const searchRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [search, setSearch] = useState('')
  const [triggerWidth, setTriggerWidth] = useState(108)

  const normalizedCountries = useMemo(
    () =>
      countries.map((country) => ({
        ...country,
        flag: country.flag || toFlagEmoji(country.iso),
      })),
    [countries],
  )

  const defaultCountry =
    normalizedCountries.find((country) => country.iso === 'IN') ||
    normalizedCountries.find((country) => country.code === '+91') ||
    { ...indiaFallback, flag: toFlagEmoji('IN') }

  const sortedByCodeLength = useMemo(
    () => [...normalizedCountries].sort((a, b) => b.code.length - a.code.length),
    [normalizedCountries],
  )

  const parseValue = (fullValue) => {
    const trimmed = String(fullValue || '').trim()
    if (!trimmed) return { country: defaultCountry, phone: '' }
    const matched = sortedByCodeLength.find((country) => trimmed.startsWith(country.code))
    if (!matched) return { country: defaultCountry, phone: trimmed }
    return {
      country: matched,
      phone: trimmed.slice(matched.code.length).trim(),
    }
  }

  const parsed = parseValue(value)
  const [selectedCountry, setSelectedCountry] = useState(parsed.country)
  const [phoneNumber, setPhoneNumber] = useState(parsed.phone)

  useEffect(() => {
    setSelectedCountry(parsed.country)
    setPhoneNumber(parsed.phone)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(() => {
    const handleOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 0)
    }
  }, [isOpen])

  useEffect(() => {
    const recalcWidth = () => {
      if (triggerRef.current) {
        setTriggerWidth(triggerRef.current.offsetWidth)
      }
    }
    recalcWidth()
    window.addEventListener('resize', recalcWidth)
    return () => window.removeEventListener('resize', recalcWidth)
  }, [selectedCountry])

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return normalizedCountries
    return normalizedCountries.filter(
      (country) =>
        country.country.toLowerCase().includes(query) ||
        country.code.includes(query) ||
        country.iso.toLowerCase().includes(query),
    )
  }, [normalizedCountries, search])

  const phoneLengthRule = PHONE_LENGTH_BY_ISO[selectedCountry.iso] || DEFAULT_PHONE_LENGTH

  const emitChange = (country, number) => {
    const fullValue = number.trim() ? `${country.code} ${number.trim()}` : country.code
    if (typeof onChange === 'function') onChange(fullValue)
  }

  const handlePhoneChange = (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, '')
    const nextNumber = digitsOnly.slice(0, phoneLengthRule.max)
    setPhoneNumber(nextNumber)
    emitChange(selectedCountry, nextNumber)
  }

  const handleCountrySelect = (country) => {
    setSelectedCountry(country)
    setIsOpen(false)
    emitChange(country, phoneNumber)
  }

  return (
    <div className="avm-field" ref={wrapperRef} style={{ position: 'relative' }}>
      {label ? (
        <label htmlFor={id} className="avm-label">
          {label}
          {required ? <span className="req"> *</span> : null}
        </label>
      ) : null}

      <div
        style={{
          position: 'relative',
          border: `1px solid ${isFocused || isOpen ? '#45597a' : '#d0d5dd'}`,
          borderRadius: '2rem',
          backgroundColor: '#fff',
          boxShadow: isFocused || isOpen ? '0 0 0 3px rgba(69, 89, 122, 0.12)' : 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            position: 'absolute',
            top: '50%',
            left: '0.45rem',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            border: 'none',
            background: 'transparent',
            padding: '0.35rem 0.7rem',
            borderRadius: '1.25rem',
            cursor: 'pointer',
            color: '#344054',
            fontSize: '0.9rem',
            lineHeight: 1,
          }}
        >
          <span>{selectedCountry.flag}</span>
          <span>{selectedCountry.code}</span>
          <span style={{ fontSize: '0.7rem' }}>▼</span>
        </button>

        <input
          id={id}
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={phoneLengthRule.max}
          pattern={`\\d{${phoneLengthRule.min},${phoneLengthRule.max}}`}
          title={`Enter ${phoneLengthRule.min === phoneLengthRule.max ? phoneLengthRule.max : `${phoneLengthRule.min}-${phoneLengthRule.max}`} digits`}
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: `0.7rem 1rem 0.7rem ${triggerWidth + 14}px`,
            borderRadius: '2rem',
            fontSize: '0.95rem',
            color: '#101828',
          }}
        />

        {isOpen ? (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 'calc(100% + 0.4rem)',
              border: '1px solid #d0d5dd',
              borderRadius: '0.9rem',
              backgroundColor: '#fff',
              boxShadow: '0 12px 28px rgba(16, 24, 40, 0.12)',
              zIndex: 30,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '0.55rem' }}>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search country or code..."
                style={{
                  width: '100%',
                  border: '1px solid #d0d5dd',
                  borderRadius: '0.65rem',
                  outline: 'none',
                  fontSize: '0.9rem',
                  padding: '0.5rem 0.65rem',
                }}
              />
            </div>
            <div style={{ maxHeight: 210, overflowY: 'auto', padding: '0.2rem 0.3rem 0.45rem' }}>
              {filteredCountries.map((country) => (
                <button
                  key={`${country.iso}-${country.code}`}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: 'none',
                    backgroundColor:
                      country.iso === selectedCountry.iso && country.code === selectedCountry.code
                        ? '#f2f4f7'
                        : 'transparent',
                    borderRadius: '0.55rem',
                    padding: '0.5rem 0.55rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                    <span>{country.flag}</span>
                    <span style={{ fontSize: '0.9rem', color: '#101828', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {country.country}
                    </span>
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#475467' }}>{country.code}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default PhoneField
