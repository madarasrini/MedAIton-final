import React, { useEffect, useRef, useState, useMemo, FC } from 'react';
import * as d3 from 'd3';
import { Bed, BedStatus, RiskHistoryPoint } from '../types.ts';
import { SparklesIcon, SirenIcon, ShieldAlertIcon, CheckCircleIcon } from './Icons.tsx';

interface BedRiskTrendChartProps {
  beds: Bed[];
  onSelectBed?: (bedId: string) => void;
}

interface ChartDataSeries {
  id: string;
  bedNumber: number;
  ward: string;
  patientName: string;
  acuityLevel?: string;
  currentRisk: number;
  history: RiskHistoryPoint[];
  color: string;
}

const WARD_COLORS: Record<string, string> = {
  Cardiology: '#ef4444', // Red
  Neurology: '#8b5cf6', // Violet
  General: '#3b82f6', // Blue
  Pediatrics: '#10b981', // Emerald
  ICU: '#f97316', // Orange
  Emergency: '#ec4899', // Pink
};

export const BedRiskTrendChart: FC<BedRiskTrendChartProps> = ({ beds, onSelectBed }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [selectedWard, setSelectedWard] = useState<string>('All');
  const [selectedBedId, setSelectedBedId] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'all' | 'critical' | 'ward_avg'>('all');

  // Wards list
  const wards = useMemo(() => {
    const unique = Array.from(new Set(beds.map(b => b.ward)));
    return ['All', ...unique];
  }, [beds]);

  // Occupied beds with valid risk score & history
  const chartSeries = useMemo<ChartDataSeries[]>(() => {
    const occupied = beds.filter(b => b.status === BedStatus.Occupied);
    return occupied.map((bed, index) => {
      const history = bed.riskHistory && bed.riskHistory.length > 0
        ? [...bed.riskHistory].sort((a, b) => b.hoursAgo - a.hoursAgo)
        : [
            { timestamp: '24h ago', hoursAgo: 24, score: Math.max(10, (bed.mlRiskScore ?? 50) - 10) },
            { timestamp: '12h ago', hoursAgo: 12, score: Math.max(10, (bed.mlRiskScore ?? 50) - 5) },
            { timestamp: 'Now', hoursAgo: 0, score: bed.mlRiskScore ?? 50 }
          ];

      const wardColor = WARD_COLORS[bed.ward] || d3.schemeCategory10[index % 10];

      return {
        id: bed.id,
        bedNumber: bed.bedNumber,
        ward: bed.ward,
        patientName: bed.patientName || `Patient ${bed.patientId || bed.bedNumber}`,
        acuityLevel: bed.acuityLevel || 'Moderate',
        currentRisk: bed.mlRiskScore ?? 50,
        history,
        color: wardColor,
      };
    });
  }, [beds]);

  // Filtered series
  const filteredSeries = useMemo(() => {
    return chartSeries.filter(series => {
      if (selectedWard !== 'All' && series.ward !== selectedWard) return false;
      if (selectedBedId !== 'All' && series.id !== selectedBedId) return false;
      if (viewMode === 'critical' && series.currentRisk < 50) return false;
      return true;
    });
  }, [chartSeries, selectedWard, selectedBedId, viewMode]);

  // Highest risk calculation
  const highestRiskBed = useMemo(() => {
    if (chartSeries.length === 0) return null;
    return [...chartSeries].sort((a, b) => b.currentRisk - a.currentRisk)[0];
  }, [chartSeries]);

  // Ward Averages
  const wardAverages = useMemo(() => {
    const wardMap: Record<string, { total: number; count: number; name: string }> = {};
    chartSeries.forEach(s => {
      if (!wardMap[s.ward]) wardMap[s.ward] = { total: 0, count: 0, name: s.ward };
      wardMap[s.ward].total += s.currentRisk;
      wardMap[s.ward].count += 1;
    });
    return Object.values(wardMap).map(w => ({
      ward: w.name,
      avg: Math.round(w.total / w.count),
      count: w.count,
    }));
  }, [chartSeries]);

  // D3 Chart Render Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 700;
    const height = 340;
    const margin = { top: 25, right: 35, bottom: 45, left: 45 };
    const innerWidth = containerWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg
      .attr('width', containerWidth)
      .attr('height', height)
      .attr('viewBox', `0 0 ${containerWidth} ${height}`);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale: 24h ago -> 0h (Current)
    const xScale = d3
      .scaleLinear()
      .domain([24, 0]) // 24 hours ago on left, 0h (now) on right
      .range([0, innerWidth]);

    // Y Scale: 0 -> 100 risk score
    const yScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]).nice();

    // Background Risk Zone Bands
    // Critical (75 - 100)
    g.append('rect')
      .attr('x', 0)
      .attr('y', yScale(100))
      .attr('width', innerWidth)
      .attr('height', yScale(75) - yScale(100))
      .attr('fill', '#fee2e2')
      .attr('opacity', 0.45);

    // High Risk (50 - 75)
    g.append('rect')
      .attr('x', 0)
      .attr('y', yScale(75))
      .attr('width', innerWidth)
      .attr('height', yScale(50) - yScale(75))
      .attr('fill', '#fef3c7')
      .attr('opacity', 0.4);

    // Moderate (30 - 50)
    g.append('rect')
      .attr('x', 0)
      .attr('y', yScale(50))
      .attr('width', innerWidth)
      .attr('height', yScale(30) - yScale(50))
      .attr('fill', '#eff6ff')
      .attr('opacity', 0.4);

    // Stable (0 - 30)
    g.append('rect')
      .attr('x', 0)
      .attr('y', yScale(30))
      .attr('width', innerWidth)
      .attr('height', yScale(0) - yScale(30))
      .attr('fill', '#ecfdf5')
      .attr('opacity', 0.35);

    // Zone labels on right margin
    const zoneLabels = [
      { y: 88, text: 'CRITICAL (75%+)', color: '#b91c1c' },
      { y: 62, text: 'HIGH (50-75%)', color: '#b45309' },
      { y: 40, text: 'MODERATE', color: '#1d4ed8' },
      { y: 15, text: 'STABLE', color: '#047857' },
    ];

    zoneLabels.forEach(z => {
      g.append('text')
        .attr('x', innerWidth - 6)
        .attr('y', yScale(z.y))
        .attr('text-anchor', 'end')
        .attr('font-size', '9px')
        .attr('font-weight', '700')
        .attr('fill', z.color)
        .attr('opacity', 0.6)
        .text(z.text);
    });

    // Horizontal Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(yScale)
          .tickValues([0, 25, 50, 75, 100])
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-dasharray', '3,3');

    // X Axis
    const xAxis = d3
      .axisBottom(xScale)
      .tickValues([24, 20, 16, 12, 8, 4, 2, 0])
      .tickFormat(d => (d === 0 ? 'Now' : `-${d}h`));

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call(axis => axis.select('.domain').attr('stroke', '#cbd5e1'))
      .selectAll('text')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#64748b');

    // Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d => `${d}%`);

    g.append('g')
      .call(yAxis)
      .call(axis => axis.select('.domain').attr('stroke', '#cbd5e1'))
      .selectAll('text')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#64748b');

    // Axis Labels
    svg
      .append('text')
      .attr('x', margin.left + innerWidth / 2)
      .attr('y', height - 8)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('fill', '#475569')
      .text('Timeline (Last 24 Hours to Live)');

    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(margin.top + innerHeight / 2))
      .attr('y', 14)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('fill', '#475569')
      .text('ML Deterioration Risk Score (%)');

    // D3 Line Generator
    const lineGenerator = d3
      .line<RiskHistoryPoint>()
      .x(d => xScale(d.hoursAgo))
      .y(d => yScale(d.score))
      .curve(d3.curveMonotoneX);

    // If Ward Average mode
    if (viewMode === 'ward_avg') {
      const wardGroups = d3.group(chartSeries, d => d.ward);
      wardGroups.forEach((bedsInWard, wardName) => {
        const timePoints = [24, 20, 16, 12, 8, 4, 2, 0];
        const avgHistory: RiskHistoryPoint[] = timePoints.map(h => {
          let sum = 0;
          let count = 0;
          bedsInWard.forEach(b => {
            const pt = b.history.find(p => p.hoursAgo === h) || b.history[b.history.length - 1];
            if (pt) {
              sum += pt.score;
              count++;
            }
          });
          return {
            timestamp: h === 0 ? 'Now' : `-${h}h`,
            hoursAgo: h,
            score: count > 0 ? Math.round(sum / count) : 0,
          };
        });

        const color = WARD_COLORS[wardName] || '#6366f1';

        // Draw line
        const path = g
          .append('path')
          .datum(avgHistory)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 3.5)
          .attr('stroke-linejoin', 'round')
          .attr('stroke-linecap', 'round')
          .attr('d', lineGenerator);

        // Animate line entrance
        const totalLength = path.node()?.getTotalLength() || 0;
        path
          .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
          .attr('stroke-dashoffset', totalLength)
          .transition()
          .duration(900)
          .ease(d3.easeCubicOut)
          .attr('stroke-dashoffset', 0);

        // Draw points
        avgHistory.forEach(pt => {
          g.append('circle')
            .attr('cx', xScale(pt.hoursAgo))
            .attr('cy', yScale(pt.score))
            .attr('r', pt.hoursAgo === 0 ? 5 : 3.5)
            .attr('fill', color)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer');
        });
      });
    } else {
      // Individual Beds Lines
      filteredSeries.forEach(series => {
        const path = g
          .append('path')
          .datum(series.history)
          .attr('fill', 'none')
          .attr('stroke', series.color)
          .attr('stroke-width', selectedBedId === series.id ? 3.5 : 2.2)
          .attr('opacity', selectedBedId !== 'All' && selectedBedId !== series.id ? 0.25 : 0.9)
          .attr('stroke-linejoin', 'round')
          .attr('stroke-linecap', 'round')
          .attr('d', lineGenerator);

        // Path entrance animation
        const totalLength = path.node()?.getTotalLength() || 0;
        path
          .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
          .attr('stroke-dashoffset', totalLength)
          .transition()
          .duration(700)
          .ease(d3.easeCubicOut)
          .attr('stroke-dashoffset', 0);

        // Draw data points
        series.history.forEach(pt => {
          const circle = g
            .append('circle')
            .attr('cx', xScale(pt.hoursAgo))
            .attr('cy', yScale(pt.score))
            .attr('r', pt.hoursAgo === 0 ? 5.5 : 3.5)
            .attr('fill', series.color)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer');

          // Hover interaction
          circle.on('mouseenter', (event) => {
            if (!tooltipRef.current) return;
            const tooltip = d3.select(tooltipRef.current);
            tooltip.style('opacity', 1);
            tooltip.html(`
              <div class="space-y-1">
                <div class="flex items-center justify-between gap-2 border-b border-slate-700 pb-1">
                  <span class="font-bold text-white">Bed ${series.bedNumber} (${series.ward})</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-mono">${pt.timestamp || (pt.hoursAgo === 0 ? 'Now' : `-${pt.hoursAgo}h`)}</span>
                </div>
                <p class="text-xs text-slate-300 font-medium">${series.patientName}</p>
                <div class="flex items-center justify-between pt-1">
                  <span class="text-xs font-semibold text-slate-400">Risk Score:</span>
                  <span class="text-sm font-black ${pt.score >= 75 ? 'text-red-400' : pt.score >= 50 ? 'text-amber-400' : 'text-emerald-400'}">${pt.score}%</span>
                </div>
              </div>
            `);

            const [xPos, yPos] = d3.pointer(event, containerRef.current);
            tooltip
              .style('left', `${Math.min(containerWidth - 210, Math.max(10, xPos - 80))}px`)
              .style('top', `${Math.max(10, yPos - 90)}px`);
          });

          circle.on('mouseleave', () => {
            if (tooltipRef.current) {
              d3.select(tooltipRef.current).style('opacity', 0);
            }
          });

          circle.on('click', () => {
            if (onSelectBed) onSelectBed(series.id);
          });
        });
      });
    }

    // Interactive Hover Vertical Guide Bar
    const crosshair = g
      .append('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .style('opacity', 0);

    svg.on('mousemove', event => {
      const [xPos] = d3.pointer(event, g.node());
      if (xPos >= 0 && xPos <= innerWidth) {
        crosshair
          .attr('x1', xPos)
          .attr('x2', xPos)
          .attr('y1', 0)
          .attr('y2', innerHeight)
          .style('opacity', 0.6);
      } else {
        crosshair.style('opacity', 0);
      }
    });

    svg.on('mouseleave', () => {
      crosshair.style('opacity', 0);
      if (tooltipRef.current) {
        d3.select(tooltipRef.current).style('opacity', 0);
      }
    });
  }, [filteredSeries, viewMode, selectedBedId]);

  // ResizeObserver for dynamic responsiveness
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      // Trigger re-render of chart
      setSelectedWard(prev => prev);
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6 animate-fade-in" id="d3-ml-risk-trend-container">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <SparklesIcon className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">D3 Dynamic Telemetry</span>
          </div>
          <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">24-Hour ML Patient Risk Score Trends</h3>
          <p className="text-xs text-gray-500">
            Real-time longitudinal predictive trajectory tracking deterioration risk across active bed assignments.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-2xl border border-gray-200">
          <button
            onClick={() => { setViewMode('all'); setSelectedBedId('All'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'all' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Beds ({chartSeries.length})
          </button>
          <button
            onClick={() => { setViewMode('critical'); setSelectedBedId('All'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'critical' ? 'bg-rose-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            High Risk (≥50%)
          </button>
          <button
            onClick={() => setViewMode('ward_avg')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'ward_avg' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Ward Averages
          </button>
        </div>
      </div>

      {/* Analytics Summary Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {highestRiskBed && (
          <div className="p-3 bg-red-50/80 rounded-2xl border border-red-200 flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-xl">
              <SirenIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-red-600">Highest Risk Patient</p>
              <p className="text-sm font-black text-gray-900">
                Bed {highestRiskBed.bedNumber} ({highestRiskBed.currentRisk}%)
              </p>
              <p className="text-[11px] text-gray-600 truncate">{highestRiskBed.patientName}</p>
            </div>
          </div>
        )}

        <div className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-200 flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
            <ShieldAlertIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Ward Risk Breakdown</p>
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {wardAverages.map(w => (
                <span key={w.ward} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-indigo-900 border border-indigo-100">
                  {w.ward}: {w.avg}%
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
            <CheckCircleIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">ML Trend Stability</p>
            <p className="text-sm font-black text-emerald-900">
              {chartSeries.filter(s => s.currentRisk < 50).length} of {chartSeries.length} Stable
            </p>
            <p className="text-[11px] text-emerald-700">Predictive recovery trajectory optimal</p>
          </div>
        </div>
      </div>

      {/* Filter Row: Ward & Bed Specific Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-200 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-gray-500 uppercase text-[10px]">Filter Ward:</span>
          {wards.map(ward => (
            <button
              key={ward}
              onClick={() => setSelectedWard(ward)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                selectedWard === ward
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              {ward}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-500 uppercase text-[10px]">Highlight Bed:</span>
          <select
            value={selectedBedId}
            onChange={e => setSelectedBedId(e.target.value)}
            className="p-1.5 bg-white border border-gray-300 rounded-xl font-semibold text-gray-700"
          >
            <option value="All">All Beds</option>
            {chartSeries.map(b => (
              <option key={b.id} value={b.id}>
                Bed {b.bedNumber} ({b.ward} - {b.currentRisk}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* D3 SVG Canvas Container */}
      <div ref={containerRef} className="relative w-full overflow-x-auto">
        <svg ref={svgRef} className="w-full select-none"></svg>

        {/* Floating D3 Tooltip */}
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none opacity-0 transition-opacity duration-150 bg-slate-900/95 text-white p-3 rounded-xl shadow-2xl border border-slate-700 text-xs z-20 w-48 backdrop-blur-sm"
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-[10px] font-black uppercase text-gray-400">Ward Color Coding:</span>
          {Object.entries(WARD_COLORS).map(([ward, color]) => (
            <div key={ward} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
              <span className="font-semibold text-gray-700 text-[11px]">{ward}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live updates synchronized with 7s telemetry interval</span>
        </div>
      </div>
    </div>
  );
};
