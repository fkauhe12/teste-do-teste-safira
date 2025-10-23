import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default function StepIndicator({ steps, currentStep, style }) {
  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: steps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index <= currentStep && styles.activeDot,
            index === currentStep && styles.currentDot,
          ]}
        />
      ))}
    </View>
  );
}

// Versão animada do StepIndicator
export function AnimatedStepIndicator({ steps, progress, style }) {
  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: steps }).map((_, index) => {
        const stepProgress = Animated.subtract(progress, index);
        const opacity = stepProgress.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [0.4, 0.7, 1],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              styles.activeDot,
              { opacity },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  activeDot: {
    backgroundColor: '#4873FF',
  },
  currentDot: {
    transform: [{ scale: 1.2 }],
  },
});