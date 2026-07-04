import React, { useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent, Text } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { RatePoint } from '../../lib/exchangeRate';

interface RateChartProps {
  data: RatePoint[];
  height?: number;
}

export function RateChart({ data, height = 160 }: RateChartProps) {
  const [width, setWidth] = useState(0);
  const padding = 14;

  if (data.length < 2) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>Sem dados de histórico suficientes</Text>
      </View>
    );
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = width > 0
    ? data.map((d, i) => {
      const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((d.value - min) / range) * (height - padding * 2);
      return { x, y };
    })
    : [];

  const isUp = data[data.length - 1].value >= data[0].value;
  // Dólar subindo é ruim para o lojista que compra em dólar -> vermelho. Caindo -> verde.
  const lineColor = isUp ? Colors.danger : Colors.success;
  const last = points[points.length - 1];

  return (
    <View style={{ height }} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke={Colors.border} strokeDasharray="4,4" />
          <Polyline
            points={points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={lineColor}
            strokeWidth={2.5}
          />
          {last && <Circle cx={last.x} cy={last.y} r={4} fill={lineColor} />}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textMuted },
});
