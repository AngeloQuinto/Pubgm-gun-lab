import React, { useState, useEffect, useMemo, useId } from 'react';
import { View, Animated, Easing, Platform, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { colors } from '../theme';

export interface AttachmentGlowBoxProps {
  uri: string;
  /** Outer box size (default 34). */
  size?: number;
  /** Set true to make the icon bob up and down smoothly. */
  floating?: boolean;
  /** Start delay for the floating animation (ms). */
  delay?: number;
  /** Optional custom glass background color. */
  backgroundColor?: string;
  /** Optional border color. */
  borderColor?: string;
}

export const AttachmentGlowBox: React.FC<AttachmentGlowBoxProps> = ({
  uri,
  size = 34,
  floating = false,
  delay = 0,
  backgroundColor = 'rgba(66, 48, 18, 0.92)',
  borderColor = colors.amberBorder,
}) => {
  // Safe unique gradient id per instance compliant with React 19 / React Compiler rules
  const rawId = useId();
  const glowId = useMemo(() => `attGlow-${rawId.replace(/[^a-zA-Z0-9_-]/g, '_')}`, [rawId]);
  const [float] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!floating) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );

    const timer = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(timer);
      loop.stop();
      float.setValue(0);
    };
  }, [float, floating, delay, uri]);

  const range = Math.max(2, size * 0.07);
  const translateY = useMemo(
    () => float.interpolate({ inputRange: [0, 1], outputRange: [-range, range] }),
    [float, range],
  );

  const imgSize = Math.round(size * 0.76);
  const radius = Math.round(size * 0.2);

  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor,
          borderColor,
        },
      ]}
    >
      <View
        style={[styles.glowClip, { borderRadius: Math.max(radius - 1, 0) }]}
        pointerEvents="none"
      >
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id={glowId} cx="50%" cy="50%" rx="75%" ry="75%" fx="50%" fy="50%">
              <Stop offset="0%" stopColor="#F59E0B" stopOpacity="0.55" />
              <Stop offset="60%" stopColor="#F59E0B" stopOpacity="0.18" />
              <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${glowId})`} />
        </Svg>
      </View>

      <Animated.Image
        source={{ uri }}
        style={[
          { width: imgSize, height: imgSize },
          floating && { transform: [{ translateY }] },
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    flexShrink: 0,
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    position: 'relative',
  },
  glowClip: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
});

export default AttachmentGlowBox;
