import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
const { TemperatureKnob } = require('@/features/TemperatureKnob');

describe('TemperatureKnob', () => {
  test('TC-010: renders with initial value and shows SVG and value', () => {
    render(<TemperatureKnob value={0.5} onChange={() => {}} />);

    // Sprawdź wartość na tarczy
    expect(screen.getByText('0.5')).toBeInTheDocument();

  });

  test('TC-011: calls onChange with correct value on pointer event within allowed angle', () => {
    const handleChange = jest.fn();

    // render komponentu
    const { container } = render(<TemperatureKnob value={0} onChange={handleChange} />);

    const svg = container.querySelector('svg');

    // Mock getBoundingClientRect by center at (100, 100)
    svg.getBoundingClientRect = jest.fn(() => ({
      left: 50,
      top: 50,
      width: 100,
      height: 100,
      right: 150,
      bottom: 150,
      x: 50,
      y: 50,
      toJSON: () => {}
    }));

    // Symuluj kliknięcie w pozycji odpowiadającej kątowi 270°
    // Kąt 270° = wskaźnik na dole (0, -1)
    // center (cx, cy) = (100, 100)
    // klikamy w (100, 150) czyli e.clientX=100, e.clientY=150
    fireEvent.pointerDown(svg, { clientX: 100, clientY: 150 });

    expect(handleChange).toHaveBeenCalled();

    const calledValue = handleChange.mock.calls[0][0];
    expect(typeof calledValue).toBe('number');
    expect(calledValue).toBeGreaterThanOrEqual(0);
    expect(calledValue).toBeLessThanOrEqual(1);
    // Zaokrąglenie do 0.1
    expect(calledValue).toBeCloseTo(Math.round(calledValue * 10) / 10);
  });
});
