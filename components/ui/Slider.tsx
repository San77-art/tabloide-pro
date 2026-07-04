import React, { useState } from 'react';
import { View, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';
import { Colors } from '../../constants/colors';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  trackColor?: string;
}

export function Slider({ value, min, max, step = 1, onChange, trackColor = Colors.primary }: SliderProps) {
  const [width, setWidth] = useState(0);
  const percent = width > 0 ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;

  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const valueFromX = (x: number) => {
    if (width === 0) return value;
    const raw = (x / width) * (max - min) + min;
    const stepped = Math.round((raw - min) / step) * step + min;
    return clamp(stepped);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => onChange(valueFromX(evt.nativeEvent.locationX)),
    onPanResponderMove: (evt) => onChange(valueFromX(evt.nativeEvent.locationX)),
  });

  return (
    <View
      style={styles.track}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <View style={styles.barBg} />
      <View style={[styles.fill, { width: `${percent * 100}%`, backgroundColor: trackColor }]} />
      <View style={[styles.thumb, { left: `${percent * 100}%`, borderColor: trackColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 36, justifyContent: 'center' },
  barBg: {
    position: 'absolute', left: 0, right: 0, top: 16,
    height: 4, borderRadius: 2, backgroundColor: Colors.border,
  },
  fill: {
    position: 'absolute', left: 0, top: 16, height: 4, borderRadius: 2,
  },
  thumb: {
    position: 'absolute', top: 8, width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#fff', borderWidth: 3, marginLeft: -10,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 3,
  },
});
