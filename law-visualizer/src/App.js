import './App.css';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ReactComponent as WorldHigh } from './assets/worldHigh.svg';
import nationIndex from './assets/nationIndex.json';

const MIN_SCALE = 2;
const MAX_SCALE = 12;
const INITIAL_SCALE = 2;
const INITIAL_Y_OFFSET = 200;
const ZOOM_STEP = 1.15;
const REGION_CODE_PATTERN = /^[A-Z]{2}$/;
const regionNames = typeof Intl !== 'undefined' && Intl.DisplayNames
  ? new Intl.DisplayNames(['en'], { type: 'region' })
  : null;
const COUNTRY_ALIASES = {
  'bosnia herzegovina': 'bosnia and herzegovina',
  'united states of america': 'united states',
  usa: 'united states',
  'russian federation': 'russia',
  libya: 'libya in transition',
  turkiye: 'turkey',
  'republic of turkiye': 'turkey',
  turkey: 'turkey',
  'viet nam': 'vietnam',
  czechia: 'czech republic',
  'cabo verde': 'cape verde',
  'brunei darussalam': 'brunei',
  'syrian arab republic': 'syria',
  'iran islamic republic of': 'iran',
  'lao people s democratic republic': 'laos',
  'korea republic of': 'south korea',
  'korea democratic peoples republic of': 'north korea',
  'myanmar burma': 'myanmar',
  'palestinian territories': 'palestine authority',
  palestine: 'palestine authority',
  eswatini: 'swaziland',
  switzerland: 'swiss',
  'south sudan': 'south sudan in transition',
  somalia: 'somalia in transition',
  'north macedonia': 'macedonia fyrom',
  'republic of congo': 'congo',
  'republic of the congo': 'congo',
  'congo republic': 'congo',
  'cote d ivoire': 'ivory coast',
  "cote d'ivoire": 'ivory coast',
  'cote divoire': 'ivory coast',
  'côte d ivoire': 'ivory coast',
  "côte d'ivoire": 'ivory coast',
  'côte divoire': 'ivory coast',
  'french guiana': 'france',
};

const normalizeCountryName = (value) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const canonicalCountryName = (value) => {
  const normalized = normalizeCountryName(value || '');
  return COUNTRY_ALIASES[normalized] || normalized;
};

const legalSystemCounts = nationIndex.reduce((counts, country) => {
  const legalSystem = country['Legal System'];

  if (legalSystem) {
    counts[legalSystem] = (counts[legalSystem] || 0) + 1;
  }

  return counts;
}, {});

const legalSystems = Object.keys(legalSystemCounts).sort((first, second) => first.localeCompare(second));
const legalSystemColors = legalSystems.reduce((colors, legalSystem, index) => {
  colors[legalSystem] = `hsl(${Math.round((index * 360) / legalSystems.length)} 72% 58%)`;
  return colors;
}, {});

const getCountryMatchKey = (value) => {
  if (!value) {
    return null;
  }

  const rawValue = String(value).trim();
  const upperValue = rawValue.toUpperCase();

  if (upperValue === 'TR') {
    return 'Turkey';
  }

  if (upperValue === 'CI') {
    return 'Ivory Coast';
  }

  if (upperValue === 'SS') {
    return 'South Sudan (in transition)';
  }

  if (upperValue === 'CG') {
    return 'Congo';
  }

  if (upperValue === 'PS') {
    return 'Palestine (Authority)';
  }

  if (upperValue === 'SZ') {
    return 'Swaziland';
  }

  const normalized = canonicalCountryName(rawValue);

  if (normalized === 'turkey') {
    return 'Turkey';
  }

  if (normalized === 'ivory coast') {
    return 'Ivory Coast';
  }

  return rawValue;
};

function App() {
  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(nationIndex[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCountryListOpen, setIsCountryListOpen] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedLegalSystem, setSelectedLegalSystem] = useState(null);
  const [detailsLegalSystem, setDetailsLegalSystem] = useState(null);
  const [view, setView] = useState({ scale: INITIAL_SCALE, x: 0, y: 0 });
  const countryByName = useMemo(() => {
    const map = new Map();

    nationIndex.forEach((country) => {
      map.set(canonicalCountryName(country.State), country);
    });

    return map;
  }, []);

  useEffect(() => {
    const handlePointerMove = (event) => {
      const dragState = dragRef.current;

      if (!dragState) {
        return;
      }

      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;

      setView({
        scale: dragState.scale,
        x: dragState.x + deltaX,
        y: dragState.y + deltaY,
      });
    };

    const handlePointerUp = () => {
      dragRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const preventNativeZoom = (event) => {
      if (event.ctrlKey) {
        event.preventDefault();
      }
    };

    container.addEventListener('wheel', preventNativeZoom, { passive: false });

    return () => {
      container.removeEventListener('wheel', preventNativeZoom);
    };
  }, []);

  useEffect(() => {
    const closeStateListOnOutsideClick = (event) => {
      if (!(event.target instanceof Element) || !event.target.closest('.App-menu')) {
        setIsCountryListOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeStateListOnOutsideClick);

    return () => {
      document.removeEventListener('pointerdown', closeStateListOnOutsideClick);
    };
  }, []);

  const getCenteredView = (scale) => {
    const container = containerRef.current;

    if (!container) {
      return { scale, x: 0, y: 0 };
    }

    const rect = container.getBoundingClientRect();
    const x = (rect.width - rect.width * scale) / 2;
    const y = (rect.height - rect.height * scale) / 2 + INITIAL_Y_OFFSET;

    return { scale, x, y };
  };

  useLayoutEffect(() => {
    setView(getCenteredView(INITIAL_SCALE));
  }, []);

  const clampScale = (value) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

  const zoomToPoint = (nextScale, clientX, clientY) => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const pointX = clientX - rect.left;
    const pointY = clientY - rect.top;
    const clampedScale = clampScale(nextScale);
    const scaleRatio = clampedScale / view.scale;

    setView((currentView) => ({
      scale: clampedScale,
      x: pointX - (pointX - currentView.x) * scaleRatio,
      y: pointY - (pointY - currentView.y) * scaleRatio,
    }));
  };

  const handleWheel = (event) => {
    if (
      event.target instanceof Element
      && event.target.closest('.App-menuList, .App-details, .App-legend')
    ) {
      return;
    }

    event.preventDefault();

    const zoomDirection = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
    zoomToPoint(view.scale * zoomDirection, event.clientX, event.clientY);
  };

  const handlePointerDown = (event) => {
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      x: view.x,
      y: view.y,
      scale: view.scale,
    };
  };

  const handleZoomIn = () => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    zoomToPoint(view.scale * ZOOM_STEP, rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  const handleZoomOut = () => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    zoomToPoint(view.scale / ZOOM_STEP, rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  const handleReset = () => {
    setView(getCenteredView(INITIAL_SCALE));
  };

  const handleCenter = () => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const rect = container.getBoundingClientRect();

    setView((currentView) => ({
      scale: currentView.scale,
      x: (rect.width - rect.width * currentView.scale) / 2,
      y: (rect.height - rect.height * currentView.scale) / 2 + 200,
    }));
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setSelectedLegalSystem(null);
    setDetailsLegalSystem(null);
    setIsCountryListOpen(false);
  };

  const handleLegalSystemCountrySelect = (country, legalSystem) => {
    setSelectedCountry(country);
    setSelectedLegalSystem(null);
    setDetailsLegalSystem(legalSystem);
  };

  const handleBackToLegalSystem = () => {
    setSelectedLegalSystem(detailsLegalSystem);
    setDetailsLegalSystem(null);
  };

  const handleLegalSystemSelect = (legalSystem) => {
    const countries = nationIndex.filter((country) => country['Legal System'] === legalSystem);

    if (countries.length === 1) {
      setSelectedCountry(countries[0]);
      setSelectedLegalSystem(null);
      setDetailsLegalSystem(null);
      return;
    }

    setSelectedLegalSystem(legalSystem);
  };

  const resolveCountry = useCallback((countryName) => {
    const normalizedName = getCountryMatchKey(countryName);

    if (!normalizedName) {
      return null;
    }

    return countryByName.get(canonicalCountryName(normalizedName)) || null;
  }, [countryByName]);

  const getCountryLabel = useCallback((countryPath) => {
    const countryId = countryPath.getAttribute('id');
    const pathName = countryPath.getAttribute('data-name');
    const rawName = pathName ? pathName.replace(/\u2019/g, "'") : '';

    if (countryId === 'TR' || /turkiye|turkey/i.test(rawName || '')) {
      return 'Turkey';
    }

    if (countryId === 'CI' || /cote.*ivoire|côte.*ivoire|ivory coast/i.test(rawName || '')) {
      return 'Ivory Coast';
    }

    if (countryId === 'SS' || /south sudan/i.test(rawName || '')) {
      return 'South Sudan (in transition)';
    }

    if (countryId === 'CG' || /^(republic of congo|republic of the congo|congo republic)$/i.test(rawName || '')) {
      return 'Congo';
    }

    if (rawName) {
      return rawName;
    }
    //fallback for other countries that are not in the data-name attribute but have a valid country code 
    if (countryId && regionNames && REGION_CODE_PATTERN.test(countryId)) {
      const englishName = regionNames.of(countryId);
      if (englishName) {
        return englishName === 'Türkiye' ? 'Turkey' : englishName;
      }
    }

    return countryId || 'Unknown country';
  }, []);

  useEffect(() => {
    const svg = containerRef.current?.querySelector('svg');

    if (!svg) {
      return;
    }

    const selectedName = selectedCountry?.State;

    svg.querySelectorAll('path[data-name]').forEach((path) => {
      const label = getCountryLabel(path);
      const matchedCountry = resolveCountry(label) || resolveCountry(path.getAttribute('id'));
      const isSelected = matchedCountry?.State === selectedName;
      const legalSystem = matchedCountry?.['Legal System'];

      path.style.cursor = 'pointer';
      path.style.pointerEvents = 'all';

      if (legalSystemColors[legalSystem]) {
        path.style.fill = legalSystemColors[legalSystem];
        path.setAttribute('data-legal-system', legalSystem);
      } else {
        path.style.removeProperty('fill');
        path.removeAttribute('data-legal-system');
      }

      if (isSelected) {
        path.setAttribute('data-selected', 'true');
      } else {
        path.removeAttribute('data-selected');
      }
    });
  }, [selectedCountry, resolveCountry, getCountryLabel]);

  const updateHoveredCountry = (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      setHoveredCountry(null);
      return;
    }

    const countryPath = target.closest('path[data-name]');

    if (!countryPath) {
      setHoveredCountry(null);
      return;
    }

    setHoveredCountry({
      name: getCountryLabel(countryPath),
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleMapClick = (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const countryPath = target.closest('path[data-name]');

    if (!countryPath) {
      return;
    }

    setIsCountryListOpen(false);

    const match = resolveCountry(getCountryLabel(countryPath))
      || resolveCountry(countryPath.getAttribute('id'));

    if (match) {
      setSelectedCountry(match);
      setSelectedLegalSystem(null);
      setDetailsLegalSystem(null);
    }
  };

  const filteredCountries = nationIndex.filter((country) =>
    country.State.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );
  const legalSystemCountries = selectedLegalSystem
    ? nationIndex.filter((country) => country['Legal System'] === selectedLegalSystem)
    : [];

  const detailEntries = selectedCountry ? Object.entries(selectedCountry) : [];

  return (
    <div className="App" ref={containerRef} onWheel={handleWheel}>
      <h1 className="App-title">The Law Lense</h1>
      <aside className="App-legend" aria-label="Legal system legend">
        <div className="App-legendHeader">
          <div className="App-menuTitle">Legal systems</div>
          <button
            className={`App-legendToggle${isLegendOpen ? '' : ' is-collapsed'}`}
            type="button"
            onClick={() => setIsLegendOpen((isOpen) => !isOpen)}
            aria-controls="legal-system-legend-list"
            aria-expanded={isLegendOpen}
            aria-label={isLegendOpen ? 'Collapse legal systems legend' : 'Expand legal systems legend'}
          />
        </div>
        {isLegendOpen ? (
          <div className="App-legendList" id="legal-system-legend-list">
            {legalSystems.map((legalSystem) => (
              <button
                className={`App-legendItem${selectedLegalSystem === legalSystem ? ' is-selected' : ''}`}
                key={legalSystem}
                type="button"
                onClick={() => handleLegalSystemSelect(legalSystem)}
                aria-pressed={selectedLegalSystem === legalSystem}
              >
                <span
                  className="App-legendSwatch"
                  style={{ backgroundColor: legalSystemColors[legalSystem] }}
                  aria-hidden="true"
                />
                <span className="App-legendLabel">{legalSystem}</span>
                <span className="App-legendCount">{legalSystemCounts[legalSystem]}</span>
              </button>
            ))}
          </div>
        ) : null}
      </aside>
      <div className={`App-sidebar${isSidebarCollapsed ? ' is-collapsed' : ''}`}>
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
            onClick={() => setIsSidebarCollapsed((isCollapsed) => !isCollapsed)}
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
            onFocus={() => setIsCountryListOpen(true)}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setIsCountryListOpen(true);
            }}
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
                  onClick={() => handleCountrySelect(country)}
                  aria-pressed={selectedCountry?.State === country.State}
                >
                  {country.State}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="App-details">
          {selectedLegalSystem ? (
            <>
              <div className="App-menuTitle">{selectedLegalSystem}</div>
              <div className="App-menuList App-legalSystemCountries" role="list" aria-label={`${selectedLegalSystem} countries`}>
                {legalSystemCountries.map((country) => (
                  <button
                    key={country.State}
                    type="button"
                    className={`App-menuItem${selectedCountry?.State === country.State ? ' is-selected' : ''}`}
                    style={{ '--legal-system-color': legalSystemColors[selectedLegalSystem] }}
                    onClick={() => handleLegalSystemCountrySelect(country, selectedLegalSystem)}
                    aria-pressed={selectedCountry?.State === country.State}
                  >
                    {country.State}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="App-detailsHeader">
                <div className="App-menuTitle">Country details</div>
                {detailsLegalSystem ? (
                  <button
                    className="App-backButton"
                    type="button"
                    onClick={handleBackToLegalSystem}
                    aria-label={`Back to ${detailsLegalSystem} countries`}
                  >
                    <span aria-hidden="true">←</span>
                  </button>
                ) : null}
              </div>
              {selectedCountry ? (
                <div className="App-detailGrid">
                  {detailEntries.map(([label, value]) => (
                    <div className="App-detailRow" key={label}>
                      <div className="App-detailLabel">{label}</div>
                      <div className="App-detailValue">
                        {label === 'Research Guides' && Array.isArray(value) ? (
                          <ul className="App-researchGuides">
                            {value.map((guide) => (
                              <li key={guide.href}>
                                <a
                                  href={guide.href}
                                  target={guide.target}
                                  rel={guide.rel}
                                  aria-label={guide['aria-label']}
                                  title={guide.title}
                                >
                                  {guide.text}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          value ?? 'N/A'
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="App-empty">Select a state to view its data.</div>
              )}
            </>
          )}
        </div>
      </div>
      <WorldHigh
        className="App-map"
        role="img"
        aria-label="world map"
        onPointerDown={handlePointerDown}
        onPointerMove={updateHoveredCountry}
        onPointerLeave={() => setHoveredCountry(null)}
        onClick={handleMapClick}
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          cursor: view.scale > 1 ? 'grab' : 'default',
        }}
      />
      {hoveredCountry ? (
        <div
          className="App-tooltip"
          style={{
            left: hoveredCountry.x + 12,
            top: hoveredCountry.y + 12,
          }}
        >
          {hoveredCountry.name}
        </div>
      ) : null}
      <div className="App-logoGroup" aria-label="Partner institutions">
        <p className="App-attribution">
          This data visualization was made with data from the <a href="https://juri-globe.ca/en/allcategories-en-gb/3350-category-en-gb/index-of-states-and-their-corresponding-legal-and-constitutional-systems" target="_blank" rel="noopener noreferrer">Index of States and Their Corresponding Legal and Constitutional Systems</a> ,
             published by JuriGlobe and the Faculty of Law at the University of Ottawa.
        </p>
      </div>
    </div>
  );
}

export default App;
