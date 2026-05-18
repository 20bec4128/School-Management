import usePhoneCodeField from '../hooks/usePhoneCodeField'

const PhoneCodeField = ({
  id,
  label,
  value,
  code,
  onValueChange,
  onCodeChange,
  onChange,
  required = false,
}) => {
  const {
    wrapperRef,
    searchRef,
    isOpen,
    search,
    setSearch,
    toggleOpen,
    selectCountry,
    selectedCountry,
    filteredCountries,
    phoneLengthRule,
  } = usePhoneCodeField({ code })

  const codeValue = code || selectedCountry.code
  const normalizedValue = String(value ?? '')
  const trimmedDigits = normalizedValue.startsWith(codeValue)
    ? normalizedValue.slice(codeValue.length).trim()
    : normalizedValue
  const displayValue = String(trimmedDigits ?? '').replace(/\D/g, '')
  const emitValue = (digits, nextCode = codeValue) => {
    const fullValue = digits ? `${nextCode} ${digits}` : nextCode

    if (typeof onValueChange === 'function') onValueChange(digits)
    if (typeof onChange === 'function') onChange(fullValue)
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      {label && (
        <label htmlFor={id} className="form-label fw-semibold text-primary-light">
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </label>
      )}
      <div className="input-group">
        <button
          type="button"
          className="form-select text-start"
          style={{ maxWidth: '11rem', minWidth: '11rem' }}
          onClick={toggleOpen}
          aria-label={`${label} country code`}
        >
          <span className="me-2">{selectedCountry.flag}</span>
          {selectedCountry.code} {selectedCountry.country}
        </button>
        <input
          type="tel"
          className="form-control"
          id={id}
          placeholder={label}
          value={displayValue}
          onChange={(event) => emitValue(event.target.value.replace(/\D/g, '').slice(0, phoneLengthRule.max))}
          maxLength={phoneLengthRule.max}
          pattern={`\\d{${phoneLengthRule.min},${phoneLengthRule.max}}`}
          title={`Enter ${phoneLengthRule.min === phoneLengthRule.max ? phoneLengthRule.max : `${phoneLengthRule.min}-${phoneLengthRule.max}`} digits`}
          required={required}
        />
      </div>

      {isOpen ? (
        <div
          className="border rounded-3 bg-white shadow-sm position-absolute mt-2"
          style={{ zIndex: 40, width: 'min(100%, 22rem)', left: 0, top: 'calc(100% + 0.4rem)' }}
        >
          <div className="p-2 border-bottom">
            <input
              ref={searchRef}
              type="text"
              className="form-control form-control-sm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search country or code..."
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filteredCountries.map((country) => (
              <button
                key={`${country.iso}-${country.code}`}
                type="button"
                className={`btn w-100 text-start rounded-0 border-0 px-3 py-2 ${
                  country.code === selectedCountry.code ? 'bg-light' : ''
                }`}
                onClick={() => {
                  if (typeof onCodeChange === 'function') onCodeChange(country.code)
                  selectCountry(country)
                  if (typeof onChange === 'function') {
                    const digits = displayValue
                    onChange(digits ? `${country.code} ${digits}` : country.code)
                  }
                }}
              >
                <span className="me-2">{country.flag}</span>
                {country.code} {country.country}
              </button>
            ))}
            {filteredCountries.length === 0 ? (
              <div className="px-3 py-2 text-secondary-light">No countries found.</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default PhoneCodeField
