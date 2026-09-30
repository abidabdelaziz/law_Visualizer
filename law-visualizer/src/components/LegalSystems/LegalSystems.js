import { useState } from 'react';
import nationIndex from '../../assets/nationIndex.json';
import './LegalSystems.css';

const legalSystemCounts = nationIndex.reduce((counts, country) => {
  const legalSystem = country['Legal System'];

  if (legalSystem) {
    counts[legalSystem] = (counts[legalSystem] || 0) + 1;
  }

  return counts;
}, {});

export const legalSystems = Object.keys(legalSystemCounts)
  .sort((first, second) => first.localeCompare(second));

export const legalSystemColors = legalSystems.reduce((colors, legalSystem, index) => {
  colors[legalSystem] = `hsl(${Math.round((index * 360) / legalSystems.length)} 72% 58%)`;
  return colors;
}, {});

function LegalSystems({ selectedLegalSystem, onSelect }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside className="App-legend" aria-label="Legal system legend">
      <div className="App-legendHeader">
        <div className="App-menuTitle">Legal systems</div>
        <button
          className={`App-legendToggle${isOpen ? '' : ' is-collapsed'}`}
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-controls="legal-system-legend-list"
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Collapse legal systems legend' : 'Expand legal systems legend'}
        />
      </div>
      {isOpen ? (
        <div className="App-legendList" id="legal-system-legend-list">
          {legalSystems.map((legalSystem) => (
            <button
              className={`App-legendItem${selectedLegalSystem === legalSystem ? ' is-selected' : ''}`}
              key={legalSystem}
              type="button"
              onClick={() => onSelect(legalSystem)}
              aria-pressed={selectedLegalSystem === legalSystem}
            >
              <span
                className="App-legendSwatch"
                style={{ backgroundColor: legalSystemColors[legalSystem] }}
                aria-hidden="true"
              />
              <span className="App-legendLabel">{legalSystem}</span>
              <span className="App-legendCount">{legalSystemCounts[legalSystem]}</span>
            </button>
          ))}
        </div>
      ) : null}
    </aside>
  );
}

export default LegalSystems;