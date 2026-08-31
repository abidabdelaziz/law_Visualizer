import './App.css';
import { useEffect, useRef, useState } from 'react';
import { ReactComponent as WorldHigh } from './assets/worldHigh.svg';
import nationIndex from './assets/nationIndex.json';

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const ZOOM_STEP = 1.15;
const REGION_CODE_PATTERN = /^[A-Z]{2}$/;
const regionNames = typeof Intl !== 'undefined' && Intl.DisplayNames
  ? new Intl.DisplayNames(['en'], { type: 'region' })
  : null;

function App() {
  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(nationIndex[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });

  useEffect(() => {
    const svg = containerRef.current?.querySelector('svg');

    if (!svg) {
      return;
    }

    const selectedName = selectedCountry?.State;

    svg.querySelectorAll('path[data-name]').forEach((path) => {
      const isSelected = getCountryLabel(path) === selectedName;

      if (isSelected) {
        path.setAttribute('data-selected', 'true');
      } else {
        path.removeAttribute('data-selected');
      }
    });
  }, [selectedCountry]);

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
    setView({ scale: 1, x: 0, y: 0 });
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
  };

  const getCountryLabel = (countryPath) => {
    const countryId = countryPath.getAttribute('id');

    if (countryId && regionNames && REGION_CODE_PATTERN.test(countryId)) {
      const englishName = regionNames.of(countryId);

      if (englishName) {
        return englishName;
      }
    }

    return countryPath.getAttribute('data-name') || countryId || 'Unknown country';
  };

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

  const filteredCountries = nationIndex.filter((country) =>
    country.State.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const detailEntries = selectedCountry ? Object.entries(selectedCountry) : [];

  return (
    <div className="App" ref={containerRef} onWheel={handleWheel}>
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
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search states"
            aria-label="Search states"
          />
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
    </div>
  );
}

export default App;
