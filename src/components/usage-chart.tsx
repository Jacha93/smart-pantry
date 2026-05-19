'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/hooks/use-i18n';
import { Infinity } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

interface UsageChartProps {
  usage: any;
}

export function UsageChart({ usage }: UsageChartProps) {
  const { t } = useI18n();
  const [animatedValues, setAnimatedValues] = useState<Record<string, number[]>>({});
  const [isAnimating, setIsAnimating] = useState(true);

  // Calculate percent from flat data
  const calculatePercent = (used: number, total: number) => {
    if (total <= 0 || total === -1) return 0;
    return Math.min(100, Math.round((used / total) * 100));
  };

  // Prüfe ob usage gültig ist - Backend returns flat structure
  if (!usage || typeof usage !== 'object' || Object.keys(usage).length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">{t('profile.usage.loading') || 'Loading usage data...'}</p>
      </div>
    );
  }

  // Generate historical data points (last 7 days simulation)
  const generateDataPoints = (currentPercent: number, unlimited: boolean = false) => {
    if (unlimited) return Array(7).fill(100);
    
    // Wenn currentPercent 0 ist, zeige eine gerade Linie bei 0
    if (currentPercent === 0) {
      return Array(7).fill(0);
    }
    
    const points: number[] = [];
    const baseValue = currentPercent;
    for (let i = 0; i < 7; i++) {
      // Simulate some variation, aber nicht unter 0
      const variation = (Math.random() - 0.5) * 10; // Reduzierte Variation
      const value = Math.max(0, Math.min(100, baseValue - (6 - i) * 3 + variation));
      points.push(value);
    }
    return points;
  };

  // Calculate percentages from flat data
  const llmPercent = calculatePercent(usage.llmTokensUsed || 0, usage.quotaLlmTokens || 0);
  const recipePercent = calculatePercent(usage.recipeCallsUsed || 0, usage.quotaRecipeCalls || 0);
  const chatPercent = calculatePercent(usage.chatMessagesUsed || 0, usage.maxChatMessages || 0);

  useEffect(() => {
    if (!usage || Object.keys(usage).length === 0) return;

    // Animate line chart
    const animationDuration = 1500;
    const steps = 60;
    const stepDuration = animationDuration / steps;
    
    const chartData = {
      llmTokens: generateDataPoints(llmPercent, usage.quotaLlmTokens === -1),
      recipeCalls: generateDataPoints(recipePercent, usage.quotaRecipeCalls === -1),
      chatMessages: generateDataPoints(chatPercent, false),
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

  const chartData = [
    { 
      key: 'llmTokens', 
      label: t('profile.usage.llmTokens') || 'LLM Tokens', 
      data: animatedValues.llmTokens || Array(7).fill(0),
      color: '#3b82f6',
      current: llmPercent,
      unlimited: usage.quotaLlmTokens === -1,
      used: usage.llmTokensUsed || 0,
      total: usage.quotaLlmTokens || 0,
    },
    { 
      key: 'recipeCalls', 
      label: t('profile.usage.recipeCalls') || 'Rezept-Aufrufe', 
      data: animatedValues.recipeCalls || Array(7).fill(0),
      color: '#10b981',
      current: recipePercent,
      unlimited: usage.quotaRecipeCalls === -1,
      used: usage.recipeCallsUsed || 0,
      total: usage.quotaRecipeCalls || 0,
    },
    { 
      key: 'chatMessages', 
      label: t('profile.usage.chatMessages') || 'Chat-Nachrichten', 
      data: animatedValues.chatMessages || Array(7).fill(0),
      color: '#8b5cf6',
      current: chatPercent,
      unlimited: false,
      used: usage.chatMessagesUsed || 0,
      total: usage.maxChatMessages || 0,
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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemAnim: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      {chartData.map((item) => (
        <motion.div key={item.key} variants={itemAnim}>
          <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{item.label}</CardTitle>
                <div className="flex items-center gap-2">
                  {item.unlimited ? (
                    <Badge variant="outline" className="flex items-center gap-1 border-[#17f6fe]/50 text-[#17f6fe] bg-[#17f6fe]/5">
                      <Infinity className="h-4 w-4" />
                      {t('profile.unlimited')}
                    </Badge>
                  ) : (
                    <span className="text-sm font-semibold">{item.current}%</span>
                  )}
                </div>
              </div>
              <CardDescription>
                {item.unlimited 
                  ? t('profile.usage.unlimitedDesc') || 'Unbegrenzt verfügbar'
                  : `${item.used} / ${item.total === -1 ? '∞' : item.total}`
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
                    <motion.polyline
                      points={item.data.map((val, idx) => `${getX(idx)},${getY(val)}`).join(' ')}
                      fill="none"
                      stroke={item.color}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                  )}

                  {/* Data points */}
                  {item.data.map((val, idx) => (
                    <g key={idx}>
                      <motion.circle
                        cx={getX(idx)}
                        cy={getY(val)}
                        r="4"
                        fill={item.color}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1 + idx * 0.1, duration: 0.3 }}
                      />
                      <motion.circle
                        cx={getX(idx)}
                        cy={getY(val)}
                        r="8"
                        fill={item.color}
                        opacity="0.2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1 + idx * 0.1, duration: 0.3 }}
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
        </motion.div>
      ))}
    </motion.div>
  );
}
