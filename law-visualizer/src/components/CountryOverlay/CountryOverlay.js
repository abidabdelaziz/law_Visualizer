import { useEffect, useRef, useState } from 'react';
import usIndex from '../../assets/usIndex.json';
import CountryDetails from '../CountryDetails/CountryDetails';
import './CountryOverlay.css';

const getPolygonRings = (geometry) => {
  if (geometry?.type === 'Polygon') {
    return geometry.coordinates;
  }

  if (geometry?.type === 'MultiPolygon') {
    return geometry.coordinates.flat();
  }

  return [];
};

export const buildCountrySvgGeometry = (geoJson) => {
  const points = [];
  const pathParts = [];
  const outlineParts = [];
  const regions = [];

  geoJson?.features?.forEach(({ geometry, properties }) => {
    const featurePathParts = [];

    getPolygonRings(geometry).forEach((ring) => {
      const validPoints = ring.filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));

      if (validPoints.length < 3) {
        return;
      }

      points.push(...validPoints);
      featurePathParts.push(`M ${validPoints.map(([x, y]) => `${x} ${-y}`).join(' L ')} Z`);
    });

    pathParts.push(...featurePathParts);
    outlineParts.push(featurePathParts.join(' '));
    if (featurePathParts.length > 0) {
      regions.push({
        name: properties?.name,
        pathData: featurePathParts.join(' '),
      });
    }
  });

  if (points.length === 0) {
    return null;
  }

  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => -y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const padding = Math.max(2, Math.max(maxX - minX, maxY - minY) * 0.025);

  return {
    pathData: pathParts.join(' '),
    outlinePathData: outlineParts.filter(Boolean).join(' '),
    regions,
    viewBox: `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`,
  };
};

function CountryOverlay({
  countryName,
  countryCode,
  fillColor,
  selectedState,
  onSelectState,
  onClose,
  onMinimize,
}) {
  const closeButtonRef = useRef(null);
  const [countryGeometry, setCountryGeometry] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const isUnitedStates = countryCode.toLowerCase() === 'us';
  const stateByName = new Map(usIndex.map((state) => [state.State, state]));

  useEffect(() => {
    let isMounted = true;
    setCountryGeometry(null);
    setLoadError(false);

    async function loadMapData() {
      try {
        const code = countryCode.toLowerCase();
        const mapModule = await import(
          `@highcharts/map-collection/countries/${code}/${code}-all.geo.json`
        );

        if (isMounted) {
          setCountryGeometry(buildCountrySvgGeometry(mapModule.default));
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(true);
        }
      }
    }

    loadMapData();
    return () => {
      isMounted = false;
    };
  }, [countryCode]);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="CountryOverlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onMinimize ? onMinimize() : onClose();
        }
      }}
    >
      <section
        className={`CountryOverlay-dialog${isUnitedStates ? ' is-united-states' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="country-overlay-title"
      >
        <header className="CountryOverlay-header">
          <h2 className="CountryOverlay-title" id="country-overlay-title">
            Expanded Country Map: {countryName}
          </h2>
          <div className="CountryOverlay-actions">
            {onMinimize ? (
              <button
                className="CountryOverlay-minimize"
                type="button"
                onClick={onMinimize}
                aria-label={`Minimize map for ${countryName}`}
                title="Minimize"
              />
            ) : null}
            <button
              className="CountryOverlay-close"
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close country image"
              title="Close"
            />
          </div>
        </header>
        <div className="CountryOverlay-body">
          {isUnitedStates ? (
            <aside className="CountryOverlay-statePanel" aria-live="polite">
              <h3 className="CountryOverlay-stateHeading">
                {selectedState?.State || 'State details'}
              </h3>
              {selectedState ? (
                <CountryDetails country={selectedState} className="CountryOverlay-stateDetails" />
              ) : (
                <p className="CountryOverlay-statePrompt">Select a state on the map.</p>
              )}
            </aside>
          ) : null}
          <div className="CountryOverlay-imageFrame" aria-busy={!countryGeometry && !loadError}>
            {countryGeometry ? (
              <svg
                className="CountryOverlay-image"
                viewBox={countryGeometry.viewBox}
                role={isUnitedStates ? 'group' : 'img'}
                aria-label={`${countryName} outline`}
                preserveAspectRatio="xMidYMid meet"
              >
                {isUnitedStates ? countryGeometry.regions.map((region) => {
                  const state = stateByName.get(region.name);

                  return (
                    <path
                      key={`${region.name}-${region.pathData.slice(0, 20)}`}
                      className={`CountryOverlay-region${state ? ' is-selectable' : ''}${selectedState?.State === region.name ? ' is-selected' : ''}`}
                      d={region.pathData}
                      fill={selectedState?.State === region.name ? '#e5b65c' : fillColor}
                      fillRule="evenodd"
                      stroke="#ffffff"
                      strokeWidth="0.7"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      role={state ? 'button' : undefined}
                      tabIndex={state ? 0 : undefined}
                      aria-label={state ? `Select ${region.name}` : undefined}
                      aria-pressed={state ? selectedState?.State === region.name : undefined}
                      onClick={state ? () => onSelectState(state) : undefined}
                      onKeyDown={state ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onSelectState(state);
                        }
                      } : undefined}
                    />
                  );
                }) : (
                  <>
                    <path
                      d={countryGeometry.pathData}
                      fill={fillColor}
                      fillRule="evenodd"
                      style={{ filter: 'drop-shadow(0 0 1px #eaf1f5)' }}
                    />
                    <path
                      d={countryGeometry.outlinePathData}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="0.7"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      aria-hidden="true"
                    />
                  </>
                )}
              </svg>
            ) : (
              <p className="CountryOverlay-status" role={loadError ? 'alert' : 'status'}>
                {loadError ? 'Map data unavailable for this country.' : 'Loading country map...'}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default CountryOverlay;

// St Vincent and the Grenadines, Palestine, Marshall Islands, fijji islands are not available in the Highcharts map collection, so we need to use a fallback for that country.
