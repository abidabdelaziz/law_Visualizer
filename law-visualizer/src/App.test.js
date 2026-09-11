import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

test('selects Ivory Coast from the map when the CI path is clicked', () => {
  render(<App />);

  const ivoryCoastPath = document.querySelector('path[id="CI"]');

  expect(ivoryCoastPath).not.toBeNull();

  fireEvent.click(ivoryCoastPath);

  expect(screen.getByText('Ivory Coast')).toBeInTheDocument();
  expect(ivoryCoastPath).toHaveAttribute('data-selected', 'true');
});

test('selects South Sudan from the map when the SS path is clicked', () => {
  render(<App />);

  const southSudanPath = document.querySelector('path[id="SS"]');

  expect(southSudanPath).not.toBeNull();

  fireEvent.click(southSudanPath);

  expect(screen.getByText('South Sudan (in transition)')).toBeInTheDocument();
  expect(southSudanPath).toHaveAttribute('data-selected', 'true');
});

test('selects Palestine from the map when the PS path is clicked', () => {
  render(<App />);

  const palestinePath = document.querySelector('path[id="PS"]');

  expect(palestinePath).not.toBeNull();

  fireEvent.click(palestinePath);

  expect(screen.getByText('Palestine (Authority)')).toBeInTheDocument();
  expect(palestinePath).toHaveAttribute('data-selected', 'true');
});

test('selects Swaziland from the map when the SZ path is clicked', () => {
  render(<App />);

  const eswatiniPath = document.querySelector('path[id="SZ"]');

  expect(eswatiniPath).not.toBeNull();

  fireEvent.click(eswatiniPath);

  expect(screen.getByText('Swaziland')).toBeInTheDocument();
  expect(eswatiniPath).toHaveAttribute('data-selected', 'true');
});

test('selects Republic of Congo from the map when the CG path is clicked', () => {
  render(<App />);

  const republicOfCongoPath = document.querySelector('path[id="CG"]');

  expect(republicOfCongoPath).not.toBeNull();

  fireEvent.click(republicOfCongoPath);

  expect(screen.getByText('Congo')).toBeInTheDocument();
  expect(republicOfCongoPath).toHaveAttribute('data-selected', 'true');
  expect(document.querySelector('path[id="CD"]')).not.toHaveAttribute('data-selected', 'true');
});

test('selects Democratic Republic of Congo without selecting Republic of Congo', () => {
  render(<App />);

  const republicOfCongoPath = document.querySelector('path[id="CG"]');
  const democraticRepublicOfCongoPath = document.querySelector('path[id="CD"]');

  expect(republicOfCongoPath).not.toBeNull();
  expect(democraticRepublicOfCongoPath).not.toBeNull();

  fireEvent.click(democraticRepublicOfCongoPath);

  expect(screen.getByText('Democratic Republic of Congo')).toBeInTheDocument();
  expect(democraticRepublicOfCongoPath).toHaveAttribute('data-selected', 'true');
  expect(republicOfCongoPath).not.toHaveAttribute('data-selected', 'true');
});
