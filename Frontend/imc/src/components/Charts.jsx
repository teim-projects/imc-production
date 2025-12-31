// Charts.jsx — IMC Dark Glass Chart (Final Visual Match)
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
} from "recharts";

const data = [
  { name: "Jan", value: 200 },
  { name: "Feb", value: 180 },
  { name: "Mar", value: 320 },
  { name: "Apr", value: 480 },
  { name: "May", value: 440 },
  { name: "Jun", value: 640 },
];

export default function Charts() {
  return (
    <div
      style={{
        width: "100%",
        height: 360,
        background:
          "linear-gradient(180deg, rgba(12,20,44,.85), rgba(9,14,32,.92))",
        borderRadius: "20px",
        border: "1px solid rgba(255,255,255,.08)",
        boxShadow:
          "0 16px 40px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.06)",
        backdropFilter: "blur(12px)",
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 24, left: -10, bottom: 0 }}
        >
          {/* Frosted grid */}
          <CartesianGrid
            stroke="rgba(233,239,255,.08)"
            strokeDasharray="4 6"
            vertical={false}
          />

          {/* X Axis */}
          <XAxis
            dataKey="name"
            tick={{ fill: "rgba(233,239,255,.75)", fontSize: 13 }}
            axisLine={{ stroke: "rgba(233,239,255,.15)" }}
            tickLine={false}
          />
          {/* Y Axis */}
          <YAxis
            tick={{ fill: "rgba(233,239,255,.7)", fontSize: 13 }}
            axisLine={{ stroke: "rgba(233,239,255,.15)" }}
            tickLine={false}
          />

          {/* Tooltip with glassmorphism */}
          <Tooltip
            cursor={{ strokeDasharray: "4 4", stroke: "rgba(255,255,255,.25)" }}
            contentStyle={{
              background: "rgba(15,20,42,.95)",
              border: "1px solid rgba(255,255,255,.15)",
              borderRadius: "14px",
              color: "#e9f0ff",
              boxShadow: "0 12px 28px rgba(0,0,0,.6)",
              backdropFilter: "blur(10px)",
              padding: "10px 14px",
            }}
            labelStyle={{ color: "#ffd23f", fontWeight: 600 }}
            itemStyle={{ color: "#8fc6ff", fontWeight: 600 }}
          />

          {/* Soft blue area glow */}
          <defs>
            <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4aa8ff" stopOpacity={0.35} />
              <stop offset="100%" stopColor="rgba(10,20,40,0)" />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="none"
            fill="url(#chartGlow)"
          />

          {/* Main line — glowing blue */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#4aa8ff"
            strokeWidth={3.5}
            dot={false}
            activeDot={{
              r: 7,
              stroke: "#ffd23f",
              strokeWidth: 4,
              fill: "#4aa8ff",
              filter: "drop-shadow(0 0 10px rgba(255,210,63,.8))",
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
