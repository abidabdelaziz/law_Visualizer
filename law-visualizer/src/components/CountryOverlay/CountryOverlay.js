import { useEffect, useRef, useState } from 'react';
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

  geoJson?.features?.forEach(({ geometry }) => {
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
    viewBox: `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`,
  };
};

function CountryOverlay({ countryName, countryCode, fillColor, onClose, onMinimize }) {
  const closeButtonRef = useRef(null);
  const [countryGeometry, setCountryGeometry] = useState(null);
  const [loadError, setLoadError] = useState(false);

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
          onClose();
        }
      }}
    >
      <section
        className="CountryOverlay-dialog"
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
        <div className="CountryOverlay-imageFrame" aria-busy={!countryGeometry && !loadError}>
          {countryGeometry ? (
            <svg
              className="CountryOverlay-image"
              viewBox={countryGeometry.viewBox}
              role="img"
              aria-label={`${countryName} outline`}
              preserveAspectRatio="xMidYMid meet"
            >
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
            </svg>
          ) : (
            <p className="CountryOverlay-status" role={loadError ? 'alert' : 'status'}>
              {loadError ? 'Map data unavailable for this country.' : 'Loading country map...'}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export default CountryOverlay;

// St Vincent and the Grenadines, Palestine, Marshall Islands, fijji islands are not available in the Highcharts map collection, so we need to use a fallback for that country.
