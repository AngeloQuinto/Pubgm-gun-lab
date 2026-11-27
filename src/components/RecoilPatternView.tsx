import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  AccessibilityInfo,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Line,
  Defs,
  RadialGradient,
  Stop,
  Image as SvgImage,
} from 'react-native-svg';
import { Play, Pause, RotateCcw } from 'lucide-react-native';
import { RecoilAnalysis } from '../utils/recoilEngine';
import { colors } from '../theme';

const SHOOTING_TARGET_IMAGE = require('../../assets/shooting_target.png');

interface Props {
  analysis: RecoilAnalysis;
  weaponName: string;
}

type Status = 'playing' | 'paused' | 'done';
type Pt = { x: number; y: number };

/* ------------------------------------------------------------------ */
/* Tuning constants                                                    */
/* ------------------------------------------------------------------ */
const POP_MS = 220; // bullet-hole pop-in duration
const RIPPLE_MS = 420; // impact ripple lifetime
const TAIL_MS = RIPPLE_MS + 40; // extra time after last shot so ripples finish
const BRIGHT_TAIL_POINTS = 7; // how many recent points stay "hot" in the trail
const SPEEDS = [1, 0.5, 0.25];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/**
 * Checks if a bullet coordinate falls within the head hitbox
 * (Head Zone A & Head Zone B critical headshot kill zone).
 * Torso/chest hits remain standard amber.
 */
function isLethalHitbox(x: number, y: number): boolean {
  // Target placement in SVG:
  // x: 76, y: 20, width: 148, height: 243
  // Center is at X = 150

  // Head Zone A & Zone B only (Critical Headshot Kill Zone)
  // Image coords: X=61..128, Y=5..66 -> SVG coords: X=123.5..175.7, Y=23.9..71.4
  return x >= 123 && x <= 177 && y >= 24 && y <= 72;
}

/** Catmull-Rom -> cubic Bezier so the spray trail curves instead of zig-zagging. */
function smoothPath(pts: Pt[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  const f = (n: number) => Math.round(n * 100) / 100;
  let d = `M ${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return d;
}

/* ------------------------------------------------------------------ */
/* Static backdrop: memoised so it never re-renders during the 60fps   */
/* animation loop (big perf win vs. re-rendering everything per shot)  */
/* ------------------------------------------------------------------ */
const Backdrop = React.memo(() => (
  <>
    <Defs>
      <RadialGradient id="targetGlow" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
        <Stop offset="100%" stopColor="#1E293B" stopOpacity="0" />
      </RadialGradient>
    </Defs>

    <Circle cx="150" cy="135" r="115" stroke="#334155" strokeWidth="1" strokeDasharray="4,4" fill="url(#targetGlow)" />
    <Circle cx="150" cy="135" r="75" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" fill="none" />
    <Circle cx="150" cy="135" r="35" stroke="#475569" strokeWidth="1" fill="none" />
    <Line x1="150" y1="10" x2="150" y2="260" stroke="#334155" strokeWidth="1" />
    <Line x1="15" y1="135" x2="285" y2="135" stroke="#334155" strokeWidth="1" />

    <SvgImage
      href={SHOOTING_TARGET_IMAGE}
      x="76"
      y="20"
      width="148"
      height="243"
      opacity="0.5"
      preserveAspectRatio="xMidYMid meet"
    />

    {/* Start point marker */}
    <Circle cx="150" cy="250" r="7" stroke="#10B981" strokeWidth="2" fill="none" />
  </>
));

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export const RecoilPatternView: React.FC<Props> = ({ analysis, weaponName }) => {
  const { recoilPath, stabilityScore, overallRating, recoilReductionPercent } = analysis;
  const shotCount = recoilPath.length;

  const intervalMs = useMemo(
    () => Math.max(35, Math.min(100, Math.round(1000 / (analysis.effectiveFireRateRps || 13)))),
    [analysis.effectiveFireRateRps],
  );
  const totalMs = Math.max(0, shotCount - 1) * intervalMs + TAIL_MS;

  const [elapsed, setElapsed] = useState<number>(totalMs);
  const [status, setStatus] = useState<Status>('done');
  const [speedIdx, setSpeedIdx] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const elapsedRef = useRef<number>(0);
  const speedRef = useRef<number>(1);
  const totalRef = useRef<number>(totalMs);
  totalRef.current = totalMs;
  speedRef.current = SPEEDS[speedIdx];

  /* ---------------- Reduce-motion support ---------------- */
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => { });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub?.remove?.();
  }, []);

  /* ---------------- rAF loop (time-based, frame-rate independent) ---------------- */
  const stopLoop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTsRef.current = null;
  }, []);

  const tick = useCallback(
    (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      // Clamp dt so a dropped frame / app-background doesn't skip the spray
      const dt = Math.min(ts - lastTsRef.current, 50);
      lastTsRef.current = ts;

      elapsedRef.current = Math.min(totalRef.current, elapsedRef.current + dt * speedRef.current);
      setElapsed(elapsedRef.current);

      if (elapsedRef.current >= totalRef.current) {
        stopLoop();
        setStatus('done');
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    },
    [stopLoop],
  );

  const play = useCallback(() => {
    stopLoop();
    setStatus('playing');
    rafRef.current = requestAnimationFrame(tick);
  }, [stopLoop, tick]);

  const restart = useCallback(() => {
    stopLoop();
    if (reduceMotion) {
      elapsedRef.current = totalRef.current;
      setElapsed(totalRef.current);
      setStatus('done');
      return;
    }
    elapsedRef.current = 0;
    setElapsed(0);
    play();
  }, [play, reduceMotion, stopLoop]);

  const togglePlayPause = () => {
    if (status === 'playing') {
      stopLoop();
      setStatus('paused');
    } else if (status === 'paused') {
      play();
    } else {
      restart();
    }
  };

  // Auto-play whenever weapon / attachments change
  useEffect(() => {
    restart();
    return stopLoop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recoilPath, intervalMs]);

  /* ---------------- Pulsing FIRING dot ---------------- */
  const pulse = useRef(new Animated.Value(1)).current;
  const isPlaying = status === 'playing';
  useEffect(() => {
    if (!isPlaying) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.25, duration: 350, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 350, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isPlaying, pulse]);

  /* ---------------- Derived animation frame ---------------- */
  const progress = Math.min(shotCount - 1, elapsed / intervalMs); // float shot index
  const idx = Math.max(0, Math.floor(progress));
  const frac = progress - idx;
  const shotsRevealed = Math.min(shotCount, idx + 1);

  // Smoothly interpolated aim point (the "reticle") between shot idx and idx+1
  const lead: Pt | null = useMemo(() => {
    if (shotCount === 0) return null;
    const a = recoilPath[idx];
    const b = recoilPath[Math.min(idx + 1, shotCount - 1)];
    return { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac };
  }, [recoilPath, idx, frac, shotCount]);

  const trailPoints: Pt[] = useMemo(() => {
    const pts: Pt[] = recoilPath.slice(0, shotsRevealed).map((p) => ({ x: p.x, y: p.y }));
    if (lead && frac > 0 && idx < shotCount - 1) pts.push(lead);
    return pts;
  }, [recoilPath, shotsRevealed, lead, frac, idx, shotCount]);

  const ghostPathD = useMemo(() => smoothPath(trailPoints), [trailPoints]);
  const hotPathD = useMemo(
    () => smoothPath(trailPoints.slice(-BRIGHT_TAIL_POINTS)),
    [trailPoints],
  );

  const headshotsSoFar = useMemo(
    () => recoilPath.slice(1, shotsRevealed).filter((p) => isLethalHitbox(p.x, p.y)).length,
    [recoilPath, shotsRevealed],
  );

  const leadIsLethal = lead ? isLethalHitbox(lead.x, lead.y) : false;
  const reticleColor = leadIsLethal ? '#EF4444' : '#38BDF8';

  const getScoreColor = (score: number) => {
    if (score >= 78) return colors.success;
    if (score >= 58) return colors.amber;
    return colors.danger;
  };
  const statusColor = getScoreColor(stabilityScore);
  const progressPct = shotCount > 1 ? (shotsRevealed / shotCount) * 100 : 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{shotCount}-SHOT RECOIL PLOT</Text>
            {isPlaying && (
              <View style={styles.firingBadge}>
                <Animated.View style={[styles.firingDot, { opacity: pulse }]} />
                <Text style={styles.firingText}>FIRING</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>{weaponName} · Full Auto Spray Simulation</Text>
        </View>

        <View style={[styles.badge, { borderColor: statusColor, backgroundColor: statusColor + '18' }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>{overallRating}</Text>
        </View>
      </View>

      {/* Canvas */}
      <View style={styles.canvasWrapper}>
        <Svg height="270" width="300" viewBox="0 0 300 270">
          <Backdrop />

          {/* Ghost trail: full path so far, soft */}
          <Path
            d={ghostPathD}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeOpacity="0.28"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hot trail: glow + core on the most recent points */}
          <Path
            d={hotPathD}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="7"
            strokeOpacity="0.16"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d={hotPathD}
            fill="none"
            stroke="#FCD34D"
            strokeWidth="2.5"
            strokeOpacity="0.95"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Impact ripples (expanding + fading rings per shot) */}
          {recoilPath.slice(0, shotsRevealed).map((pt, i) => {
            const age = elapsed - i * intervalMs;
            if (age < 0 || age > RIPPLE_MS) return null;
            const t = easeOutCubic(clamp01(age / RIPPLE_MS));
            const lethal = i > 0 && isLethalHitbox(pt.x, pt.y);
            return (
              <Circle
                key={`rip-${i}`}
                cx={pt.x}
                cy={pt.y}
                r={4 + t * (lethal ? 18 : 13)}
                stroke={i === 0 ? '#10B981' : lethal ? '#EF4444' : '#FBBF24'}
                strokeWidth={lethal ? 2 : 1.5}
                fill="none"
                opacity={(1 - t) * 0.85}
              />
            );
          })}

          {/* Bullet holes with overshoot "pop" */}
          {recoilPath.slice(0, shotsRevealed).map((pt, i) => {
            const age = elapsed - i * intervalMs;
            const pop = easeOutBack(clamp01(age / POP_MS));
            const isFirst = i === 0;
            const lethal = !isFirst && isLethalHitbox(pt.x, pt.y);
            const baseR = isFirst ? 5 : lethal ? 4.5 : 3.5;
            const fill = isFirst ? '#10B981' : lethal ? '#EF4444' : '#FBBF24';
            return (
              <Circle
                key={`hit-${i}`}
                cx={pt.x}
                cy={pt.y}
                r={Math.max(0.01, baseR * pop)}
                fill={fill}
                stroke="#0F172A"
                strokeWidth={lethal ? 1.5 : 1}
              />
            );
          })}

          {/* Aim reticle that glides along the spray (turns red over the head) */}
          {status !== 'done' && lead && (
            <>
              <Circle cx={lead.x} cy={lead.y} r={10} stroke={reticleColor} strokeWidth="1.5" fill="none" opacity="0.9" />
              <Circle cx={lead.x} cy={lead.y} r={1.8} fill={reticleColor} />
              <Line x1={lead.x - 16} y1={lead.y} x2={lead.x - 6} y2={lead.y} stroke={reticleColor} strokeWidth="1.5" strokeLinecap="round" />
              <Line x1={lead.x + 6} y1={lead.y} x2={lead.x + 16} y2={lead.y} stroke={reticleColor} strokeWidth="1.5" strokeLinecap="round" />
              <Line x1={lead.x} y1={lead.y - 16} x2={lead.x} y2={lead.y - 6} stroke={reticleColor} strokeWidth="1.5" strokeLinecap="round" />
              <Line x1={lead.x} y1={lead.y + 6} x2={lead.x} y2={lead.y + 16} stroke={reticleColor} strokeWidth="1.5" strokeLinecap="round" />
            </>
          )}
        </Svg>

        <View style={styles.legendOverlay} pointerEvents="none">
          <Text style={styles.legendText}>• Start (Crosshair Origin)</Text>
          <Text style={[styles.legendText, { color: '#EF4444' }]}>• Headshot Hits (Head A & B)</Text>
          <Text style={[styles.legendText, { color: '#FBBF24' }]}>• Torso & Spread Hits</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>

      {/* Playback controls */}
      <View style={styles.controlsRow}>
        <View style={styles.controlsLeft}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={togglePlayPause}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause spray' : status === 'paused' ? 'Resume spray' : 'Replay spray'}
          >
            {isPlaying ? (
              <Pause size={14} color="#38BDF8" />
            ) : status === 'paused' ? (
              <Play size={14} color="#38BDF8" />
            ) : (
              <RotateCcw size={14} color="#38BDF8" />
            )}
            <Text style={styles.controlText}>
              {isPlaying ? 'Pause' : status === 'paused' ? 'Resume' : 'Replay'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.speedChip}
            onPress={() => setSpeedIdx((i) => (i + 1) % SPEEDS.length)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Playback speed ${SPEEDS[speedIdx]}x`}
          >
            <Text style={styles.speedText}>{SPEEDS[speedIdx]}×</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controlsRight}>
          <Text style={styles.counterText}>
            Shot <Text style={styles.counterStrong}>{shotsRevealed}</Text>/{shotCount}
          </Text>
          <Text style={styles.counterText}>
            Head <Text style={[styles.counterStrong, { color: '#EF4444' }]}>{headshotsSoFar}</Text>
          </Text>
        </View>
      </View>

      {/* Metrics */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>STABILITY INDEX</Text>
          <Text style={[styles.metricValue, { color: statusColor }]}>{stabilityScore}%</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>VERT COMP</Text>
          <Text style={styles.metricValue}>{analysis.effectiveVerticalRecoil}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>HORIZ SHAKE</Text>
          <Text style={styles.metricValue}>{analysis.effectiveHorizontalRecoil}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>KICK REDUCED</Text>
          <Text style={[styles.metricValue, { color: '#10B981' }]}>-{recoilReductionPercent}%</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  firingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: colors.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  firingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.danger },
  firingText: { color: colors.danger, fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  title: { color: colors.text, fontSize: 14, fontWeight: '800', letterSpacing: 1.2 },
  subtitle: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  canvasWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  legendOverlay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingTop: 6,
  },
  legendText: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  progressTrack: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: { height: 3, backgroundColor: colors.cyan, borderRadius: 2 },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  controlsLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  controlsRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cyanTint,
    borderColor: colors.cyan,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
  },
  controlText: { color: colors.cyan, fontSize: 10, fontWeight: '700' },
  speedChip: {
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
  },
  speedText: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  counterText: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  counterStrong: { color: colors.text, fontWeight: '800' },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '700', marginBottom: 2 },
  metricValue: { color: colors.text, fontSize: 15, fontWeight: '900' },
});