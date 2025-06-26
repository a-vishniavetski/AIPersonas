import React, { useState } from 'react';
import PropTypes from "prop-types";
export const TemperatureKnob = ({ value, onChange }) => {
  // value: 0-1

  // Kąt startu i końca w stopniach
  const startAngle = 210;  // ok. godz. 7
  const endAngle = 315;    // ok. godz. 4.5
  const angleRange = endAngle - startAngle; // 105 stopni

  // Kąt wskazówki dla wartości
  const angle = startAngle + value * angleRange;

  // Obsługa drag / kliknięcia
  const svgRef = React.useRef(null);

  // Konwersja pozycji myszy na wartość 0-1
  const handlePointerMove = (e) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    // atan2 zwraca kąt w radianach (-pi do pi)
    let rad = Math.atan2(dy, dx);
    let deg = (rad * 180) / Math.PI; // konwersja na stopnie
    if (rad < 0) deg += 360;

    // Sprawdź, czy kąt mieści się w zakresie od startAngle do endAngle
    // Uwaga: zakres jest od 210 do 315 stopni, więc jeśli kąt jest mniejszy niż 210,
    // albo większy niż 315, ignorujemy (lub ustawiamy wartość na krawędź)
    // Tutaj zrobimy ograniczenie:
    let clampedAngle;
    if (deg >= startAngle && deg <= endAngle) {
      clampedAngle = deg;
    } else {
      const distToStart = Math.abs(deg - startAngle);
      const distToEnd = Math.abs(deg - endAngle);
      clampedAngle = distToStart < distToEnd ? startAngle : endAngle;
    }

    let newValue = (clampedAngle - startAngle) / angleRange;
    newValue = Math.max(0, Math.min(1, newValue)); // clamp
    newValue = Math.round(newValue * 10) / 10;     // zaokrąglenie

    onChange(newValue);
  };

  // Obsługa kliknięcia i przeciągania
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (e) => {
    e.preventDefault();
    setDragging(true);
    handlePointerMove(e);
  };
  const onPointerUp = (e) => {
    e.preventDefault();
    setDragging(false);
  };
  const onPointerMoveWrapper = (e) => {
    if (dragging) {
      e.preventDefault();
      handlePointerMove(e);
    }
  };

  return (
    <svg
      ref={svgRef}
      width="120"
      height="120"
      viewBox="0 0 120 120"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMoveWrapper}
      onPointerUp={onPointerUp}
      style={{ cursor: 'pointer', userSelect: 'none' }}
    >
      {/* Tarcza */}
      <circle cx="60" cy="60" r="50" fill="#222" stroke="red" strokeWidth="3" />

      {/* Znaczniki co 0.1 */}
      {[...Array(11).keys()].map(i => {
        const stepAngle = startAngle + (i / 10) * angleRange;
        const rad = (stepAngle * Math.PI) / 180;
        const x1 = 60 + Math.cos(rad) * 45;
        const y1 = 60 + Math.sin(rad) * 45;
        const x2 = 60 + Math.cos(rad) * 50;
        const y2 = 60 + Math.sin(rad) * 50;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#888" strokeWidth="1" />;
      })}

      {/* Wskaźnik */}
      <line
        x1="60"
        y1="60"
        x2={60 + Math.cos((angle * Math.PI) / 180) * 40}
        y2={60 + Math.sin((angle * Math.PI) / 180) * 40}
        stroke="red"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Środek */}
      <circle cx="60" cy="60" r="6" fill="red" />

      {/* Wyświetl wartość */}
      <text x="60" y="90" fontSize="16" fill="red" textAnchor="middle" fontFamily="monospace">
        {value.toFixed(1)}
      </text>
    </svg>
  );
};

TemperatureKnob.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func,
};
