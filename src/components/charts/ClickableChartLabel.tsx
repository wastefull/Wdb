export interface ClickableChartLabelProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  value: number;
  name: string;
  categoryKey?: string;
  onLabelClick?: (categoryKey: string) => void;
}

// Custom label component for clickable chart labels
export const ClickableChartLabel = (props: ClickableChartLabelProps) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    value,
    name,
    categoryKey,
    onLabelClick,
  } = props;

  // Calculate the middle of the radial bar
  const radius = innerRadius + (outerRadius - innerRadius) * 0.3; // Position closer to inner edge
  const angle = startAngle + (endAngle - startAngle) / 2;
  const angleInRadians = (Math.PI / 180) * -angle;

  const x = cx + radius * Math.cos(angleInRadians);
  const y = cy + radius * Math.sin(angleInRadians);

  return (
    <text
      x={x}
      y={y}
      fill="#211f1c"
      fontFamily="Sniglet:Regular, sans-serif"
      fontSize="13px"
      textAnchor="middle"
      dominantBaseline="middle"
      style={{ cursor: "pointer" }}
      onClick={(e) => {
        e.stopPropagation();
        if (onLabelClick && categoryKey) {
          onLabelClick(categoryKey);
        }
      }}
    >
      {value}% {name}
    </text>
  );
};
