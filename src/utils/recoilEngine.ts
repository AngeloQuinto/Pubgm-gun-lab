import { Weapon, ATTACHMENTS, AttachmentSlot, WeaponNerfBuffAdjustment } from '../data/weapons';

export interface RecoilAnalysis {
  effectiveVerticalRecoil: number; // 0 - 100
  effectiveHorizontalRecoil: number; // 0 - 100
  stabilityScore: number; // 0 - 100
  spreadIndex: number;
  recoilPath: { x: number; y: number; shot: number }[];
  bulletGroupingRadius: number;
  overallRating: 'LASER BEAM' | 'EXCELLENT' | 'MODERATE' | 'HIGH KICK' | 'EXTREME KICK';
  recoilReductionPercent: number;
  effectiveDamage: number;
  effectiveFireRateRps: number;
  effectiveAdsTimeMs: number;
}

/**
 * Calculates physics-based recoil simulation points with attachment modifiers & Nerf/Buff multipliers
 */
export function calculateRecoilSimulation(
  weapon: Weapon,
  selectedAttachments: Partial<Record<AttachmentSlot, string>>,
  nerfBuffAdjustment?: WeaponNerfBuffAdjustment
): RecoilAnalysis {
  let vertReduction = 0;
  let horizReduction = 0;
  let spreadReduction = 0;
  let adsBonus = 0;

  // Aggregate attachment buffs
  Object.entries(selectedAttachments).forEach(([_slot, attId]) => {
    if (!attId) return;
    const att = ATTACHMENTS[attId];
    if (att && att.modifiers) {
      if (att.modifiers.verticalRecoilReduction) vertReduction += att.modifiers.verticalRecoilReduction;
      if (att.modifiers.horizontalRecoilReduction) horizReduction += att.modifiers.horizontalRecoilReduction;
      if (att.modifiers.spreadReduction) spreadReduction += att.modifiers.spreadReduction;
      if (att.modifiers.adsSpeedBonus) adsBonus += att.modifiers.adsSpeedBonus;
    }
  });

  // Apply manual Nerf / Buff multipliers
  const nerfBuff = nerfBuffAdjustment || {
    damageDelta: 0,
    fireRatePercent: 0,
    recoilPercent: 0,
    adsSpeedPercent: 0,
  };

  const effectiveDamage = Math.max(5, weapon.stats.damage + nerfBuff.damageDelta);

  // Recoil modifier: + recoilPercent increases kick (nerf), negative reduces kick (buff)
  const recoilMultiplier = 1 + nerfBuff.recoilPercent / 100;

  const baseVert = weapon.stats.verticalRecoilBase;
  const baseHoriz = weapon.stats.horizontalRecoilBase;

  const effectiveVert = Math.max(8, Math.round(baseVert * (1 - vertReduction) * recoilMultiplier));
  const effectiveHoriz = Math.max(6, Math.round(baseHoriz * (1 - horizReduction) * recoilMultiplier));
  const effectiveSpread = Math.max(5, Math.round(weapon.stats.spreadBase * (1 - spreadReduction) * recoilMultiplier));

  // Fire rate in RPS (rounds per sec). Positive fireRatePercent = faster fire rate
  const baseRps = 1 / weapon.stats.fireRate;
  const effectiveFireRateRps = Math.max(1, Math.round((baseRps * (1 + nerfBuff.fireRatePercent / 100)) * 10) / 10);

  // ADS Speed in milliseconds. Positive adsSpeedPercent = faster ADS (lower ms)
  const baseAdsMs = weapon.stats.adsSpeedBase || 240;
  const effectiveAdsTimeMs = Math.max(80, Math.round(baseAdsMs * (1 - adsBonus) * (1 - nerfBuff.adsSpeedPercent / 100)));

  // Recoil path coordinates generator (relative to canvas center 150, 240)
  const path: { x: number; y: number; shot: number }[] = [];
  let currentX = 150;
  let currentY = 250;

  // Predictable upward climb + horizontal sine wobble + RNG jitter
  const totalShots = 25;
  const vertStep = (effectiveVert / 22);
  const horizWobble = (effectiveHoriz / 35);

  path.push({ x: currentX, y: currentY, shot: 1 });

  for (let i = 2; i <= totalShots; i++) {
    // Upward climb accelerates slightly after 5th bullet in PUBG
    const acceleration = i > 5 ? 1.15 : 0.85;
    const dy = vertStep * acceleration * (1 + Math.sin(i * 0.4) * 0.15);
    
    // Side to side drift with random dispersion
    const driftDirection = Math.sin(i * 0.85) * horizWobble;
    const jitter = (Math.random() - 0.5) * (effectiveSpread / 6);
    const dx = driftDirection + jitter;

    currentY -= dy * 3.8;
    currentX += dx * 4.2;

    path.push({
      x: Math.round(currentX * 10) / 10,
      y: Math.round(currentY * 10) / 10,
      shot: i,
    });
  }

  // Calculate overall stability score
  const totalBase = baseVert + baseHoriz;
  const totalEffective = effectiveVert + effectiveHoriz;
  const reductionPercent = Math.round(((totalBase - totalEffective) / totalBase) * 100);

  const rawScore = 100 - (effectiveVert * 0.58 + effectiveHoriz * 0.42);
  const stabilityScore = Math.min(99, Math.max(15, Math.round(rawScore)));

  let overallRating: RecoilAnalysis['overallRating'] = 'MODERATE';
  if (stabilityScore >= 80) overallRating = 'LASER BEAM';
  else if (stabilityScore >= 68) overallRating = 'EXCELLENT';
  else if (stabilityScore >= 52) overallRating = 'MODERATE';
  else if (stabilityScore >= 38) overallRating = 'HIGH KICK';
  else overallRating = 'EXTREME KICK';

  const groupingRadius = Math.round((effectiveVert * 0.45 + effectiveHoriz * 0.55 + effectiveSpread * 0.8) / 3);

  return {
    effectiveVerticalRecoil: effectiveVert,
    effectiveHorizontalRecoil: effectiveHoriz,
    stabilityScore,
    spreadIndex: effectiveSpread,
    recoilPath: path,
    bulletGroupingRadius: groupingRadius,
    overallRating,
    recoilReductionPercent: reductionPercent,
    effectiveDamage,
    effectiveFireRateRps,
    effectiveAdsTimeMs,
  };
}
