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