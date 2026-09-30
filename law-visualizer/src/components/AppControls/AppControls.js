function AppControls({
  handleZoomOut,
  handleReset,
  handleCenter,
  handleZoomIn,
  isSidebarCollapsed,
  onToggleSidebar,
  searchQuery,
  onSearchFocus,
  onSearchChange,
  isCountryListOpen,
  filteredCountries,
  selectedCountry,
  onCountrySelect,
  legalSystemColors,
}) {
  return (
    <>
      <div className="App-toolbar">
        <button type="button" onClick={handleZoomOut} aria-label="Zoom out">
          -
        </button>
        <button type="button" onClick={handleReset} aria-label="Reset zoom">
          Reset
        </button>
        <button type="button" onClick={handleCenter} aria-label="Center map">
          Center
        </button>
        <button type="button" onClick={handleZoomIn} aria-label="Zoom in">
          +
        </button>
        <button
          className="App-collapseButton"
          type="button"
          onClick={onToggleSidebar}
          aria-expanded={!isSidebarCollapsed}
          aria-label={isSidebarCollapsed ? 'Expand controls' : 'Collapse controls'}
        />
      </div>

      <div className="App-menu">
        <div className="App-menuTitle">States</div>
        <input
          className="App-search"
          type="search"
          value={searchQuery}
          onFocus={onSearchFocus}
          onChange={onSearchChange}
          placeholder="Search states"
          aria-label="Search states"
        />
        {isCountryListOpen ? (
          <div className="App-menuList App-stateList" role="list" aria-label="States list">
            {filteredCountries.map((country) => (
              <button
                key={country.State}
                type="button"
                className={`App-menuItem${selectedCountry?.State === country.State ? ' is-selected' : ''}`}
                style={{ '--legal-system-color': legalSystemColors[country['Legal System']] }}
                onClick={() => onCountrySelect(country)}
                aria-pressed={selectedCountry?.State === country.State}
              >
                {country.State}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}

export default AppControls;