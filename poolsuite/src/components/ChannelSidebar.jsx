import { CHANNELS } from '../channels';

export function ChannelSidebar({ activeId, onSelect }) {
  return (
    <div className="ps-sidebar">
      <div className="window">
        <div className="title-bar">
          <div className="title-bar-text">CHANNELS</div>
          <div className="title-bar-controls">
            <button aria-label="Minimize" />
            <button aria-label="Maximize" />
          </div>
        </div>
        <div className="window-body">
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
