import React from 'react';
import { ConsumptionSegment } from '../../types/index.ts';
import { Fuel, Info } from 'lucide-react';

interface ConsumptionHistoryChartProps {
  segments: ConsumptionSegment[];
  overallAverage: number | null;
  isEv: boolean;
}

export const ConsumptionHistoryChart: React.FC<ConsumptionHistoryChartProps> = ({
  segments,
  overallAverage,
  isEv,
}) => {
  const unit = isEv ? 'kWh/100km' : 'L/100km';

  if (!segments || segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-5 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-2">
        <div className="p-2 rounded-xl bg-slate-800/80 text-slate-400">
          <Fuel className="h-5 w-5" />
        </div>
        <p className="text-xs font-medium text-slate-300">Données insuffisantes</p>
        <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
          Pour calculer la consommation réelle, enregistrez au moins deux pleins complets (100%) successifs avec leur kilométrage.
        </p>
      </div>
    );
  }

  // Calcul dimensions SVG pour le graphique
  const maxVal = Math.max(...segments.map((s) => s.consumptionL100km), (overallAverage || 7) * 1.2);
  const minVal = Math.max(0, Math.min(...segments.map((s) => s.consumptionL100km), (overallAverage || 5) * 0.8) - 1);
  const range = maxVal - minVal || 1;

  const width = 360;
  const height = 120;
  const paddingX = 30;
  const paddingY = 20;

  const points = segments.map((seg, idx) => {
    const x = paddingX + (idx / Math.max(1, segments.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((seg.consumptionL100km - minVal) / range) * (height - 2 * paddingY);
    return { x, y, seg };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`;
  }, '');

  return (
    <div className="space-y-3">
      {/* Résumé de consommation */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400">Consommation moyenne calculée :</span>
          <div className="text-lg font-bold text-teal-400">
            {overallAverage?.toFixed(2)} <span className="text-xs font-normal text-slate-300">{unit}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">Dernier intervalle :</span>
          <div className="text-sm font-semibold text-slate-200">
            {segments[segments.length - 1].consumptionL100km.toFixed(2)} {unit}
          </div>
        </div>
      </div>

      {/* Graphique SVG */}
      <div className="relative w-full overflow-hidden rounded-xl bg-slate-900/60 p-2 border border-slate-800">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible">
          {/* Ligne moyenne */}
          {overallAverage && (
            <line
              x1={paddingX}
              y1={height - paddingY - ((overallAverage - minVal) / range) * (height - 2 * paddingY)}
              x2={width - paddingX}
              y2={height - paddingY - ((overallAverage - minVal) / range) * (height - 2 * paddingY)}
              stroke="#0f766e"
              strokeDasharray="4 4"
              strokeWidth="1.5"
            />
          )}

          {/* Courbe */}
          <path d={pathD} fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Points */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle cx={pt.x} cy={pt.y} r="4.5" fill="#0f172a" stroke="#14b8a6" strokeWidth="2" />
              <text
                x={pt.x}
                y={pt.y - 8}
                fill="#e2e8f0"
                fontSize="9"
                fontWeight="600"
                textAnchor="middle"
              >
                {pt.seg.consumptionL100km.toFixed(1)}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Note explicative conforme aux hypothèses */}
      <div className="flex items-start gap-1.5 text-[11px] text-slate-400 bg-slate-800/30 p-2 rounded-lg">
        <Info className="h-3.5 w-3.5 text-teal-400 shrink-0 mt-0.5" />
        <span>
          Calcul conforme : litres consommés ÷ kilomètres parcourus × 100 entre chaque plein complet (intégrant les pleins partiels intermédiaires).
        </span>
      </div>
    </div>
  );
};
