import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip, PolarAngleAxis } from 'recharts';
import { useAccessibility } from './AccessibilityContext';

interface ChartData {
  name: string;
  shortName: string;
  categoryKey: string;
  value: number;
  articleCount: number;
  fill: string;
}

interface AnimatedWasteChartProps {
  chartData: ChartData[];
  onCategoryClick: (categoryKey: string) => void;
}

export function AnimatedWasteChart({ chartData, onCategoryClick }: AnimatedWasteChartProps) {
  const { settings } = useAccessibility();
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Calculate font scale based on accessibility settings
  const fontScale = settings.fontSize === 'large' ? 1.15 : 
                    settings.fontSize === 'xlarge' ? 1.3 : 1;

  useEffect(() => {
    // Only animate once when component first mounts
    const timer = setTimeout(() => setHasAnimated(true), 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    // Detect mobile screen size
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Hide component if user has reduced motion enabled
  if (settings.reduceMotion) {
    return null;
  }

  // Map pastel colors to high-contrast colors
  const getHighContrastColor = (originalColor: string): string => {
    const isDark = settings.darkMode;
    const colorMap: { [key: string]: { light: string; dark: string } } = {
      '#e6beb5': { light: '#c74444', dark: '#ff6b6b' }, // Compostability
      '#e4e3ac': { light: '#d4b400', dark: '#ffd700' }, // Recyclability
      '#b8c8cb': { light: '#4a90a4', dark: '#6bb6d0' }, // Reusability
    };
    
    const mapping = colorMap[originalColor.toLowerCase()];
    if (mapping) {
      return isDark ? mapping.dark : mapping.light;
    }
    return originalColor;
  };

  // Apply high-contrast colors if high contrast or no pastel mode is enabled
  const adjustedChartData = (settings.highContrast || settings.noPastel)
    ? chartData.map(item => ({
        ...item,
        fill: getHighContrastColor(item.fill)
      }))
    : chartData;

  const centerX = 250;
  const centerY = 120;
  const initialRadius = 180;
  const finalRadius = 250; // Much tighter final curve to hug the donut (higher value = tighter curve)
  // On mobile, use a deeper curve to prevent text cutoff
  const mobileCurveOffset = isMobile ? 50 : 80;
  // On mobile, increase padding to prevent side cutoff
  const pathStart = isMobile ? 70 : 50;
  const pathEnd = isMobile ? 430 : 450;

  return (
    <div className="bg-white dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 p-3 lg:p-4 shadow-sm overflow-hidden">
      <div className="relative h-[350px] flex items-center justify-center">
        {/* Animated curved text */}
        <motion.div
          className="absolute top-0 left-0 right-0 flex justify-center"
          initial={{ x: -600, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <svg width="500" height="140" viewBox="0 0 500 140" className="overflow-visible w-full max-w-[500px]">
            <defs>
              {/* Define the curve path for the text */}
              <motion.path
                id="textCurve"
                initial={{
                  d: `M ${pathStart} 70 L ${pathEnd} 70` // Start as straight line
                }}
                animate={{
                  d: hasAnimated 
                    ? [
                        `M ${pathStart} ${centerY} Q ${centerX} ${centerY - initialRadius + 60} ${pathEnd} ${centerY}`, // Gentle curve
                        `M ${pathStart} ${centerY} Q ${centerX} ${centerY - finalRadius + mobileCurveOffset} ${pathEnd} ${centerY}`   // Very tight curve
                      ]
                    : `M ${pathStart} 70 L ${pathEnd} 70`
                }}
                transition={{ 
                  duration: hasAnimated ? 1.5 : 1.2, 
                  delay: 0.3, 
                  ease: "easeInOut",
                  times: hasAnimated ? [0, 1] : undefined
                }}
                fill="none"
              />
            </defs>
            
            <text
              className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white fill-black dark:fill-white"
              fontSize={isMobile ? `${16 * fontScale}` : "22"}
              textAnchor="middle"
            >
              <textPath href="#textCurve" startOffset="50%">
                What options do I have for my waste?
              </textPath>
            </text>
          </svg>
        </motion.div>

        {/* Animated donut chart with rolling effect */}
        <motion.div
          className="absolute"
          style={{ width: '100%', height: '280px', marginTop: isMobile ? '40px' : '60px' }}
          initial={{ x: 600, opacity: 0 }}
          animate={{ 
            x: 0, 
            opacity: 1
          }}
          transition={{ 
            x: { duration: 1.2, ease: "easeOut" },
            opacity: { duration: 1.2, ease: "easeOut" }
          }}
        >
          <ResponsiveContainer width="100%" height={280}>
            <RadialBarChart 
              cx="50%" 
              cy="50%" 
              innerRadius="20%" 
              outerRadius="90%"
              data={adjustedChartData}
              startAngle={90}
              endAngle={-270}
            >
              <defs>
                <filter id="contrastFilter">
                  <feColorMatrix
                    type="matrix"
                    values="3 0 0 0 -1
                            0 3 0 0 -1
                            0 0 3 0 -1
                            0 0 0 1 0"
                  />
                </filter>
                <pattern id="grayTexture" patternUnits="userSpaceOnUse" width="3" height="3">
                  <rect width="3" height="3" fill="#fff" />
                  <image href="https://www.transparenttextures.com/patterns/3px-tile.png" x="0" y="0" width="3" height="3" filter="url(#contrastFilter)" />
                </pattern>
              </defs>
              <PolarAngleAxis 
                type="number" 
                domain={[0, 100]} 
                angleAxisId={0} 
                tick={false}
                stroke="none"
              />
              <RadialBar
                background={{ fill: 'url(#grayTexture)' }}
                dataKey="value"
                cornerRadius={10}
                stroke="#211f1c"
                strokeWidth={0.5}
                strokeOpacity={0.2}
                animationDuration={2000}
                animationEasing="ease-in-out"
                onClick={(data) => {
                  if (data && data.categoryKey) {
                    onCategoryClick(data.categoryKey);
                  }
                }}
                style={{ cursor: 'pointer' }}
                label={{
                  position: 'insideStart',
                  fill: '#000000',
                  fontFamily: 'Sniglet:Regular, sans-serif',
                  fontSize: '13px',
                  formatter: (value: number) => {
                    const dataEntry = adjustedChartData.find(d => d.value === value);
                    return dataEntry ? `${value}% is ${dataEntry.shortName}` : `${value}% is`;
                  }
                }}
              />
              <Tooltip 
                cursor={false}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const articleCount = data.articleCount;
                    const articleText = articleCount === 1 ? 'article' : 'articles';
                    const categoryMap: { [key: string]: string } = {
                      'Compostable': 'compost',
                      'Recyclable': 'recycle',
                      'Reusable': 'reuse'
                    };
                    return (
                      <div className="bg-white dark:bg-[#2a2825] rounded-md border border-[#211f1c] dark:border-white/20 p-2 shadow-md">
                        <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black dark:text-white">
                          {data.value}% {categoryMap[data.name] || data.name}
                        </p>
                        <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black/60 dark:text-white/60">
                          {articleCount} {articleText}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
