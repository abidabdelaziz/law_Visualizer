import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import nationIndex from './assets/nationIndex.json';

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

test('selects Somalia from the map when the SO path is clicked', () => {
  render(<App />);

  const somaliaPath = document.querySelector('path[id="SO"]');

  expect(somaliaPath).not.toBeNull();

  fireEvent.click(somaliaPath);

  expect(screen.getByText('Somalia (in transition)')).toBeInTheDocument();
  expect(somaliaPath).toHaveAttribute('data-selected', 'true');
});

test('selects North Macedonia from the map when the MK path is clicked', () => {
  render(<App />);

  const northMacedoniaPath = document.querySelector('path[id="MK"]');

  expect(northMacedoniaPath).not.toBeNull();

  fireEvent.click(northMacedoniaPath);

  expect(screen.getByText('Macedonia (Fyrom)')).toBeInTheDocument();
  expect(northMacedoniaPath).toHaveAttribute('data-selected', 'true');
});

test("selects Laos from the map when the LA path is clicked", () => {
  render(<App />);

  const laosPath = document.querySelector('path[id="LA"]');

  expect(laosPath).not.toBeNull();

  fireEvent.click(laosPath);

  expect(screen.getByText('Laos')).toBeInTheDocument();
  expect(laosPath).toHaveAttribute('data-selected', 'true');
});

test('selects Greenland from the map when the GL path is clicked', () => {
  render(<App />);

  const greenlandPath = document.querySelector('path[id="GL"]');

  expect(greenlandPath).not.toBeNull();

  fireEvent.click(greenlandPath);

  expect(screen.getByText('Greenland')).toBeInTheDocument();
  expect(greenlandPath).toHaveAttribute('data-selected', 'true');
});

test('shows countries for a selected legal system', () => {
  render(<App />);

  fireEvent.click(screen.getByText('Civil Law', { selector: '.App-legendLabel' }));

  expect(screen.getByRole('list', { name: 'Civil Law countries' })).toBeInTheDocument();
  expect(screen.getByText('Civil Law', { selector: '.App-menuTitle' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Albania' })).toBeInTheDocument();
});

test('navigates from a legal-system country list to details and back', () => {
  render(<App />);

  fireEvent.click(screen.getByText('Civil Law', { selector: '.App-legendLabel' }));
  fireEvent.click(screen.getByRole('button', { name: 'Albania' }));

  expect(screen.getByText('Country details', { selector: '.App-menuTitle' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Back to Civil Law countries' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Back to Civil Law countries' }));

  expect(screen.getByRole('list', { name: 'Civil Law countries' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Back to Civil Law countries' })).not.toBeInTheDocument();
});

test('opens details from the States list without a back arrow', () => {
  render(<App />);

  fireEvent.focus(screen.getByRole('searchbox', { name: 'Search states' }));
  fireEvent.click(screen.getByRole('button', { name: 'Albania' }));

  expect(screen.getByText('Country details', { selector: '.App-menuTitle' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Back to/ })).not.toBeInTheDocument();
});

test('shows Country details directly for a legal system with one country', () => {
  const countryByLegalSystem = nationIndex.reduce((groups, country) => {
    const legalSystem = country['Legal System'];

    if (legalSystem) {
      groups[legalSystem] = [...(groups[legalSystem] || []), country];
    }

    return groups;
  }, {});
  const [legalSystem, countries] = Object.entries(countryByLegalSystem)
    .find(([, groupedCountries]) => groupedCountries.length === 1);

  render(<App />);

  fireEvent.click(screen.getByText(legalSystem, { selector: '.App-legendLabel' }));

  expect(screen.getByText('Country details', { selector: '.App-menuTitle' })).toBeInTheDocument();
  expect(screen.getByText(countries[0].State)).toBeInTheDocument();
  expect(screen.queryByRole('list', { name: `${legalSystem} countries` })).not.toBeInTheDocument();
});

test('restores Country details when a map country is selected from a legal-system list', () => {
  render(<App />);

  fireEvent.click(screen.getByText('Civil Law', { selector: '.App-legendLabel' }));
  fireEvent.click(document.querySelector('path[id="SO"]'));

  expect(screen.getByText('Country details', { selector: '.App-menuTitle' })).toBeInTheDocument();
  expect(screen.queryByRole('list', { name: 'Civil Law countries' })).not.toBeInTheDocument();
  expect(screen.getByText('Somalia (in transition)')).toBeInTheDocument();
});

test('selects France when the French Guiana map path is clicked', () => {
  render(<App />);

  const frenchGuianaPath = document.querySelector('path[id="GF"]');

  expect(frenchGuianaPath).not.toBeNull();

  fireEvent.click(frenchGuianaPath);

  expect(screen.getByText('France')).toBeInTheDocument();
  expect(frenchGuianaPath).toHaveAttribute('data-selected', 'true');
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
