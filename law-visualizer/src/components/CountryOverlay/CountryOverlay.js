import { useEffect, useRef } from 'react';
import './CountryOverlay.css';

const MAP_VIEW_BOX = '-2 17.68 964 924.64';
const MAP_LEFT = -2;
const MAP_WIDTH = 964;
const EDGE_MARGIN = MAP_WIDTH * 0.035;

const getSegmentPoints = (pathData) => {
  const values = pathData
    .replace(/[MLZ]/gi, ' ')
    .match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi);
  const numbers = (values || []).map(Number);
  const points = [];

  for (let index = 0; index + 1 < numbers.length; index += 2) {
    points.push({ x: numbers[index], y: numbers[index + 1] });
  }

  return points;
};

const getSegmentBounds = (segment) => {
  const points = getSegmentPoints(segment.pathData);
  const xs = points.map(({ x }) => x);
  const ys = points.map(({ y }) => y);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
};

const getPaddedBounds = (segmentBounds) => {
  const minX = Math.min(...segmentBounds.map(({ minX: value }) => value));
  const maxX = Math.max(...segmentBounds.map(({ maxX: value }) => value));
  const minY = Math.min(...segmentBounds.map(({ minY: value }) => value));
  const maxY = Math.max(...segmentBounds.map(({ maxY: value }) => value));
  const padding = Math.max(2, Math.max(maxX - minX, maxY - minY) * 0.025);

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
};

export const prepareOverlayGeometry = (pathData, bounds) => {
  const segments = (pathData.match(/M[^M]*/gi) || [])
    .map((segmentPath) => ({ pathData: segmentPath.trim(), offsetX: 0 }))
    .filter((segment) => getSegmentPoints(segment.pathData).length > 0);

  if (segments.length === 0) {
    return { segments, bounds };
  }

  const segmentBounds = segments.map(getSegmentBounds);

  if (segments.length < 2) {
    return { segments, bounds: bounds || getPaddedBounds(segmentBounds) };
  }

  const minX = Math.min(...segmentBounds.map(({ minX: value }) => value));
  const maxX = Math.max(...segmentBounds.map(({ maxX: value }) => value));
  const leftEdgeIndices = [];
  const rightEdgeIndices = [];

  segmentBounds.forEach((segment, index) => {
    if (segment.maxX <= MAP_LEFT + EDGE_MARGIN) {
      leftEdgeIndices.push(index);
    } else if (segment.minX >= MAP_LEFT + MAP_WIDTH - EDGE_MARGIN) {
      rightEdgeIndices.push(index);
    }
  });

  if (
    maxX - minX < MAP_WIDTH * 0.75
    || leftEdgeIndices.length === 0
    || rightEdgeIndices.length === 0
  ) {
    return { segments, bounds: bounds || getPaddedBounds(segmentBounds) };
  }

  const edgeIndices = new Set([...leftEdgeIndices, ...rightEdgeIndices]);
  const centralBounds = segmentBounds.filter((_, index) => !edgeIndices.has(index));

  if (centralBounds.length === 0) {
    return { segments, bounds: bounds || getPaddedBounds(segmentBounds) };
  }

  const anchorCenter = (
    Math.min(...centralBounds.map(({ minX: value }) => value))
    + Math.max(...centralBounds.map(({ maxX: value }) => value))
  ) / 2;

  leftEdgeIndices.forEach((index) => {
    const center = (segmentBounds[index].minX + segmentBounds[index].maxX) / 2;
    if (Math.abs(center + MAP_WIDTH - anchorCenter) < Math.abs(center - anchorCenter)) {
      segments[index].offsetX = MAP_WIDTH;
    }
  });

  rightEdgeIndices.forEach((index) => {
    const center = (segmentBounds[index].minX + segmentBounds[index].maxX) / 2;
    if (Math.abs(center - MAP_WIDTH - anchorCenter) < Math.abs(center - anchorCenter)) {
      segments[index].offsetX = -MAP_WIDTH;
    }
  });

  const shiftedBounds = segments.map((segment, index) => ({
    ...segmentBounds[index],
    minX: segmentBounds[index].minX + segment.offsetX,
    maxX: segmentBounds[index].maxX + segment.offsetX,
  }));
  return {
    segments,
    bounds: getPaddedBounds(shiftedBounds),
  };
};

function CountryOverlay({ countryName, pathData, bounds, fillColor, onClose }) {
  const closeButtonRef = useRef(null);
  const overlayGeometry = prepareOverlayGeometry(pathData, bounds);
  const pathGroups = overlayGeometry.segments.reduce((groups, segment) => {
    const group = groups.find(({ offsetX }) => offsetX === segment.offsetX);

    if (group) {
      group.pathData.push(segment.pathData);
    } else {
      groups.push({ offsetX: segment.offsetX, pathData: [segment.pathData] });
    }

    return groups;
  }, []);
  const viewBox = overlayGeometry.bounds
    ? `${overlayGeometry.bounds.x} ${overlayGeometry.bounds.y} ${overlayGeometry.bounds.width} ${overlayGeometry.bounds.height}`
    : MAP_VIEW_BOX;

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
        <div className="CountryOverlay-imageFrame">
          <svg
            className="CountryOverlay-image"
            viewBox={viewBox}
            role="img"
            aria-label={`${countryName} outline`}
            preserveAspectRatio="xMidYMid meet"
          >
            {pathGroups.map(({ pathData: groupPathData, offsetX }) => (
              <path
                key={offsetX}
                d={groupPathData.join(' ')}
                transform={offsetX ? `translate(${offsetX} 0)` : undefined}
                fill={fillColor}
                stroke="#eaf1f5"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
              />
            ))}
          </svg>
        </div>
      </section>
    </div>
  );
}

export default CountryOverlay;