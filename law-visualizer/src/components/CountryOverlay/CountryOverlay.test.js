import { buildCountrySvgGeometry } from './CountryOverlay';

test('converts Polygon and MultiPolygon features into fitted SVG geometry', () => {
  const geoJson = {
    features: [
      {
        geometry: {
          type: 'Polygon',
          coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
        },
      },
      {
        geometry: {
          type: 'MultiPolygon',
          coordinates: [[[[20, 0], [30, 0], [30, 10], [20, 10], [20, 0]]]],
        },
      },
    ],
  };

  const geometry = buildCountrySvgGeometry(geoJson);

  expect(geometry.pathData).toContain('M 0 0 L 10 0 L 10 -10');
  expect(geometry.pathData).toContain('M 20 0 L 30 0 L 30 -10');
  expect(geometry.viewBox).toBe('-2 -12 34 14');
});

test('combines adjacent regional polygons into a single filled country shape', () => {
  const geometry = buildCountrySvgGeometry({
    features: [
      {
        geometry: {
          type: 'Polygon',
          coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
        },
      },
      {
        geometry: {
          type: 'Polygon',
          coordinates: [[[10, 0], [20, 0], [20, 10], [10, 10], [10, 5], [10, 0]]],
        },
      },
    ],
  });

  expect(geometry.pathData.match(/M /g)).toHaveLength(2);
  expect(geometry).not.toHaveProperty('outlinePathData');
});

test('ignores non-polygon features and returns null when no country shapes exist', () => {
  const geometry = buildCountrySvgGeometry({
    features: [{ geometry: { type: 'MultiLineString', coordinates: [] } }],
  });

  expect(geometry).toBeNull();
});