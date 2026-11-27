import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { TrendingDown, TrendingUp } from 'lucide-react-native';
import { Weapon, WeaponNerfBuffAdjustment } from '../data/weapons';
import { colors } from '../theme';

interface Props {
  weapon: Weapon;
  isSelected: boolean;
  onSelect: (weapon: Weapon) => void;
  nerfBuffAdjustment?: WeaponNerfBuffAdjustment;
}

export const WeaponCardItem: React.FC<Props> = ({
  weapon,
  isSelected,
  onSelect,
  nerfBuffAdjustment,
}) => {
  const isNerfedOrBuffed =
    nerfBuffAdjustment &&
    (nerfBuffAdjustment.damageDelta !== 0 ||
      nerfBuffAdjustment.fireRatePercent !== 0 ||
      nerfBuffAdjustment.recoilPercent !== 0 ||
      nerfBuffAdjustment.adsSpeedPercent !== 0);

  // Overall status classification
  const isBuffed =
    isNerfedOrBuffed &&
    (nerfBuffAdjustment.damageDelta > 0 ||
      nerfBuffAdjustment.fireRatePercent > 0 ||
      nerfBuffAdjustment.recoilPercent < 0 ||
      nerfBuffAdjustment.adsSpeedPercent > 0);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected,
      ]}
      onPress={() => onSelect(weapon)}
      activeOpacity={0.85}
    >
      {/* Full-Container Subtle Glass Highlight (avoids half-card seam or hollow box) */}
      <View
        style={[
          styles.glassShine,
          isSelected && styles.glassShineSelected,
        ]}
        pointerEvents="none"
      />

      {/* Tier & Ammo Meta Row */}
      <View style={styles.topMeta}>
        <View style={[styles.tierTag, weapon.tier === 'S' ? styles.tierS : styles.tierA]}>
          <Text style={[styles.tierText, weapon.tier === 'S' ? styles.tierSText : styles.tierAText]}>
            TIER {weapon.tier}
          </Text>
        </View>
        <Text style={styles.ammoTag} numberOfLines={1}>{weapon.ammo}</Text>
      </View>

      {/* Nerf/Buff Notification Badge (in-flow below topMeta so it never overlaps TIER or ammo) */}
      {isNerfedOrBuffed && (
        <View style={[styles.nerfBuffCardBadge, isBuffed ? styles.buffBadgeBg : styles.nerfBadgeBg]}>
          {isBuffed ? (
            <TrendingUp size={10} color={colors.success} strokeWidth={3} />
          ) : (
            <TrendingDown size={10} color={colors.danger} strokeWidth={3} />
          )}
          <Text style={[styles.nerfBuffCardBadgeText, isBuffed ? styles.buffText : styles.nerfText]}>
            {isBuffed ? 'BUFFED' : 'NERFED'}
          </Text>
        </View>
      )}

      {/* Weapon Thumbnail */}
      <View style={styles.imageBox}>
        <Image source={{ uri: weapon.image }} style={styles.gunThumb} resizeMode="contain" />
      </View>

      {/* Weapon Info */}
      <View style={styles.infoBox}>
        <Text style={styles.weaponName} numberOfLines={1} ellipsizeMode="tail">{weapon.name}</Text>
        <Text style={styles.weaponType} numberOfLines={1}>{weapon.category} • {weapon.stats.damage} DMG</Text>
      </View>

      {/* Recoil Status Indicator */}
      <View style={styles.footerRow}>
        <Text style={styles.footerKick}>Kick: {weapon.stats.verticalRecoilBase}</Text>
        <View style={styles.slotsCount}>
          <Text style={styles.slotsCountText}>{weapon.supportedSlots.length} Slots</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 170,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: 12,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  cardSelected: {
    backgroundColor: colors.surface,
    borderColor: colors.amber,
    borderWidth: 2,
  },
  glassShine: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
    borderRadius: 14,
  },
  glassShineSelected: {
    backgroundColor: colors.amberTint,
  },
  nerfBuffCardBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 4,
    zIndex: 5,
  },
  buffBadgeBg: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: colors.success,
  },
  nerfBadgeBg: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: colors.danger,
  },
  nerfBuffCardBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  buffText: {
    color: colors.success,
  },
  nerfText: {
    color: colors.danger,
  },
  topMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    zIndex: 2,
  },
  tierTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  tierS: {
    borderColor: colors.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
  },
  tierA: {
    borderColor: colors.amberBorder,
    backgroundColor: colors.amberTint,
  },
  tierText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tierSText: {
    color: colors.danger,
  },
  tierAText: {
    color: colors.amber,
  },
  ammoTag: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '800',
    backgroundColor: colors.bg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  imageBox: {
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    zIndex: 2,
  },
  gunThumb: {
    width: '100%',
    height: '100%',
  },
  infoBox: {
    marginBottom: 8,
    zIndex: 2,
  },
  weaponName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  weaponType: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    zIndex: 2,
  },
  footerKick: {
    color: colors.danger,
    fontSize: 10,
    fontWeight: '800',
  },
  slotsCount: {
    backgroundColor: colors.bg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotsCountText: {
    color: colors.cyan,
    fontSize: 9,
    fontWeight: '800',
  },
});
