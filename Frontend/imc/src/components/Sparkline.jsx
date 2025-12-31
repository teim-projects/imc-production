export default function Sparkline({ data, color = "#ff6b6b" }) {
  const max = Math.max(...data);
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max) * 100}`).join(" ");
  return (
    <svg width="100%" height="60" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="3" points={points} strokeLinecap="round" />
      <polyline fill={`${color}22`} points={`0,100 ${points} 100,100`} />
    </svg>
  );
}