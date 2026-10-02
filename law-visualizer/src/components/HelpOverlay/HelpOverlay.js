import { useEffect, useRef } from 'react';
import './HelpOverlay.css';

function HelpOverlay({ onClose }) {
  const closeButtonRef = useRef(null);

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
      className="HelpOverlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="HelpOverlay-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-overlay-title"
      >
        <header className="HelpOverlay-header">
          <h2 className="HelpOverlay-title" id="help-overlay-title">Help</h2>
          <button
            className="HelpOverlay-close"
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close help"
            title="Close"
          />
        </header>
        <div className="HelpOverlay-content">
          <section>
            <h3>Explore the map</h3>
            <p>Select a state on the map or from the States list to view its legal system and country details.</p>
            <p>Drag the map to move it. Use the zoom controls or your mouse wheel to change its scale.</p>
            <div className="HelpOverlay-controls" aria-label="Map controls">
              <div className="HelpOverlay-controlRow">
                <button className="HelpOverlay-controlSample" type="button" disabled aria-label="Zoom out example">−</button>
                <span>Zoom out to see more of the map.</span>
              </div>
              <div className="HelpOverlay-controlRow">
                <button className="HelpOverlay-controlSample" type="button" disabled>Reset</button>
                <span>Return to the map's original scale and position.</span>
              </div>
              <div className="HelpOverlay-controlRow">
                <button className="HelpOverlay-controlSample" type="button" disabled>Center</button>
                <span>Center the map in the current view.</span>
              </div>
              <div className="HelpOverlay-controlRow">
                <button className="HelpOverlay-controlSample" type="button" disabled aria-label="Zoom in example">+</button>
                <span>Zoom in for a closer view.</span>
              </div>
              <div className="HelpOverlay-controlRow">
                <button className="HelpOverlay-controlSample HelpOverlay-helpSample" type="button" disabled aria-label="Help example">?</button>
                <span>Open this help panel.</span>
              </div>
              <div className="HelpOverlay-controlRow">
                <button className="HelpOverlay-controlSample HelpOverlay-collapseSample" type="button" disabled aria-label="Collapse controls example" />
                <span>Hide or show the map controls and States list.</span>
              </div>
            </div>
          </section>
          <section>
            <h3>Compare legal systems</h3>
            <p>Select a legal system in the legend to see the states associated with it, then choose a state for its details.</p>
          </section>
          <section>
            <h3>View a country map</h3>
            <p>Choose <strong>View map</strong> in the country details panel to open a larger map. Minimized maps can be restored from the tabs at the bottom of the screen.</p>
          </section>
        </div>
      </section>
    </div>
  );
}

export default HelpOverlay;