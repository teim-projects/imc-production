// src/components/Charts.jsx — IMC Clean Light Theme Chart (All Chart Types Included)
import React from "react";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  // Line Chart components
  LineChart,
  Line,
  Area,
  // Bar Chart components
  BarChart,
  Bar,
  // Pie Chart components
  PieChart,
  Pie,
  Cell
} from "recharts";

// Default monthly dataset for fallback
const defaultTimeData = [
  { name: "Jan", value: 0 },
  { name: "Feb", value: 0 },
  { name: "Mar", value: 0 },
  { name: "Apr", value: 0 },
  { name: "May", value: 0 },
  { name: "Jun", value: 0 },
];

export default function Charts({ type, data }) {
  // Use dynamic chart data if available, otherwise use defaults
  const timeData = data?.chartData?.length > 0 ? data.chartData : defaultTimeData;
  
  // Pie Chart distribution data mapping directly to your live dashboard states
  const pieData = [
    { name: "Total Revenue", value: data?.totalRevenue || 0 },
    { name: "Active Bookings", value: data?.activeBookings || 0 },
    { name: "Live Events", value: data?.events || 0 },
    { name: "Active Classes", value: data?.singingClassesCount || 0 },
  ];

  // Modern vibrant palette for the light theme configuration
  const COLORS = ["#9333ea", "#4f46e5", "#ec4899", "#f59e0b"]; // Purple, Indigo, Pink, Amber

  // Shared structural styling wrapper for light-background container layout
  const containerStyle = {
    width: "100%",
    height: "100%",
    minHeight: "360px",
    background: "#ffffff",
    borderRadius: "24px",
    border: "1px solid rgba(226, 232, 240, 0.8)", // slate-200 border
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
    padding: "16px 8px 8px 8px"
  };

  // Reusable custom crisp clean light-theme tooltip component
  const customTooltip = (
    <Tooltip
      cursor={{ strokeDasharray: "4 4", stroke: "#cbd5e1" }}
      contentStyle={{
        background: "#0f172a", // Dark slate background context for perfect crisp pop out
        border: "none",
        borderRadius: "12px",
        color: "#ffffff",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
        padding: "8px 12px",
      }}
      labelStyle={{ color: "#f59e0b", fontWeight: 700, fontSize: "12px" }}
      itemStyle={{ color: "#38bdf8", fontWeight: 600, fontSize: "13px" }}
    />
  );

  // -------------------------------------------------------------
  // DYNAMIC CONDITIONAL SWITCH BLOCK DETERMINING RENDERING MATRIX
  // -------------------------------------------------------------
  switch (type) {
    case "distribution": // BAR CHART MATRIX
      return (
        <div style={containerStyle}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="4 4" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: "#64748b", fontSize: 13, fontWeight: 500 }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: "#64748b", fontSize: 13, fontWeight: 500 }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              {customTooltip}
              <Bar 
                dataKey="value" 
                fill="#9333ea" 
                radius={[8, 8, 0, 0]} 
                maxBarSize={48}
              >
                {timeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#9333ea" : "#4f46e5"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );

    case "load": // PIE MATRIX DIAGRAM
      return (
        <div style={containerStyle} className="flex flex-col items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                innerRadius={70}
                outerRadius={105}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              {customTooltip}
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-slate-600 font-semibold text-xs px-1">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );

    case "revenue": // LINE GRAPH VIEW (DEFAULT STATE)
    default:
      return (
        <div style={containerStyle}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="lightChartGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="rgba(79, 70, 229, 0)" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="4 4" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: "#64748b", fontSize: 13, fontWeight: 500 }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: "#64748b", fontSize: 13, fontWeight: 500 }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              {customTooltip}
              {/* Dynamic area background gradient filling layout */}
              <Area type="monotone" dataKey="value" stroke="none" fill="url(#lightChartGlow)" />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#4f46e5"
                strokeWidth={3.5}
                dot={false}
                activeDot={{
                  r: 6,
                  stroke: "#ffffff",
                  strokeWidth: 3,
                  fill: "#9333ea"
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
  }
}