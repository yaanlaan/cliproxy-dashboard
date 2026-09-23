import React, { useState } from "react";
import { AuthFile } from "../types";
import { useI18n } from "../i18n";
import {
  TrendingUp,
  Activity,
  CheckCircle2,
  XCircle,
  BarChart2,
  Layers,
} from "lucide-react";

interface TrafficAnalyticsChartProps {
  authFiles: AuthFile[];
}

interface BucketData {
  time: string;
  success: number;
  failed: number;
  total: number;
}

export const TrafficAnalyticsChart: React.FC<TrafficAnalyticsChartProps> = ({ authFiles }) => {
  const { t } = useI18n();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 1. Calculate overall stats
  let totalSuccess = 0;
  let totalFailed = 0;

  // Provider breakdown
  const providerStats: Record<string, { success: number; failed: number; total: number }> = {};

  // Aggregate time series
  const timeBucketsMap: Record<string, { success: number; failed: number }> = {};
  const orderedTimes: string[] = [];

  authFiles.forEach((auth) => {
    totalSuccess += auth.success || 0;
    totalFailed += auth.failed || 0;

    const p = (auth.provider || auth.type || "other").toLowerCase();
    if (!providerStats[p]) {
      providerStats[p] = { success: 0, failed: 0, total: 0 };
    }
    providerStats[p].success += auth.success || 0;
    providerStats[p].failed += auth.failed || 0;
    providerStats[p].total += (auth.success || 0) + (auth.failed || 0);

    const buckets = (auth as any).recent_requests;
    if (Array.isArray(buckets)) {
      buckets.forEach((b: { time: string; success: number; failed: number }) => {
        if (!b.time) return;
        if (!timeBucketsMap[b.time]) {
          timeBucketsMap[b.time] = { success: 0, failed: 0 };
          orderedTimes.push(b.time);
        }
        timeBucketsMap[b.time].success += b.success || 0;
        timeBucketsMap[b.time].failed += b.failed || 0;
      });
    }
  });

  const totalCalls = totalSuccess + totalFailed;
  const successRate = totalCalls > 0 ? ((totalSuccess / totalCalls) * 100).toFixed(1) : "100.0";

  // Build chart points
  const chartData: BucketData[] = orderedTimes.map((time) => {
    const entry = timeBucketsMap[time];
    return {
      time: time.split("-")[0] || time, // e.g. "20:50"
      success: entry.success,
      failed: entry.failed,
      total: entry.success + entry.failed,
    };
  });

  // Calculate chart bounds
  const maxVal = Math.max(...chartData.map((d) => d.total), 10);
  const chartHeight = 160;
  const chartWidth = 600;
  const paddingX = 20;
  const paddingY = 20;
  const effectiveWidth = chartWidth - paddingX * 2;
  const effectiveHeight = chartHeight - paddingY * 2;

  const getCoordinates = (index: number, val: number) => {
    const x =
      paddingX + (index / Math.max(chartData.length - 1, 1)) * effectiveWidth;
    const y =
      paddingY + effectiveHeight - (val / maxVal) * effectiveHeight;
    return { x, y };
  };

  // Generate SVG path for line and area
  const successPoints = chartData.map((d, i) => getCoordinates(i, d.success));
  const totalPoints = chartData.map((d, i) => getCoordinates(i, d.total));

  const buildPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    return points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`;
    }, "");
  };

  const totalLine = buildPath(totalPoints);
  const totalArea =
    totalPoints.length > 0
      ? `${totalLine} L ${totalPoints[totalPoints.length - 1].x},${
          paddingY + effectiveHeight
        } L ${totalPoints[0].x},${paddingY + effectiveHeight} Z`
      : "";

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-400" />
          <div>
            <h3 className="font-semibold text-white text-sm">
              {t("overview.trafficTrends")}
            </h3>
            <p className="text-[11px] text-slate-400">
              {t("overview.trafficDesc")}
            </p>
          </div>
        </div>

        {/* Small Metric Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <Activity className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-slate-400">{t("overview.totalCalls")}:</span>
            <span className="font-bold text-white font-mono">{totalCalls}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">{t("overview.successRate")}:</span>
            <span className="font-bold text-emerald-400 font-mono">{successRate}%</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Container */}
      {chartData.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
          暂无近期请求调用历史数据
        </div>
      ) : (
        <div className="relative rounded-xl bg-slate-950/70 border border-slate-800 p-4">
          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-44 overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0c8ce9" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0c8ce9" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = paddingY + effectiveHeight * (1 - ratio);
                return (
                  <line
                    key={ratio}
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Area Fill */}
              {totalArea && (
                <path d={totalArea} fill="url(#trafficGradient)" />
              )}

              {/* Line */}
              {totalLine && (
                <path
                  d={totalLine}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Interactive Hover Dots */}
              {chartData.map((d, i) => {
                const { x, y } = getCoordinates(i, d.total);
                const isHovered = hoveredIndex === i;
                return (
                  <g key={i}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 5 : 3}
                      fill={isHovered ? "#38bdf8" : "#0284c7"}
                      stroke="#0f172a"
                      strokeWidth="2"
                      className="cursor-pointer transition-all duration-150"
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                    {/* Transparent larger hit area */}
                    <circle
                      cx={x}
                      cy={y}
                      r={15}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Time Labels */}
          <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-2 px-1">
            <span>{chartData[0]?.time}</span>
            <span>{chartData[Math.floor(chartData.length / 2)]?.time}</span>
            <span>{chartData[chartData.length - 1]?.time}</span>
          </div>

          {/* Tooltip Card */}
          {hoveredIndex !== null && chartData[hoveredIndex] && (
            <div
              className="absolute top-2 right-4 p-2.5 rounded-xl bg-slate-900 border border-slate-700 shadow-xl text-[11px] font-mono pointer-events-none z-10 space-y-1 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="text-slate-400 font-semibold border-b border-slate-800 pb-1">
                时段: {chartData[hoveredIndex].time}
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <span>成功:</span>
                <span className="font-bold">{chartData[hoveredIndex].success} 次</span>
              </div>
              <div className="flex items-center gap-2 text-rose-400">
                <span>失败:</span>
                <span className="font-bold">{chartData[hoveredIndex].failed} 次</span>
              </div>
              <div className="flex items-center gap-2 text-sky-400 font-bold pt-1 border-t border-slate-800">
                <span>总计: {chartData[hoveredIndex].total} 次</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Provider Volume Shares */}
      {Object.keys(providerStats).length > 0 && (
        <div className="pt-2 border-t border-slate-800/60">
          <div className="text-[11px] text-slate-400 font-medium mb-3 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-brand-400" />
            <span>各模型渠道调用占比与成功率</span>
          </div>
          <div className="space-y-2.5">
            {Object.entries(providerStats).map(([p, stat]) => {
              const share = totalCalls > 0 ? Math.round((stat.total / totalCalls) * 100) : 0;
              const rate = stat.total > 0 ? Math.round((stat.success / stat.total) * 100) : 100;
              return (
                <div key={p} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="capitalize font-semibold text-slate-200">{p}</span>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="text-emerald-400">{stat.success} 成功</span>
                      <span className="text-rose-400">{stat.failed} 失败</span>
                      <span className="font-bold text-white">{share}% ({stat.total}次)</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden flex">
                    <div
                      className="bg-brand-500 h-full transition-all duration-300"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
