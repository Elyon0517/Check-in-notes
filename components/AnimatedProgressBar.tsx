import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

type Props = {
  percent: number;
  color: string;
  trackColor: string;
  height?: number;
};

export function AnimatedProgressBar({ percent, color, trackColor, height = 6 }: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: Math.max(0, Math.min(1, percent)),
      duration: 420,
      useNativeDriver: false,
    }).start();
  }, [percent, progress]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.track, { backgroundColor: trackColor, height, borderRadius: height / 2 }]}>
      <Animated.View style={[styles.fill, { backgroundColor: color, width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
