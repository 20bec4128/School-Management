import { useEffect, useMemo, useRef, useState } from 'react'
import useCountryCodes from './useCountryCodes'

const DEFAULT_PHONE_CODE = '+91'
const PHONE_LENGTH_BY_ISO = {
  IN: { min: 10, max: 10 },
  US: { min: 10, max: 10 },
  GB: { min: 10, max: 10 },
  AU: { min: 9, max: 9 },
  DE: { min: 10, max: 11 },
  CA: { min: 10, max: 10 },
  FR: { min: 9, max: 9 },
  BR: { min: 10, max: 11 },
}
const DEFAULT_PHONE_LENGTH = { min: 6, max: 15 }

const toFlagEmoji = (iso = '') =>
  String(iso || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('')

const usePhoneCodeField = ({ code = DEFAULT_PHONE_CODE }) => {
  const { countries } = useCountryCodes()
  const wrapperRef = useRef(null)
  const searchRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const uniqueCountries = useMemo(() => {
    const seen = new Set()
    return countries
      .map((country) => ({ ...country, flag: country.flag || toFlagEmoji(country.iso) }))
      .filter((country) => {
        if (seen.has(country.code)) return false
        seen.add(country.code)
        return true
      })
  }, [countries])

  const selectedCountry =
    uniqueCountries.find((country) => country.code === code) ||
    uniqueCountries.find((country) => country.code === DEFAULT_PHONE_CODE) ||
    uniqueCountries[0] ||
    { code: DEFAULT_PHONE_CODE, country: 'India', iso: 'IN', flag: toFlagEmoji('IN') }

  const phoneLengthRule = PHONE_LENGTH_BY_ISO[selectedCountry.iso] || DEFAULT_PHONE_LENGTH

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

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return uniqueCountries
    return uniqueCountries.filter(
      (country) =>
        country.country.toLowerCase().includes(q) ||
        country.code.includes(q) ||
        country.iso.toLowerCase().includes(q),
    )
  }, [search, uniqueCountries])

  const toggleOpen = () => setIsOpen((prev) => !prev)
  const close = () => setIsOpen(false)
  const selectCountry = (country) => {
    setIsOpen(false)
    setSearch('')
    return country
  }

  return {
    wrapperRef,
    searchRef,
    isOpen,
    search,
    setSearch,
    toggleOpen,
    close,
    selectCountry,
    selectedCountry,
    filteredCountries,
    phoneLengthRule,
  }
}

export default usePhoneCodeField
