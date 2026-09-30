import './MapTabs.css';

function MapTabs({ overlays, onRestore, onClose }) {
  if (overlays.length === 0) {
    return null;
  }

  return (
    <div
      className="MapTabs"
      role="group"
      aria-label="Minimized country maps"
      onWheel={(event) => {
        event.currentTarget.scrollLeft += event.deltaX || event.deltaY;
      }}
    >
      {overlays.map((overlay) => (
        <div className="MapTabs-tab" key={overlay.id}>
          <button
            className="MapTabs-restore"
            type="button"
            onClick={() => onRestore(overlay.id)}
            aria-label={`Restore map for ${overlay.countryName}`}
            title={`Restore ${overlay.countryName} map`}
          >
            {overlay.countryName}
          </button>
          <button
            className="MapTabs-close"
            type="button"
            onClick={() => onClose(overlay.id)}
            aria-label={`Close minimized map for ${overlay.countryName}`}
            title={`Close ${overlay.countryName} map`}
          />
        </div>
      ))}
    </div>
  );
}

export default MapTabs;