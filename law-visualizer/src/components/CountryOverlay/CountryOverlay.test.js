import { prepareOverlayGeometry } from './CountryOverlay';

const fullMapBounds = { x: -2, y: 20, width: 964, height: 80 };

test('wraps right-edge subpaths toward the main geometry and tightens bounds', () => {
  const pathData = [
    'M 3 40 L 8 40 L 8 45 Z',
    'M 950 40 L 955 40 L 955 45 Z',
    'M 150 10 L 200 10 L 200 90 L 150 90 Z',
  ].join(' ');

  const geometry = prepareOverlayGeometry(pathData, fullMapBounds);

  expect(geometry.segments[1].offsetX).toBe(-964);
  expect(geometry.bounds.width).toBeLessThan(300);
});

test('wraps left-edge subpaths toward the main geometry', () => {
  const pathData = [
    'M 1 40 L 8 40 L 8 45 Z',
    'M 956 40 L 960 40 L 960 45 Z',
    'M 550 10 L 900 10 L 900 90 L 550 90 Z',
  ].join(' ');

  const geometry = prepareOverlayGeometry(pathData, fullMapBounds);

  expect(geometry.segments[0].offsetX).toBe(964);
  expect(geometry.bounds.width).toBeLessThan(500);
});

test('leaves geometry unchanged when it does not cross both map edges', () => {
  const pathData = 'M 10 10 L 20 10 L 20 20 Z M 100 10 L 110 10 L 110 20 Z';

  const geometry = prepareOverlayGeometry(pathData, fullMapBounds);

  expect(geometry.segments.every(({ offsetX }) => offsetX === 0)).toBe(true);
  expect(geometry.bounds).toBe(fullMapBounds);
});