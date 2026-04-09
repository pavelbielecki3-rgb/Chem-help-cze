import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
  Label,
} from "recharts";
import { cn } from "../lib/utils";

export interface SpectrumPoint {
  x: number;
  y: number;
  label?: string;
}

export interface SpectraData {
  ir?: SpectrumPoint[];
  nmr1h?: SpectrumPoint[];
  nmr13c?: SpectrumPoint[];
  ms?: SpectrumPoint[];
}

interface SpectrumChartProps {
  data: SpectraData;
  className?: string;
}

export const SpectrumChart: React.FC<SpectrumChartProps> = ({ data, className }) => {
  const [activeTab, setActiveTab] = React.useState<keyof SpectraData>(
    (Object.keys(data).find((k) => data[k as keyof SpectraData]?.length) as keyof SpectraData) || "ir"
  );

  const currentData = data[activeTab];

  if (!currentData || currentData.length === 0) {
    return null;
  }

  const renderChart = () => {
    switch (activeTab) {
      case "ir":
        return (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={currentData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={[4000, 400]}
                  reversed
                  tick={{ fontSize: 12 }}
                  label={{ value: "Vlnočet (cm⁻¹)", position: "bottom", offset: 0 }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  label={{ value: "Transmitance (%)", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const point = payload[0].payload as SpectrumPoint;
                      return (
                        <div className="bg-white p-2 border border-neutral-200 rounded shadow-sm text-xs">
                          <p className="font-bold">{point.x} cm⁻¹</p>
                          <p>{point.y}% Transmitance</p>
                          {point.label && <p className="text-indigo-600 mt-1">{point.label}</p>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="y"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#4f46e5" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      case "nmr1h":
      case "nmr13c":
        return (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={currentData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={activeTab === "nmr1h" ? [12, 0] : [220, 0]}
                  reversed
                  tick={{ fontSize: 12 }}
                  label={{ value: "Chemický posun (δ, ppm)", position: "bottom", offset: 0 }}
                />
                <YAxis
                  hide
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const point = payload[0].payload as SpectrumPoint;
                      return (
                        <div className="bg-white p-2 border border-neutral-200 rounded shadow-sm text-xs">
                          <p className="font-bold">δ {point.x} ppm</p>
                          <p>Intenzita: {point.y}</p>
                          {point.label && <p className="text-indigo-600 mt-1">{point.label}</p>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="y" fill="#4f46e5" barSize={2}>
                  {currentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#4f46e5" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      case "ms":
        return (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={currentData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis
                  dataKey="x"
                  type="number"
                  tick={{ fontSize: 12 }}
                  label={{ value: "m/z", position: "bottom", offset: 0 }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  label={{ value: "Rel. abundance (%)", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const point = payload[0].payload as SpectrumPoint;
                      return (
                        <div className="bg-white p-2 border border-neutral-200 rounded shadow-sm text-xs">
                          <p className="font-bold">m/z {point.x}</p>
                          <p>{point.y}% Abundance</p>
                          {point.label && <p className="text-indigo-600 mt-1">{point.label}</p>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="y" fill="#ef4444" barSize={2}>
                  {currentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#ef4444" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn("bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm", className)}>
      <div className="flex border-b border-neutral-100 bg-neutral-50/50">
        {data.ir && data.ir.length > 0 && (
          <button
            onClick={() => setActiveTab("ir")}
            className={cn(
              "px-4 py-2 text-xs font-medium transition-colors border-r border-neutral-100",
              activeTab === "ir" ? "bg-white text-indigo-600 border-b-2 border-b-indigo-600" : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            IR Spektrum
          </button>
        )}
        {data.nmr1h && data.nmr1h.length > 0 && (
          <button
            onClick={() => setActiveTab("nmr1h")}
            className={cn(
              "px-4 py-2 text-xs font-medium transition-colors border-r border-neutral-100",
              activeTab === "nmr1h" ? "bg-white text-indigo-600 border-b-2 border-b-indigo-600" : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            ¹H NMR
          </button>
        )}
        {data.nmr13c && data.nmr13c.length > 0 && (
          <button
            onClick={() => setActiveTab("nmr13c")}
            className={cn(
              "px-4 py-2 text-xs font-medium transition-colors border-r border-neutral-100",
              activeTab === "nmr13c" ? "bg-white text-indigo-600 border-b-2 border-b-indigo-600" : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            ¹³C NMR
          </button>
        )}
        {data.ms && data.ms.length > 0 && (
          <button
            onClick={() => setActiveTab("ms")}
            className={cn(
              "px-4 py-2 text-xs font-medium transition-colors",
              activeTab === "ms" ? "bg-white text-indigo-600 border-b-2 border-b-indigo-600" : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            Hmotnostní spektrum
          </button>
        )}
      </div>
      <div className="p-4">
        {renderChart()}
      </div>
      <div className="px-4 py-2 bg-neutral-50 border-t border-neutral-100 flex justify-between items-center">
        <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">
          {activeTab.toUpperCase()} Analysis
        </span>
        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-[10px] text-neutral-500">Hlavní píky</span>
          </div>
        </div>
      </div>
    </div>
  );
};
