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

  geoJson?.features?.forEach(({ geometry }) => {
    getPolygonRings(geometry).forEach((ring) => {
      const validPoints = ring.filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));

      if (validPoints.length < 3) {
        return;
      }

      points.push(...validPoints);
      pathParts.push(`M ${validPoints.map(([x, y]) => `${x} ${-y}`).join(' L ')} Z`);
    });
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
    viewBox: `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`,
  };
};

function CountryOverlay({ countryName, countryCode, fillColor, onClose }) {
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
          <button
            className="CountryOverlay-close"
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close country image"
            title="Close"
          />
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
                stroke="#eaf1f5"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
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