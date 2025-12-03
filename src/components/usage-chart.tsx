'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/hooks/use-i18n';
import { Infinity } from 'lucide-react';

interface UsageChartProps {
  usage: any;
}

export function UsageChart({ usage }: UsageChartProps) {
  const { t } = useI18n();
  const [animatedValues, setAnimatedValues] = useState<Record<string, number[]>>({});
  const [isAnimating, setIsAnimating] = useState(true);

  // Generate historical data points (last 7 days simulation)
  const generateDataPoints = (currentPercent: number, unlimited: boolean = false) => {
    if (unlimited) return Array(7).fill(100);
    const points: number[] = [];
    const baseValue = currentPercent;
    for (let i = 0; i < 7; i++) {
      // Simulate some variation
      const variation = (Math.random() - 0.5) * 20;
      const value = Math.max(0, Math.min(100, baseValue - (6 - i) * 5 + variation));
      points.push(value);
    }
    return points;
  };

  useEffect(() => {
    if (!usage) return;

    // Animate line chart
    const animationDuration = 1500;
    const steps = 60;
    const stepDuration = animationDuration / steps;
    
    const chartData = {
      llmTokens: generateDataPoints(usage.llmTokens.percent, false),
      recipeCalls: generateDataPoints(usage.recipeCalls.percent, false),
      cacheSuggestions: generateDataPoints(usage.cacheSuggestions.percent, usage.cacheSuggestions.unlimited),
      chatMessages: generateDataPoints(usage.chatMessages.percent, false),
      cacheSearch: generateDataPoints(usage.cacheSearch.percent, false),
      groceriesTotal: generateDataPoints(usage.groceriesTotal.percent, usage.groceriesTotal.unlimited),
      groceriesWithExpiry: generateDataPoints(usage.groceriesWithExpiry.percent, usage.groceriesWithExpiry.unlimited),
    };

    const animate = () => {
      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        const progress = Math.min(currentStep / steps, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        
        const animated: Record<string, number[]> = {};
        (Object.keys(chartData) as Array<keyof typeof chartData>).forEach((key) => {
          animated[key] = chartData[key].map((val) => Math.round(val * eased));
        });
        
        setAnimatedValues(animated);
        
        if (currentStep >= steps) {
          clearInterval(interval);
          setIsAnimating(false);
        }
      }, stepDuration);
    };
    
    animate();
  }, [usage]);

  if (!usage) return null;

  const chartData = [
    { 
      key: 'llmTokens', 
      label: t('profile.usage.llmTokens'), 
      data: animatedValues.llmTokens || Array(7).fill(0),
      color: '#3b82f6',
      current: usage.llmTokens.percent,
      unlimited: false,
    },
    { 
      key: 'recipeCalls', 
      label: t('profile.usage.recipeCalls'), 
      data: animatedValues.recipeCalls || Array(7).fill(0),
      color: '#10b981',
      current: usage.recipeCalls.percent,
      unlimited: false,
    },
    { 
      key: 'chatMessages', 
      label: t('profile.usage.chatMessages'), 
      data: animatedValues.chatMessages || Array(7).fill(0),
      color: '#8b5cf6',
      current: usage.chatMessages.percent,
      unlimited: false,
    },
  ];

  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const maxValue = 100;
  const chartHeight = 200;
  const chartWidth = 600;
  const padding = 40;

  const getY = (value: number) => {
    return chartHeight - padding - ((value / maxValue) * (chartHeight - padding * 2));
  };

  const getX = (index: number) => {
    return padding + (index * ((chartWidth - padding * 2) / (days.length - 1)));
  };

  return (
    <div className="space-y-6">
      {chartData.map((item) => (
        <Card key={item.key}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">{item.label}</CardTitle>
              <div className="flex items-center gap-2">
                {item.unlimited ? (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Infinity className="h-4 w-4" />
                    {t('profile.unlimited')}
                  </span>
                ) : (
                  <span className="text-sm font-semibold">{item.current}%</span>
                )}
              </div>
            </div>
            <CardDescription>
              {item.unlimited 
                ? t('profile.usage.unlimitedDesc')
                : `${usage[item.key]?.used || 0} / ${usage[item.key]?.total || 0}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative" style={{ height: chartHeight, width: '100%', overflow: 'hidden' }}>
              <svg 
                width="100%" 
                height={chartHeight} 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="overflow-visible"
              >
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((val) => {
                  const y = getY(val);
                  return (
                    <line
                      key={val}
                      x1={padding}
                      x2={chartWidth - padding}
                      y1={y}
                      y2={y}
                      stroke="currentColor"
                      strokeWidth="1"
                      opacity="0.1"
                    />
                  );
                })}

                {/* Data line */}
                {item.data.length > 0 && (
                  <polyline
                    points={item.data.map((val, idx) => `${getX(idx)},${getY(val)}`).join(' ')}
                    fill="none"
                    stroke={item.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-300"
                  />
                )}

                {/* Data points */}
                {item.data.map((val, idx) => (
                  <g key={idx}>
                    <circle
                      cx={getX(idx)}
                      cy={getY(val)}
                      r="4"
                      fill={item.color}
                      className="transition-all duration-300"
                    />
                    <circle
                      cx={getX(idx)}
                      cy={getY(val)}
                      r="8"
                      fill={item.color}
                      opacity="0.2"
                      className="transition-all duration-300"
                    />
                  </g>
                ))}

                {/* X-axis labels */}
                {days.map((day, idx) => (
                  <text
                    key={idx}
                    x={getX(idx)}
                    y={chartHeight - padding / 2}
                    textAnchor="middle"
                    className="text-xs fill-muted-foreground"
                  >
                    {day}
                  </text>
                ))}

                {/* Y-axis labels */}
                {[0, 50, 100].map((val) => {
                  const y = getY(val);
                  return (
                    <text
                      key={val}
                      x={padding / 2}
                      y={y + 4}
                      textAnchor="middle"
                      className="text-xs fill-muted-foreground"
                    >
                      {val}%
                    </text>
                  );
                })}
              </svg>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
