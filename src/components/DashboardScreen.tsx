import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { TrendingUp, Zap, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { WEAPONS_DATA, Weapon, WeaponNerfBuffAdjustment } from '../data/weapons';
import { calculateRecoilSimulation } from '../utils/recoilEngine';
import { colors } from '../theme';

interface Props {
  onBackToArmory: () => void;
  onSelectWeapon: (weapon: Weapon) => void;
  clickCounts: Record<string, number>;
  nerfBuffMap: Record<string, WeaponNerfBuffAdjustment>;
  onUpdateNerfBuff: (weaponId: string, adjustment: WeaponNerfBuffAdjustment) => void;
  onResetNerfBuff: (weaponId: string) => void;
}

export const DashboardScreen: React.FC<Props> = ({
  onBackToArmory,
  onSelectWeapon,
  clickCounts,
  nerfBuffMap,
  onUpdateNerfBuff,
  onResetNerfBuff,
}) => {
  const [activeSection, setActiveSection] = useState<'ANALYTICS' | 'NERF_BUFF'>('ANALYTICS');
  const [selectedTuningWeaponId, setSelectedTuningWeaponId] = useState<string>('m416');

  // Most-Clicked Weapons Analytics (Ranked by user interactions)
  const totalClicksAcrossGuns = Object.values(clickCounts).reduce((acc, curr) => acc + curr, 0);

  const mostClickedGuns = WEAPONS_DATA.map((wp) => {
    const clicks = clickCounts[wp.id] || 0;
    const sharePercent = totalClicksAcrossGuns > 0 ? Math.round((clicks / totalClicksAcrossGuns) * 100) : 0;
    return {
      weapon: wp,
      clicks,
      sharePercent,
    };
  }).sort((a, b) => b.clicks - a.clicks);

  // Weapon currently selected for Nerf/Buff adjustment
  const tuningWeapon = WEAPONS_DATA.find((w) => w.id === selectedTuningWeaponId) || WEAPONS_DATA[0];
  const currentAdjustment: WeaponNerfBuffAdjustment = nerfBuffMap[tuningWeapon.id] || {
    damageDelta: 0,
    fireRatePercent: 0,
    recoilPercent: 0,
    adsSpeedPercent: 0,
  };

  // Live simulation of the tuned gun with Nerf/Buff applied
  const defaultAttachments = tuningWeapon.recommendedLoadouts[0]?.attachments || {};
  const tunedAnalysis = calculateRecoilSimulation(tuningWeapon, defaultAttachments, currentAdjustment);
  const baseAnalysis = calculateRecoilSimulation(tuningWeapon, defaultAttachments);

  const handleAdjustValue = (
    statKey: keyof WeaponNerfBuffAdjustment,
    delta: number
  ) => {
    const updated = {
      ...currentAdjustment,
      [statKey]: currentAdjustment[statKey] + delta,
    };
    onUpdateNerfBuff(tuningWeapon.id, updated);
  };

  const isBuffedOrNerfed =
    currentAdjustment.damageDelta !== 0 ||
    currentAdjustment.fireRatePercent !== 0 ||
    currentAdjustment.recoilPercent !== 0 ||
    currentAdjustment.adsSpeedPercent !== 0;

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
          <Text style={styles.badge} numberOfLines={1}>COMMAND & TELEMETRY</Text>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">GUNLAB DASHBOARD</Text>
        </View>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBackToArmory}
          activeOpacity={0.8}
        >
          <ChevronLeft size={14} color="#38BDF8" strokeWidth={2.5} />
          <Text style={styles.backButtonText}>Back to Armory</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Switcher: Analytics vs Nerf/Buff Lab */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[styles.switchTab, activeSection === 'ANALYTICS' && styles.switchTabActive]}
          onPress={() => setActiveSection('ANALYTICS')}
        >
          <TrendingUp
            size={14}
            color={activeSection === 'ANALYTICS' ? '#F59E0B' : '#64748B'}
            strokeWidth={2.2}
          />
          <Text style={[styles.switchTabText, activeSection === 'ANALYTICS' && styles.switchTabTextActive]}>
            POPULARITY & CLICKS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.switchTab, activeSection === 'NERF_BUFF' && styles.switchTabActive]}
          onPress={() => setActiveSection('NERF_BUFF')}
        >
          <Zap
            size={14}
            color={activeSection === 'NERF_BUFF' ? '#F59E0B' : '#64748B'}
            strokeWidth={2.2}
          />
          <Text style={[styles.switchTabText, activeSection === 'NERF_BUFF' && styles.switchTabTextActive]}>
            NERF / BUFF WORKSHOP
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ================= SECTION 1: MOST CLICKED GUNS ANALYTICS ================= */}
        {activeSection === 'ANALYTICS' && (
          <View>
            {/* Quick Stat Highlights */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>TOTAL USER INTERACTIONS</Text>
                <Text style={styles.summaryNumber}>{totalClicksAcrossGuns}</Text>
                <Text style={styles.summarySub}>Logged Armory Views</Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>MOST POPULAR GUN</Text>
                <Text style={[styles.summaryNumber, { color: '#F59E0B' }]}>
                  {mostClickedGuns[0]?.weapon.name || 'M416'}
                </Text>
                <Text style={styles.summarySub}>
                  {mostClickedGuns[0]?.sharePercent || 0}% of all clicks
                </Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>CUSTOM BALANCED</Text>
                <Text style={[styles.summaryNumber, { color: '#10B981' }]}>
                  {Object.keys(nerfBuffMap).length}
                </Text>
                <Text style={styles.summarySub}>Guns Nerfed / Buffed</Text>
              </View>
            </View>

            {/* Most Clicked Guns Leaderboard Table */}
            <View style={styles.panelBox}>
              <View style={styles.panelHeaderRow}>
                <Text style={styles.panelHeading}>MOST VIEWED & CLICKED GUNS</Text>
                <Text style={styles.panelSubHeading}>Realtime Engagement</Text>
              </View>

              {mostClickedGuns.map((item, index) => {
                const isWinner = index === 0 && item.clicks > 0;
                return (
                  <TouchableOpacity
                    key={item.weapon.id}
                    style={[styles.analyticsRow, isWinner && styles.analyticsRowWinner]}
                    onPress={() => {
                      onSelectWeapon(item.weapon);
                      onBackToArmory();
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.rankNumBadge}>
                      <Text style={[styles.rankNum, isWinner && { color: '#F59E0B' }]}>#{index + 1}</Text>
                    </View>

                    <Image
                      source={{ uri: item.weapon.image }}
                      style={styles.gunThumbImg}
                      resizeMode="contain"
                    />

                    <View style={styles.analyticsGunDetails}>
                      <View style={styles.gunTitleRow}>
                        <Text style={styles.analyticsGunName}>{item.weapon.name}</Text>
                        <View style={styles.analyticsTierTag}>
                          <Text style={styles.analyticsTierText}>TIER {item.weapon.tier}</Text>
                        </View>
                        {nerfBuffMap[item.weapon.id] && (
                          <View style={styles.customModPill}>
                            <Text style={styles.customModPillText}>MODIFIED</Text>
                          </View>
                        )}
                      </View>

                      {/* Progress Bar for Click Percentage */}
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${Math.max(6, item.sharePercent)}%` },
                            isWinner && { backgroundColor: '#F59E0B' },
                          ]}
                        />
                      </View>
                    </View>

                    <View style={styles.analyticsClickCol}>
                      <Text style={styles.clickCountValue}>{item.clicks}</Text>
                      <Text style={styles.clickPercentText}>{item.sharePercent}%</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Metagame Intelligence Insight */}
            <View style={styles.metaIntelBox}>
              <Text style={styles.intelTitle}>TACTICAL ANALYTICS INSIGHT</Text>
              <Text style={styles.intelText}>
                Players prioritize low-recoil 5.56mm rifles for general BR matches, while CQC specialists consistently switch to the UMP45 and Beryl M762 in close-range zones.
              </Text>
            </View>
          </View>
        )}

        {/* ================= SECTION 2: NERF OR BUFF WORKSHOP ================= */}
        {activeSection === 'NERF_BUFF' && (
          <View>
            <View style={styles.workshopIntroCard}>
              <Text style={styles.workshopIntroTag}>DEVELOPER WEAPON LAB</Text>
              <Text style={styles.workshopIntroHeading}>Weapon Balancing Workshop</Text>
              <Text style={styles.workshopIntroDesc}>
                Customize and test game balance patch adjustments. Nerf or buff damage, fire rate, recoil, and ADS speed to simulate weapon rebalancing.
              </Text>
            </View>

            {/* Weapon Selector for Nerf / Buff */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tuningGunScroll}>
              {WEAPONS_DATA.map((wp) => {
                const isSelected = wp.id === selectedTuningWeaponId;
                const hasAdj = !!nerfBuffMap[wp.id];
                return (
                  <TouchableOpacity
                    key={wp.id}
                    style={[
                      styles.tuningGunChip,
                      isSelected && styles.tuningGunChipSelected,
                      hasAdj && !isSelected && styles.tuningGunChipHasMod,
                    ]}
                    onPress={() => setSelectedTuningWeaponId(wp.id)}
                  >
                    <Text style={[styles.tuningGunName, isSelected && styles.tuningGunNameSelected]}>
                      {wp.name}
                    </Text>
                    {hasAdj && (
                      <View style={styles.chipModDot} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Live Tuned Weapon Spec Card */}
            <View style={styles.tuningCard}>
              <View style={styles.tuningHeader}>
                <View>
                  <Text style={styles.tuningTitle}>{tuningWeapon.name} BALANCING RIG</Text>
                  <Text style={styles.tuningCategory}>{tuningWeapon.category} • {tuningWeapon.ammo}</Text>
                </View>

                {isBuffedOrNerfed && (
                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={() => onResetNerfBuff(tuningWeapon.id)}
                  >
                    <Text style={styles.resetButtonText}>Reset to Factory</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Real-time comparison display */}
              <View style={styles.comparisonGrid}>
                {/* Damage */}
                <View style={styles.comparisonBox}>
                  <Text style={styles.compLabel}>DAMAGE</Text>
                  <Text style={styles.compValueCurrent}>
                    {tunedAnalysis.effectiveDamage}
                  </Text>
                  <Text style={styles.compValueBase}>Base: {tuningWeapon.stats.damage}</Text>
                </View>

                {/* Fire Rate */}
                <View style={styles.comparisonBox}>
                  <Text style={styles.compLabel}>FIRE RATE</Text>
                  <Text style={styles.compValueCurrent}>
                    {tunedAnalysis.effectiveFireRateRps} rps
                  </Text>
                  <Text style={styles.compValueBase}>Base: {(1 / tuningWeapon.stats.fireRate).toFixed(1)} rps</Text>
                </View>

                {/* Recoil Climb */}
                <View style={styles.comparisonBox}>
                  <Text style={styles.compLabel}>RECOIL CLIMB</Text>
                  <Text style={[styles.compValueCurrent, currentAdjustment.recoilPercent < 0 ? { color: '#10B981' } : currentAdjustment.recoilPercent > 0 ? { color: '#EF4444' } : {}]}>
                    {tunedAnalysis.effectiveVerticalRecoil}
                  </Text>
                  <Text style={styles.compValueBase}>Base: {baseAnalysis.effectiveVerticalRecoil}</Text>
                </View>

                {/* ADS Speed */}
                <View style={styles.comparisonBox}>
                  <Text style={styles.compLabel}>ADS TIME</Text>
                  <Text style={styles.compValueCurrent}>
                    {tunedAnalysis.effectiveAdsTimeMs}ms
                  </Text>
                  <Text style={styles.compValueBase}>Base: {tuningWeapon.stats.adsSpeedBase || 240}ms</Text>
                </View>
              </View>

              {/* ================= CONTROLLER SLIDERS / STEPPERS ================= */}

              {/* 1. DAMAGE STEPPER */}
              <View style={styles.stepperRow}>
                <View style={styles.stepperLabelGroup}>
                  <Text style={styles.stepperTitle}>Base Bullet Damage</Text>
                  <Text style={styles.stepperSub}>
                    {currentAdjustment.damageDelta >= 0 ? `+${currentAdjustment.damageDelta}` : currentAdjustment.damageDelta} DMG delta
                  </Text>
                </View>
                <View style={styles.stepperControls}>
                  <TouchableOpacity
                    style={[styles.stepBtn, styles.stepBtnNerf]}
                    onPress={() => handleAdjustValue('damageDelta', -1)}
                  >
                    <Text style={styles.stepBtnText}>-1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.stepBtn, styles.stepBtnBuff]}
                    onPress={() => handleAdjustValue('damageDelta', 1)}
                  >
                    <Text style={styles.stepBtnText}>+1</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 2. FIRE RATE STEPPER */}
              <View style={styles.stepperRow}>
                <View style={styles.stepperLabelGroup}>
                  <Text style={styles.stepperTitle}>Rate of Fire (RPS)</Text>
                  <Text style={styles.stepperSub}>
                    {currentAdjustment.fireRatePercent >= 0 ? `+${currentAdjustment.fireRatePercent}%` : `${currentAdjustment.fireRatePercent}%`} fire cycles
                  </Text>
                </View>
                <View style={styles.stepperControls}>
                  <TouchableOpacity
                    style={[styles.stepBtn, styles.stepBtnNerf]}
                    onPress={() => handleAdjustValue('fireRatePercent', -5)}
                  >
                    <Text style={styles.stepBtnText}>-5%</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.stepBtn, styles.stepBtnBuff]}
                    onPress={() => handleAdjustValue('fireRatePercent', 5)}
                  >
                    <Text style={styles.stepBtnText}>+5%</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 3. RECOIL STEPPER */}
              <View style={styles.stepperRow}>
                <View style={styles.stepperLabelGroup}>
                  <Text style={styles.stepperTitle}>Vertical & Horizontal Recoil Kick</Text>
                  <Text style={styles.stepperSub}>
                    {currentAdjustment.recoilPercent <= 0
                      ? `${currentAdjustment.recoilPercent}% Kick (Buffed Stabilized)`
                      : `+${currentAdjustment.recoilPercent}% Kick (Nerfed Harder)`}
                  </Text>
                </View>
                <View style={styles.stepperControls}>
                  {/* For Recoil, reducing kick is a BUFF */}
                  <TouchableOpacity
                    style={[styles.stepBtn, styles.stepBtnBuff]}
                    onPress={() => handleAdjustValue('recoilPercent', -5)}
                  >
                    <Text style={styles.stepBtnText}>-5% (Buff)</Text>
                  </TouchableOpacity>
                  {/* Increasing kick is a NERF */}
                  <TouchableOpacity
                    style={[styles.stepBtn, styles.stepBtnNerf]}
                    onPress={() => handleAdjustValue('recoilPercent', 5)}
                  >
                    <Text style={styles.stepBtnText}>+5% (Nerf)</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 4. ADS SPEED STEPPER */}
              <View style={styles.stepperRow}>
                <View style={styles.stepperLabelGroup}>
                  <Text style={styles.stepperTitle}>Aim Down Sights (ADS) Speed</Text>
                  <Text style={styles.stepperSub}>
                    {currentAdjustment.adsSpeedPercent >= 0
                      ? `+${currentAdjustment.adsSpeedPercent}% Faster ADS`
                      : `${currentAdjustment.adsSpeedPercent}% Slower ADS`}
                  </Text>
                </View>
                <View style={styles.stepperControls}>
                  <TouchableOpacity
                    style={[styles.stepBtn, styles.stepBtnNerf]}
                    onPress={() => handleAdjustValue('adsSpeedPercent', -5)}
                  >
                    <Text style={styles.stepBtnText}>-5%</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.stepBtn, styles.stepBtnBuff]}
                    onPress={() => handleAdjustValue('adsSpeedPercent', 5)}
                  >
                    <Text style={styles.stepBtnText}>+5%</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Update & Jump to Armory Button */}
              <TouchableOpacity
                style={styles.applyTestBtn}
                onPress={() => {
                  onSelectWeapon(tuningWeapon);
                  onBackToArmory();
                }}
              >
                <Zap size={16} color="#020617" strokeWidth={2.5} />
                <Text style={styles.applyTestBtnText}>
                  Update {tuningWeapon.name} & Apply to Landing Page
                </Text>
                <ChevronRight size={15} color="#020617" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  badge: {
    color: colors.amber,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.cyanTint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cyan,
  },
  backButtonText: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: '800',
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  switchTab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  switchTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.amber,
    backgroundColor: colors.amberTint,
  },
  switchTabText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  switchTabTextActive: {
    color: '#F59E0B',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryNumber: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
  },
  summarySub: {
    color: '#94A3B8',
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  panelBox: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  panelHeading: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  panelSubHeading: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  analyticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1222',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 8,
  },
  analyticsRowWinner: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: '#151E33',
  },
  rankNumBadge: {
    width: 26,
    alignItems: 'center',
  },
  rankNum: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '900',
  },
  gunThumbImg: {
    width: 44,
    height: 32,
    marginHorizontal: 8,
  },
  analyticsGunDetails: {
    flex: 1,
  },
  gunTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  analyticsGunName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '900',
  },
  analyticsTierTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  analyticsTierText: {
    color: '#F59E0B',
    fontSize: 8,
    fontWeight: '900',
  },
  customModPill: {
    backgroundColor: '#10B981',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  customModPillText: {
    color: '#020617',
    fontSize: 8,
    fontWeight: '900',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  analyticsClickCol: {
    alignItems: 'flex-end',
    marginLeft: 10,
    minWidth: 40,
  },
  clickCountValue: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '900',
  },
  clickPercentText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  metaIntelBox: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  intelTitle: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  intelText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
  workshopIntroCard: {
    marginBottom: 14,
  },
  workshopIntroTag: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  workshopIntroHeading: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  workshopIntroDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
  },
  tuningGunScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  tuningGunChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 6,
  },
  tuningGunChipSelected: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  tuningGunChipHasMod: {
    borderColor: '#10B981',
  },
  tuningGunName: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
  },
  tuningGunNameSelected: {
    color: '#020617',
  },
  chipModDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  tuningCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  tuningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  tuningTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tuningCategory: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  resetButton: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  resetButtonText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
  },
  comparisonGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  comparisonBox: {
    flex: 1,
    backgroundColor: '#020617',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  compLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    marginBottom: 2,
  },
  compValueCurrent: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '900',
  },
  compValueBase: {
    color: '#475569',
    fontSize: 8,
    marginTop: 2,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  stepperLabelGroup: {
    flex: 1,
  },
  stepperTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '800',
  },
  stepperSub: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  stepperControls: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBtn: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 44,
    alignItems: 'center',
  },
  stepBtnNerf: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  stepBtnBuff: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
    borderWidth: 1,
  },
  stepBtnText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '900',
  },
  applyTestBtn: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingVertical: 12,
  },
  applyTestBtnText: {
    color: '#020617',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
