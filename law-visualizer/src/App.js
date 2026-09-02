import './App.css';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ReactComponent as WorldHigh } from './assets/worldHigh.svg';
import nationIndex from './assets/nationIndex.json';
import nyuLawLogo from './assets/NYULaw.svg';
import uOttawaLogo from './assets/uOttawa.png';
import juriglobeLogo from './assets/juriGlobe.png';

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const INITIAL_SCALE = 2;
const INITIAL_Y_OFFSET = 100;
const ZOOM_STEP = 1.15;
const REGION_CODE_PATTERN = /^[A-Z]{2}$/;
const regionNames = typeof Intl !== 'undefined' && Intl.DisplayNames
  ? new Intl.DisplayNames(['en'], { type: 'region' })
  : null;
const COUNTRY_ALIASES = {
  'united states of america': 'united states',
  usa: 'united states',
  'russian federation': 'russia',
  libya: 'libya in transition',
  turkiye: 'turkey',
  'republic of turkiye': 'turkey',
  'viet nam': 'vietnam',
  czechia: 'czech republic',
  'cabo verde': 'cape verde',
  'brunei darussalam': 'brunei',
  'syrian arab republic': 'syria',
  'iran islamic republic of': 'iran',
  'lao peoples democratic republic': 'laos',
  'korea republic of': 'south korea',
  'korea democratic peoples republic of': 'north korea',
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

function App() {
  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(nationIndex[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCountryListOpen, setIsCountryListOpen] = useState(false);
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
    if (event.target instanceof Element && event.target.closest('.App-menuList')) {
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

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsCountryListOpen(false);
  };

  const resolveCountry = useCallback((countryName) => {
    if (!countryName) {
      return null;
    }

    return countryByName.get(canonicalCountryName(countryName)) || null;
  }, [countryByName]);

  const getCountryLabel = useCallback((countryPath) => {
    const countryId = countryPath.getAttribute('id');

    if (countryId && regionNames && REGION_CODE_PATTERN.test(countryId)) {
      const englishName = regionNames.of(countryId);

      if (englishName) {
        return englishName;
      }
    }

    return countryPath.getAttribute('data-name') || countryId || 'Unknown country';
  }, []);

  useEffect(() => {
    const svg = containerRef.current?.querySelector('svg');

    if (!svg) {
      return;
    }

    const selectedName = selectedCountry?.State;

    svg.querySelectorAll('path[data-name]').forEach((path) => {
      const matchedCountry = resolveCountry(getCountryLabel(path));
      const isSelected = matchedCountry?.State === selectedName;

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

    const match = resolveCountry(getCountryLabel(countryPath));

    if (match) {
      setSelectedCountry(match);
    }
  };

  const filteredCountries = nationIndex.filter((country) =>
    country.State.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const detailEntries = selectedCountry ? Object.entries(selectedCountry) : [];

  return (
    <div className="App" ref={containerRef} onWheel={handleWheel}>
      <h1 className="App-title">Visual Law Index</h1>
      <div className="App-sidebar">
        <div className="App-toolbar">
          <button type="button" onClick={handleZoomOut} aria-label="Zoom out">
            -
          </button>
          <button type="button" onClick={handleReset} aria-label="Reset zoom">
            Reset
          </button>
          <button type="button" onClick={handleZoomIn} aria-label="Zoom in">
            +
          </button>
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
            <div className="App-menuList" role="list" aria-label="States list">
              {filteredCountries.map((country) => (
                <button
                  key={country.State}
                  type="button"
                  className={`App-menuItem${selectedCountry?.State === country.State ? ' is-selected' : ''}`}
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
          <div className="App-menuTitle">Country details</div>
          {selectedCountry ? (
            <div className="App-detailGrid">
              {detailEntries.map(([label, value]) => (
                <div className="App-detailRow" key={label}>
                  <div className="App-detailLabel">{label}</div>
                  <div className="App-detailValue">{value ?? 'N/A'}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="App-empty">Select a state to view its data.</div>
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
        <img className="App-logo App-logo--nyu" src={nyuLawLogo} alt="NYU Law" />
        <img className="App-logo App-logo--uottawa" src={uOttawaLogo} alt="uOttawa" />
        <img className="App-logo App-logo--juriglobe" src={juriglobeLogo} alt="JuriGlobe" />

      </div>
    </div>
  );
}

export default App;
