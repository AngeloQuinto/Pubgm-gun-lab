import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
  Animated,
  Easing,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Line } from 'react-native-svg';
import { Weapon, AttachmentSlot, ATTACHMENTS, Attachment } from '../data/weapons';
import { RecoilAnalysis } from '../utils/recoilEngine';
import { colors } from '../theme';

// MaskedView only works on native — load conditionally
const MaskedViewNative = Platform.OS !== 'web'
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ? (require('@react-native-masked-view/masked-view').default as React.ComponentType<{
    style?: StyleProp<ViewStyle>;
    maskElement: React.ReactElement;
    children?: React.ReactNode;
  }>)
  : null;

interface Props {
  weapon: Weapon;
  selectedAttachments: Partial<Record<AttachmentSlot, string>>;
  recoilAnalysis: RecoilAnalysis;
  attachmentsMap?: Record<string, Attachment>;
  onSelectSlotToEdit?: (slot: AttachmentSlot) => void;
}

interface FloatingAttachmentProps {
  uri: string;
  delay?: number;
}

const FloatingAttachment: React.FC<FloatingAttachmentProps> = ({ uri, delay = 0 }) => {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, [float, delay, uri]);

  const translateY = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      float.interpolate({
        inputRange: [0, 1],
        outputRange: [-2.5, 2.5],
      }),
    [float],
  );

  return (
    <Animated.Image
      source={{ uri }}
      style={[styles.slotAttachmentImg, { transform: [{ translateY }] }]}
      resizeMode="contain"
    />
  );
};

export const WeaponVisualDisplay: React.FC<Props> = ({
  weapon,
  selectedAttachments,
  recoilAnalysis,
  attachmentsMap = ATTACHMENTS,
  onSelectSlotToEdit,
}) => {
  const gunImageUri = weapon.showcaseImage || weapon.image;
  const [isHovered, setIsHovered] = useState(false);
  const [loadedUri, setLoadedUri] = useState<string | null>(null);
  const [maskReadyUri, setMaskReadyUri] = useState<string | null>(null);
  const sweepAnim = useRef(new Animated.Value(0)).current;

  // Trigger smooth diagonal light beam sweep animation
  const triggerLightSweep = useCallback(() => {
    sweepAnim.setValue(0);
    Animated.timing(sweepAnim, {
      toValue: 1,
      duration: 1090,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [sweepAnim]);

  // Re-trigger sweep when weapon changes
  useEffect(() => {
    triggerLightSweep();
  }, [weapon.id, triggerLightSweep]);

  // Memoize interpolated animation values — Animated.Value.interpolate() is safe
  // to call during render (standard RN pattern); suppress false-positive lint rule.
  const translateX = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      sweepAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-180, 280],
      }),
    [sweepAnim],
  );

  const translateY = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      sweepAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [140, -140],
      }),
    [sweepAnim],
  );

  const getStabilityColor = (score: number) => {
    if (score >= 78) return colors.success;
    if (score >= 58) return colors.amber;
    return colors.danger;
  };

  const stabilityColor = getStabilityColor(recoilAnalysis.stabilityScore);

  // Active magazine capacity calculation
  const equippedMag = selectedAttachments.magazine
    ? attachmentsMap[selectedAttachments.magazine]
    : null;
  const totalCapacity =
    weapon.stats.magCapacity + (equippedMag?.modifiers.capacityBonus || 0);

  return (
    <View style={styles.cardContainer}>
      {/* Background Laser Grid Accent */}
      <View style={styles.gridOverlay}>
        <View style={styles.gridLineHorizontal} />
        <View style={styles.gridLineVertical} />
      </View>

      {/* Top Banner Tag */}
      <View style={styles.topRow}>
        <View style={styles.badgeCluster}>
          <View style={styles.tierPill}>
            <Text style={styles.tierPillText}>TIER {weapon.tier}</Text>
          </View>
          <View style={styles.ammoPill}>
            <Text style={styles.ammoPillText}>{weapon.ammo}</Text>
          </View>
        </View>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{weapon.category} CLASS</Text>
        </View>
      </View>

      {/* Gun Image Showcase with Diagonal Light Hover / Sweep Effect */}
      <Pressable
        style={[
          styles.imageShowcase,
          isHovered && styles.imageShowcaseHovered,
        ]}
        onPress={() => triggerLightSweep()}
        // Web & touch hover support
        {...(Platform.OS === 'web'
          ? {
            onMouseEnter: () => {
              setIsHovered(true);
              triggerLightSweep();
            },
            onMouseLeave: () => setIsHovered(false),
          }
          : {
            onPressIn: () => setIsHovered(true),
            onPressOut: () => setIsHovered(false),
          })}
      >
        {/* Background Subtle Angular Crosshatch */}
        <Svg style={styles.showcaseSvgLayer} pointerEvents="none">
          <Defs>
            <LinearGradient id="diagonalBeam" x1="0" y1="1" x2="1" y2="0">
              <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
              <Stop offset="45%" stopColor="#38BDF8" stopOpacity="0.08" />
              <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <Stop offset="55%" stopColor="#38BDF8" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* Ambient diagonal accent lines from bottom-left to top-right */}
          <Line x1="0" y1="140" x2="280" y2="0" stroke="rgba(56, 189, 248, 0.12)" strokeWidth="1" strokeDasharray="6,6" />
          <Line x1="40" y1="140" x2="320" y2="0" stroke="rgba(245, 158, 11, 0.10)" strokeWidth="1" strokeDasharray="4,4" />
        </Svg>

        {/* Gun Image Showcase (Uses C_h High-Res Showcase Image) — Base Layer */}
        <Image
          key={gunImageUri}
          source={{ uri: gunImageUri }}
          style={[styles.gunImage, isHovered && styles.gunImageHovered]}
          resizeMode="contain"
          onLoad={() => {
            if (loadedUri !== gunImageUri) {
              setLoadedUri(gunImageUri);
              triggerLightSweep();
            }
          }}
        />

        {/* Diagonal Light Beam — masked to gun silhouette */}
        {loadedUri === gunImageUri && (
          Platform.OS === 'web' ? (
            /* Web: use CSS mask-image on a container with exact same dimensions and position as gunImage */
            <Animated.View
              key={`${weapon.id}-${gunImageUri}`}
              style={[
                styles.gunImage,
                styles.maskedBeamContainerWeb,
                {
                  // @ts-expect-error — web-only CSS properties
                  maskImage: `url(${gunImageUri})`,
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskImage: `url(${gunImageUri})`,
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                },
              ]}
              pointerEvents="none"
            >
              <Animated.View
                style={[
                  styles.diagonalLightBeam,
                  {
                    transform: [
                      { translateX },
                      { translateY },
                      { rotate: '-35deg' },
                    ],
                  },
                ]}
              >
                <Svg height="320" width="100" viewBox="0 0 100 320">
                  <Defs>
                    <LinearGradient id="beamGradientWeb" x1="0%" y1="0%" x2="100%" y2="0%">
                      <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
                      <Stop offset="35%" stopColor="#38BDF8" stopOpacity="0.25" />
                      <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.85" />
                      <Stop offset="65%" stopColor="#38BDF8" stopOpacity="0.25" />
                      <Stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
                    </LinearGradient>
                  </Defs>
                  <Rect x="0" y="0" width="100" height="320" fill="url(#beamGradientWeb)" />
                </Svg>
              </Animated.View>
            </Animated.View>
          ) : MaskedViewNative ? (
            /* Native: key by weapon + maskReadyUri so RNCMaskedView recaptures the exact gun bitmap */
            <MaskedViewNative
              key={`${weapon.id}-${gunImageUri}-${maskReadyUri === gunImageUri ? 'ready' : 'init'}`}
              style={[styles.gunImage, styles.maskedBeamContainerNative]}
              maskElement={
                <Image
                  source={{ uri: gunImageUri }}
                  style={styles.maskGunImage}
                  resizeMode="contain"
                  onLoad={() => {
                    if (maskReadyUri !== gunImageUri) {
                      setMaskReadyUri(gunImageUri);
                    }
                  }}
                />
              }
            >
              {/* Full-size fill so MaskedView has layout, then position beam inside */}
              <View style={styles.maskedBeamFill}>
                <Animated.View
                  style={[
                    styles.diagonalLightBeam,
                    {
                      transform: [
                        { translateX },
                        { translateY },
                        { rotate: '-35deg' },
                      ],
                    },
                  ]}
                  pointerEvents="none"
                >
                  <Svg height="320" width="100" viewBox="0 0 100 320">
                    <Defs>
                      <LinearGradient id="beamGradientNative" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
                        <Stop offset="35%" stopColor="#38BDF8" stopOpacity="0.25" />
                        <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.85" />
                        <Stop offset="65%" stopColor="#38BDF8" stopOpacity="0.25" />
                        <Stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
                      </LinearGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100" height="320" fill="url(#beamGradientNative)" />
                  </Svg>
                </Animated.View>
              </View>
            </MaskedViewNative>
          ) : null
        )}

        {/* Caliber Watermark Background Text */}
        <View style={styles.caliberWatermark} pointerEvents="none">
          <Text style={styles.caliberText}>{weapon.name}</Text>
        </View>

        {/* Interactive Hover / Tap Hint Indicator */}
        <View style={styles.sweepHintBadge}>
          <Text style={styles.sweepHintText}>DIAGONAL BEAM ACTIVE • TAP TO SWEEP</Text>
        </View>
      </Pressable>

      {/* Equipped Attachment Chips Array */}
      <View style={styles.equippedSection}>
        <View style={styles.equippedHeader}>
          <Text style={styles.equippedTitle}>EQUIPPED ATTACHMENT RIG</Text>
          <Text style={styles.quickTip}>Tap slot below to change</Text>
        </View>

        <View style={styles.slotsRow}>
          {weapon.supportedSlots.length === 0 ? (
            <View style={styles.integratedRigNote}>
              <Text style={styles.integratedRigText}>
                Factory integrated optics, suppressor & tactical rig
              </Text>
            </View>
          ) : (
            weapon.supportedSlots.map((slot, index) => {
              const attId = selectedAttachments[slot];
              const att = attId ? attachmentsMap[attId] : null;

              return (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.slotBadge,
                    att ? styles.slotBadgeEquipped : styles.slotBadgeEmpty,
                  ]}
                  onPress={() => onSelectSlotToEdit?.(slot)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.slotIndicator,
                      { backgroundColor: att ? colors.amber : colors.border },
                    ]}
                  />
                  {att ? (
                    <View style={styles.slotEquippedContent}>
                      <View style={styles.slotImgBox}>
                        <View style={styles.slotGlowClip} pointerEvents="none">
                          <Svg width="100%" height="100%">
                            <Defs>
                              <RadialGradient id="attachmentGlow" cx="50%" cy="50%" rx="75%" ry="75%" fx="50%" fy="50%">
                                <Stop offset="0%" stopColor="#F59E0B" stopOpacity="0.55" />
                                <Stop offset="60%" stopColor="#F59E0B" stopOpacity="0.18" />
                                <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                              </RadialGradient>
                            </Defs>
                            <Rect x="0" y="0" width="100%" height="100%" fill="url(#attachmentGlow)" />
                          </Svg>
                        </View>
                        <FloatingAttachment uri={att.image} delay={index * 250} />
                      </View>

                      <View style={styles.slotTextGroup}>
                        <Text style={[styles.slotValue, { color: colors.text }]} numberOfLines={1}>
                          {att.name.split(' (')[0]}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.slotTextGroup}>
                      <Text style={styles.slotLabel}>{slot.toUpperCase()}</Text>
                      <Text style={styles.slotValue} numberOfLines={1}>
                        Empty
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </View>

      {/* Real-time Dynamic Analysis Directly Under Gun */}
      <View style={styles.liveAnalysisBanner}>
        <View style={styles.analysisHeader}>
          <View style={styles.liveIndicatorRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.analysisTitle}>LIVE RECOIL & BALLISTICS ANALYSIS</Text>
          </View>
          <View style={[styles.ratingPill, { borderColor: stabilityColor, backgroundColor: stabilityColor + '18' }]}>
            <Text style={[styles.ratingPillText, { color: stabilityColor }]}>
              {recoilAnalysis.overallRating}
            </Text>
          </View>
        </View>

        {/* Realtime stats grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>STABILITY</Text>
            <Text style={[styles.metricNumber, { color: stabilityColor }]}>
              {recoilAnalysis.stabilityScore}%
            </Text>
            <Text style={styles.metricSub}>
              {recoilAnalysis.stabilityScore > 75 ? 'Laser Focus' : 'Moderate Kick'}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>VERT CLIMB</Text>
            <Text style={styles.metricNumber}>{recoilAnalysis.effectiveVerticalRecoil}</Text>
            <Text style={styles.metricSub}>
              Base: {weapon.stats.verticalRecoilBase}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>HORIZ SHAKE</Text>
            <Text style={styles.metricNumber}>{recoilAnalysis.effectiveHorizontalRecoil}</Text>
            <Text style={styles.metricSub}>
              Base: {weapon.stats.horizontalRecoilBase}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>KICK REDUCTION</Text>
            <Text style={[styles.metricNumber, { color: '#10B981' }]}>
              -{recoilAnalysis.recoilReductionPercent}%
            </Text>
            <Text style={styles.metricSub}>Att. Buff</Text>
          </View>
        </View>

        {/* Ballistic Specs Bar (Mag, Damage, Fire Rate, ADS Speed) */}
        <View style={styles.quickSpecsRow}>
          <Text style={styles.specItemText}>
            DMG: <Text style={styles.specHighlight}>{recoilAnalysis.effectiveDamage}</Text>
          </Text>
          <Text style={styles.specDivider}>•</Text>
          <Text style={styles.specItemText}>
            FIRE: <Text style={styles.specHighlight}>{recoilAnalysis.effectiveFireRateRps} rps</Text>
          </Text>
          <Text style={styles.specDivider}>•</Text>
          <Text style={styles.specItemText}>
            ADS: <Text style={styles.specHighlight}>{recoilAnalysis.effectiveAdsTimeMs}ms</Text>
          </Text>
          <Text style={styles.specDivider}>•</Text>
          <Text style={styles.specItemText}>
            MAG: <Text style={styles.specHighlight}>{totalCapacity}r</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
  },
  gridLineHorizontal: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.cyan,
  },
  gridLineVertical: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.cyan,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  badgeCluster: {
    flexDirection: 'row',
    gap: 6,
  },
  tierPill: {
    backgroundColor: colors.amberTint,
    borderColor: colors.amberBorder,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tierPillText: {
    color: colors.amber,
    fontSize: 10,
    fontWeight: '900',
  },
  ammoPill: {
    backgroundColor: colors.bg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ammoPillText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  categoryBadge: {
    backgroundColor: colors.cyanTint,
    borderColor: colors.cyan,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryBadgeText: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  imageShowcase: {
    height: 155,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  showcaseSvgLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  imageShowcaseHovered: {
    borderColor: colors.cyan,
    shadowColor: colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  maskedBeamContainerWeb: {
    position: 'absolute',
    zIndex: 3,
    overflow: 'hidden',
    pointerEvents: 'none',
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskedBeamContainerNative: {
    position: 'absolute',
    zIndex: 3,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  maskedBeamFill: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskGunImage: {
    width: '100%',
    height: '100%',
  },
  diagonalLightBeam: {
    position: 'absolute',
    width: 100,
    height: 320,
    pointerEvents: 'none',
  },
  gunImage: {
    width: '94%',
    height: 115,
    zIndex: 2,
    transform: [{ scale: 1.04 }],
  },
  gunImageHovered: {
    transform: [{ scale: 1.04 }],
  },
  caliberWatermark: {
    position: 'absolute',
    zIndex: 1,
  },
  caliberText: {
    color: 'rgba(255, 255, 255, 0.04)',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 4,
  },
  sweepHintBadge: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.cyanTint,
    zIndex: 4,
  },
  sweepHintText: {
    color: colors.cyan,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  equippedSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    zIndex: 2,
  },
  equippedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  equippedTitle: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    flexShrink: 1,
  },
  quickTip: {
    color: colors.textMuted,
    fontSize: 10,
    fontStyle: 'italic',
    flexShrink: 0,
  },
  slotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 120,
    gap: 6,
  },
  slotBadgeEquipped: {
    borderColor: colors.amberBorder,
    backgroundColor: colors.bg,
  },
  slotBadgeEmpty: {
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  slotIndicator: {
    width: 4,
    height: 28,
    borderRadius: 2,
  },
  slotEquippedContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  slotImgBox: {
    width: 34,
    height: 34,
    borderRadius: 7,
    backgroundColor: 'rgba(66, 48, 18, 0.92)', // same as selected weapon card
    borderWidth: 1,
    borderColor: colors.amberBorder,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    flexShrink: 0,
    // soft outer glow
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  slotGlowClip: {
    ...StyleSheet.absoluteFill,
    borderRadius: 6,
    overflow: 'hidden',
  },
  slotAttachmentImg: {
    width: 26,
    height: 26,
  },
  integratedRigNote: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  integratedRigText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  slotTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  slotLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: '800',
  },
  slotValue: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  liveAnalysisBanner: {
    marginTop: 14,
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 2,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  liveIndicatorRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    flexShrink: 0,
  },
  analysisTitle: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    flexShrink: 1,
  },
  ratingPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
    borderWidth: 1,
    flexShrink: 0,
  },
  ratingPillText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  metricItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricNumber: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  metricSub: {
    color: colors.textMuted,
    fontSize: 8,
    marginTop: 2,
  },
  quickSpecsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  specItemText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  specHighlight: {
    color: colors.text,
    fontWeight: '800',
  },
  specDivider: {
    color: colors.border,
    fontSize: 10,
  },
});
