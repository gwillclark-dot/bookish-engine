import { CHANNELS } from '../channels';

export function ChannelSidebar({ activeId, onSelect }) {
  return (
    <div className="ps-sidebar">
      <div className="ds-panel">
        <div className="ds-panel-header">STATIONS</div>
        <div className="ds-panel-body">
          {CHANNELS.map((ch) => (
            <button
              key={ch.id}
              className={`channel-item ${ch.id === activeId ? 'active' : ''}`}
              onClick={() => onSelect(ch)}
            >
              <span className="channel-emoji">{ch.emoji}</span>
              <div>
                <div className="channel-name">{ch.name}</div>
                <div className="channel-vibe">{ch.vibe}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
