import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

const STEPS = ['Produtos', 'Layout', 'Personalizar', 'Finalizar'];

interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => (
        <React.Fragment key={step}>
          <View style={styles.stepWrapper}>
            <View style={[styles.circle, index <= currentStep && styles.circleActive]}>
              <Text style={[styles.circleText, index <= currentStep && styles.circleTextActive]}>
                {index + 1}
              </Text>
            </View>
            <Text style={[styles.label, index === currentStep && styles.labelActive]}>{step}</Text>
          </View>
          {index < STEPS.length - 1 && (
            <View style={[styles.line, index < currentStep && styles.lineActive]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
  },
  stepWrapper: {
    alignItems: 'center',
    width: 56,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  circleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  circleText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textMuted,
  },
  circleTextActive: {
    color: '#fff',
  },
  label: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  labelActive: {
    color: Colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginTop: 15,
  },
  lineActive: {
    backgroundColor: Colors.primary,
  },
});
