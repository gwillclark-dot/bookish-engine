import { useCallback } from 'react';

interface VolumeSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function VolumeSlider({ label, value, onChange, isLoading, error }: VolumeSliderProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(e.target.value));
    },
    [onChange]
  );

  const percentage = Math.round(value * 100);

  return (
    <div className={`volume-slider ${error ? 'volume-slider--error' : ''}`}>
      <div className="volume-slider__header">
        <label className="volume-slider__label">
          {label}
          {isLoading && <span className="volume-slider__loading">⏳</span>}
          {error && <span className="volume-slider__error-icon" title={error}>⚠️</span>}
        </label>
        <span className="volume-slider__value">{percentage}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={handleChange}
        className="volume-slider__input"
        disabled={isLoading || !!error}
      />
    </div>
  );
}
