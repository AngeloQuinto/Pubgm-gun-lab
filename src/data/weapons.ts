export type WeaponCategory = 'AR' | 'SMG' | 'DMR' | 'LMG';
export type AmmoType = '5.56mm' | '7.62mm' | '9mm' | '.45 ACP' | '5.7mm';

export const PUBGM_WEAPON_ASSET_BASE =
  'https://raw.githubusercontent.com/pubg/api-assets/master/Assets/Item/Weapon/Main';
export const PUBGM_ATTACHMENT_ASSET_BASE =
  'https://raw.githubusercontent.com/pubg/api-assets/master/Assets/Item/Attachment';

export interface WeaponStats {
  damage: number;
  fireRate: number; // seconds per shot
  bulletSpeed: number; // m/s
  effectiveRange: number; // meters
  magCapacity: number;
  reloadTime: number; // sec
  verticalRecoilBase: number; // arbitrary scale 1-100
  horizontalRecoilBase: number;
  recoilRecovery: number; // rate of settling
  spreadBase: number;
  adsSpeedBase?: number; // ms to aim down sights (default ~240ms)
}

export interface WeaponNerfBuffAdjustment {
  damageDelta: number; // e.g. +3 or -5
  fireRatePercent: number; // e.g. +10% faster or -15% slower
  recoilPercent: number; // e.g. -20% kick (buff) or +25% kick (nerf)
  adsSpeedPercent: number; // e.g. +15% faster ADS or -20% slower
}

export type AttachmentSlot = 'muzzle' | 'grip' | 'magazine' | 'stock' | 'scope';

export interface AttachmentModifier {
  verticalRecoilReduction?: number; // e.g. 0.15 = 15% reduction
  horizontalRecoilReduction?: number;
  recoilRecoveryBonus?: number;
  spreadReduction?: number;
  adsSpeedBonus?: number;
  capacityBonus?: number;
  reloadTimeReduction?: number;
}

export interface Attachment {
  id: string;
  name: string;
  slot: AttachmentSlot;
  image: string;
  compatibleWith: string[]; // weapon IDs or 'ALL'
  modifiers: AttachmentModifier;
  description: string;
  recommendationTag?: 'BEST FOR SPRAY' | 'TAP FIRING' | 'STEALTH' | 'AGGRESSIVE' | 'COMPETITIVE' | 'PRO COMPETITIVE';
}

export interface Weapon {
  id: string;
  name: string;
  category: WeaponCategory;
  ammo: AmmoType;
  image: string; // Thumb / Card image
  showcaseImage?: string; // High-resolution showcase image
  tier: 'S' | 'A' | 'B' | 'C';
  description: string;
  stats: WeaponStats;
  supportedSlots: AttachmentSlot[];
  recommendedLoadouts: {
    playstyle: 'Aggressive Close-Range' | 'Mid-Range Spray' | 'Pro Competitive';
    attachments: Partial<Record<AttachmentSlot, string>>;
    reason: string;
  }[];
}

const AR_ALL = [
  'm416', 'm762', 'akm', 'scarl', 'aug', 'groza', 'qbz95', 'g36c',
  'm16a4', 'mk47', 'k2', 'ace32', 'famas',
];
const AR_GRIP = [
  'm416', 'm762', 'scarl', 'aug', 'qbz95', 'g36c', 'mk47', 'ace32',
];
const SMG_ALL = ['ump45', 'vector', 'uzi', 'bizon', 'thompson', 'mp5k', 'mp9'];
const SMG_GRIP = ['ump45', 'vector', 'thompson', 'mp5k'];
const DMR_ALL = ['slr', 'sks', 'mini14', 'mk14', 'qbu', 'mk12', 'dragunov'];
const DMR_GRIP = ['sks', 'mk12'];
const AR_DMR_MUZZLE = [...AR_ALL.filter((id) => id !== 'groza' && id !== 'famas'), ...DMR_ALL];
const AR_DMR_MAG = [...AR_ALL, ...DMR_ALL];

export const ATTACHMENTS: Record<string, Attachment> = {
  // MUZZLES (AR / DMR)
  'comp_ar': {
    id: 'comp_ar',
    name: 'Compensator (AR/DMR)',
    slot: 'muzzle',
    image: `${PUBGM_ATTACHMENT_ASSET_BASE}/Item_Attach_Weapon_Muzzle_Compensator_Large_C.png`,
    compatibleWith: AR_DMR_MUZZLE,
    modifiers: {
      verticalRecoilReduction: 0.15,
      horizontalRecoilReduction: 0.10,
      spreadReduction: 0.10,
    },
    description: 'Significantly reduces vertical and horizontal recoil for sustained full-auto sprays.',
    recommendationTag: 'BEST FOR SPRAY',
  },
  'flash_ar': {
    id: 'flash_ar',
    name: 'Flash Hider (AR/DMR)',
    slot: 'muzzle',
    image: `${PUBGM_ATTACHMENT_ASSET_BASE}/Item_Attach_Weapon_Muzzle_FlashHider_Large_C.png`,
    compatibleWith: AR_DMR_MUZZLE,
    modifiers: {
      verticalRecoilReduction: 0.10,
      horizontalRecoilReduction: 0.10,
    },
    description: 'Hides muzzle flash and provides moderate recoil reduction.',
  },
  'supp_ar': {
    id: 'supp_ar',
    name: 'Suppressor (AR/DMR)',
    slot: 'muzzle',
    image: `${PUBGM_ATTACHMENT_ASSET_BASE}/Item_Attach_Weapon_Muzzle_Suppressor_Large_C.png`,
    compatibleWith: [...AR_ALL, ...DMR_ALL],
    modifiers: {
      spreadReduction: 0.05,
    },
    description: 'Eliminates weapon report and muzzle flash. Ideal for tactical stealth and flanking.',
    recommendationTag: 'STEALTH',
  },

  // MUZZLES (SMG)
  'comp_smg': {
    id: 'comp_smg',
    name: 'Compensator (SMG)',
    slot: 'muzzle',
    image: `${PUBGM_ATTACHMENT_ASSET_BASE}/Item_Attach_Weapon_Muzzle_Compensator_Medium_C.png`,
    compatibleWith: ['ump45', 'vector', 'uzi', 'bizon', 'mp5k'],
    modifiers: {
      verticalRecoilReduction: 0.25,
      horizontalRecoilReduction: 0.20,
    },
    description: 'Massive recoil stabilization for close quarters bullet laser beam.',
    recommendationTag: 'BEST FOR SPRAY',
  },
  'flash_smg': {
    id: 'flash_smg',
    name: 'Flash Hider (SMG)',
    slot: 'muzzle',
    image: `${PUBGM_ATTACHMENT_ASSET_BASE}/Item_Attach_Weapon_Muzzle_FlashHider_Medium_C.png`,
    compatibleWith: ['ump45', 'vector', 'uzi', 'bizon', 'mp5k'],
    modifiers: {
      verticalRecoilReduction: 0.12,
      horizontalRecoilReduction: 0.10,
    },
    description: 'Suppresses SMG muzzle flash with balanced recoil control.',
  },
  'supp_smg': {
    id: 'supp_smg',
    name: 'Suppressor (SMG)',
    slot: 'muzzle',
    image: `${PUBGM_ATTACHMENT_ASSET_BASE}/Item_Attach_Weapon_Muzzle_Suppressor_Medium_C.png`,
    compatibleWith: SMG_ALL,
    modifiers: {
      spreadReduction: 0.08,
    },
    description: 'Silent CQC engagements with reduced firing sound signature.',
    recommendationTag: 'STEALTH',
  },

  // GRIPS
  'vert_grip': {
    id: 'vert_grip',
    name: 'Vertical Foregrip',
    slot: 'grip',
    image: `${PUBGM_ATTACHMENT_ASSET_BASE}/Item_Attach_Weapon_Lower_Foregrip_C.png`,
    compatibleWith: [...AR_GRIP, ...SMG_GRIP, ...DMR_GRIP],
    modifiers: {
      verticalRecoilReduction: 0.15,
      recoilRecoveryBonus: 0.15,
    },
    description: 'Top pick for controlling vertical climb in long sprays or single tapping DMRs.',
    recommendationTag: 'BEST FOR SPRAY',
  },
  'angled_grip': {
    id: 'angled_grip',
    name: 'Angled Foregrip',
    slot: 'grip',
    image: `${PUBGM_ATTACHMENT_ASSET_BASE}/Item_Attach_Weapon_Lower_AngledForeGrip_C.png`,
    compatibleWith: [...AR_GRIP, 'ump45', 'mp5k'],
    modifiers: {
      horizontalRecoilReduction: 0.15,
      adsSpeedBonus: 0.10,
    },
    description: 'Eliminates unpredictable side-to-side horizontal recoil shake and speeds up ADS.',
    recommendationTag: 'PRO COMPETITIVE',
  },
  'half_grip': {
    id: 'half_grip',
    name: 'Half Grip (Orange)',
    slot: 'grip',
    image: `${PUBGM_ATTACHMENT_ASSET_BASE}/Item_Attach_Weapon_Lower_HalfGrip_C.png`,
    compatibleWith: [...AR_GRIP, 'ump45', 'vector', 'mp5k'],
    modifiers: {
      verticalRecoilReduction: 0.08,
      horizontalRecoilReduction: 0.08,
      recoilRecoveryBonus: 0.10,
    },
    description: 'Great balanced grip for continuous automatic sprays in PUBG Mobile meta.',
    recommendationTag: 'BEST FOR SPRAY',
  },
  'thumb_grip': {
    id: 'thumb_grip',
    name: 'Thumb Grip',
    slot: 'grip',
    image: `${PUBGM_ATTACHMENT_ASSET_BASE}/Item_Attach_Weapon_Lower_ThumbGrip_C.png`,
    compatibleWith: [...AR_GRIP, 'ump45', 'mp5k', ...DMR_GRIP],
    modifiers: {
      adsSpeedBonus: 0.25,
      verticalRecoilReduction: 0.05,
    },
    description: 'Dramatically speeds up ADS scope-in time for fast reflexes.',
    recommendationTag: 'AGGRESSIVE',
  },
  'laser_sight': {
    id: 'laser_sight',
    name: 'Laser Sight',
    slot: 'grip',
    image: `${PUBGM_ATTACHMENT_ASSET_BASE}/Item_Attach_Weapon_Lower_LaserPointer_C.png`,
    compatibleWith: [...AR_GRIP, ...SMG_GRIP, ...DMR_GRIP],
    modifiers: {
      spreadReduction: 0.30,
    },
    description: 'Drastically reduces hip-fire spread. Crucial for CQC 1v1 rushers.',
    recommendationTag: 'AGGRESSIVE',
  },
  'light_grip': {
    id: 'light_grip',
    name: 'Light Grip',
    slot: 'grip',
    image: `${PUBGM_ATTACHMENT_ASSET_BASE}/Item_Attach_Weapon_Lower_LightweightForeGrip_C.png`,
    compatibleWith: [...AR_GRIP, ...SMG_GRIP, ...DMR_GRIP],
    modifiers: {
      recoilRecoveryBonus: 0.25,
      spreadReduction: 0.10,
    },
    description: 'Fastest reticle recovery after single shots. Exceptional for SKS/Mk12 DMR taps.',
    recommendationTag: 'TAP FIRING',
  },

  // MAGAZINES (AR / DMR)
  'ext_quick_ar': {
    id: 'ext_quick_ar',
    name: 'Extended QuickDraw Mag (AR)',
    slot: 'magazine',
    image: `${PUBGM_ATTACHMENT_ASSET_BASE}/Item_Attach_Weapon_Magazine_ExtendedQuickDraw_Large_C.png`,
    compatibleWith: AR_DMR_MAG,
    modifiers: {
      capacityBonus: 10,
      reloadTimeReduction: 0.30,
    },
    description: 'Expands capacity to 40 rounds and speeds reload speed by 30%.',
    recommendationTag: 'COMPETITIVE',
  },
  'ext_ar': {
    id: 'ext_ar',
    name: 'Extended Mag (AR)',
    slot: 'magazine',
    image: `${PUBGM_ATTACHMENT_ASSET_BASE}/Item_Attach_Weapon_Magazine_Extended_Large_C.png`,
    compatibleWith: AR_DMR_MAG,
    modifiers: {
      capacityBonus: 10,
    },
    description: 'Increases magazine capacity by 10 rounds.',
  },

  // MAGAZINES (SMG)
  'ext_quick_smg': {
    id: 'ext_quick_smg',
    name: 'Extended QuickDraw Mag (SMG)',
    slot: 'magazine',
    image: `${PUBGM_ATTACHMENT_ASSET_BASE}/Item_Attach_Weapon_Magazine_ExtendedQuickDraw_Medium_C.png`,
    compatibleWith: ['ump45', 'vector', 'uzi', 'thompson', 'mp5k', 'mp9'],
    modifiers: {
      capacityBonus: 12,
      reloadTimeReduction: 0.30,
    },
    description: 'Boosts SMG magazine capacity and cuts reload downtime by 30%.',
    recommendationTag: 'COMPETITIVE',
  },
  'ext_smg': {
    id: 'ext_smg',
    name: 'Extended Mag (SMG)',
    slot: 'magazine',
    image: `${PUBGM_ATTACHMENT_ASSET_BASE}/Item_Attach_Weapon_Magazine_Extended_Medium_C.png`,
    compatibleWith: ['ump45', 'vector', 'uzi', 'thompson', 'mp5k', 'mp9'],
    modifiers: {
      capacityBonus: 12,
    },
    description: 'Increases SMG magazine capacity for sustained CQC fights.',
  },

  // STOCKS
  'tactical_stock': {
    id: 'tactical_stock',
    name: 'Tactical Stock',
    slot: 'stock',
    image: `${PUBGM_ATTACHMENT_ASSET_BASE}/Item_Attach_Weapon_Stock_AR_Composite_C.png`,
    compatibleWith: ['m416', 'vector', 'm16a4', 'mk47', 'ace32', 'mp5k'],
    modifiers: {
      recoilRecoveryBonus: 0.20,
      horizontalRecoilReduction: 0.10,
      spreadReduction: 0.10,
      adsSpeedBonus: 0.05,
    },
    description: 'Stabilizes the weapon, recovers kick much faster, and prevents reticle jitter.',
    recommendationTag: 'PRO COMPETITIVE',
  },
  'uzi_stock': {
    id: 'uzi_stock',
    name: 'Folding Stock (UZI)',
    slot: 'stock',
    image: `${PUBGM_ATTACHMENT_ASSET_BASE}/Item_Attach_Weapon_Stock_UZI_C.png`,
    compatibleWith: ['uzi'],
    modifiers: {
      recoilRecoveryBonus: 0.20,
      verticalRecoilReduction: 0.10,
      spreadReduction: 0.15,
    },
    description: 'Significantly tightens Micro UZI spray stability.',
    recommendationTag: 'BEST FOR SPRAY',
  },
  'cheek_pad': {
    id: 'cheek_pad',
    name: 'Cheek Pad',
    slot: 'stock',
    image: `${PUBGM_ATTACHMENT_ASSET_BASE}/Item_Attach_Weapon_Stock_SniperRifle_CheekPad_C.png`,
    compatibleWith: ['slr', 'sks', 'mk14', 'dragunov'],
    modifiers: {
      verticalRecoilReduction: 0.15,
      recoilRecoveryBonus: 0.20,
      spreadReduction: 0.15,
    },
    description: 'Reduces vertical kick and sway for rapid DMR follow-up taps.',
    recommendationTag: 'TAP FIRING',
  },

  // SCOPES
  'red_dot': {
    id: 'red_dot',
    name: 'Red Dot Sight',
    slot: 'scope',
    image: `${PUBGM_ATTACHMENT_ASSET_BASE}/Item_Attach_Weapon_Upper_DotSight_01_C.png`,
    compatibleWith: ['ALL'],
    modifiers: {
      adsSpeedBonus: 0.20,
    },
    description: 'Clean holographic reticle with 20% faster ADS acquisition for rapid reaction.',
    recommendationTag: 'AGGRESSIVE',
  },
  'holo_sight': {
    id: 'holo_sight',
    name: 'Holographic Sight',
    slot: 'scope',
    image: `${PUBGM_ATTACHMENT_ASSET_BASE}/Item_Attach_Weapon_Upper_Holosight_C.png`,
    compatibleWith: ['ALL'],
    modifiers: {
      adsSpeedBonus: 0.15,
    },
    description: 'Sturdy CQC optic with crisp center ring for close-to-mid tracking.',
  },
  'scope_2x': {
    id: 'scope_2x',
    name: '2x Aimpoint Scope',
    slot: 'scope',
    image: `${PUBGM_ATTACHMENT_ASSET_BASE}/Item_Attach_Weapon_Upper_Aimpoint_C.png`,
    compatibleWith: ['ALL'],
    modifiers: {
      adsSpeedBonus: 0.10,
    },
    description: 'Low-magnification optic ideal for close-mid AR and SMG sprays.',
  },
  'scope_3x': {
    id: 'scope_3x',
    name: '3x Backlit Scope',
    slot: 'scope',
    image: `${PUBGM_ATTACHMENT_ASSET_BASE}/Item_Attach_Weapon_Upper_Scope3x_C.png`,
    compatibleWith: ['ALL'],
    modifiers: {
      spreadReduction: 0.05,
    },
    description: 'Pro player favorite for M416 50m-150m sprays.',
    recommendationTag: 'BEST FOR SPRAY',
  },
  'scope_4x': {
    id: 'scope_4x',
    name: '4x ACOG Scope',
    slot: 'scope',
    image: `${PUBGM_ATTACHMENT_ASSET_BASE}/Item_Attach_Weapon_Upper_ACOG_01_C.png`,
    compatibleWith: ['ALL'],
    modifiers: {},
    description: 'Mid-to-long range crosshair optic for DMRs and tap firing.',
  },
  'scope_6x': {
    id: 'scope_6x',
    name: '6x Scope (Dialed down to 3x)',
    slot: 'scope',
    image: `${PUBGM_ATTACHMENT_ASSET_BASE}/Item_Attach_Weapon_Upper_Scope6x_C.png`,
    compatibleWith: ['ALL'],
    modifiers: {},
    description: 'Versatile adjustable zoom. Dial down to 3x for the smoothest 5.56mm spray in game.',
    recommendationTag: 'PRO COMPETITIVE',
  },
};

// All PUBG Mobile automatic & marksman weapons (SR excluded: single-tap bolt-action)
export const WEAPONS_DATA: Weapon[] = [
  // ==================== ASSAULT RIFLES (AR) ====================
  {
    id: 'm416',
    name: 'M416',
    category: 'AR',
    ammo: '5.56mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_HK416_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_HK416_C_h.png`,
    tier: 'S',
    description: 'The golden standard of PUBG Mobile. High versatility with 5 attachment slots, ultra-consistent spray pattern.',
    stats: {
      damage: 41,
      fireRate: 0.086,
      bulletSpeed: 880,
      effectiveRange: 350,
      magCapacity: 30,
      reloadTime: 2.1,
      verticalRecoilBase: 58,
      horizontalRecoilBase: 42,
      recoilRecovery: 65,
      spreadBase: 25,
    },
    supportedSlots: ['muzzle', 'grip', 'magazine', 'stock', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Mid-Range Spray',
        attachments: {
          muzzle: 'comp_ar',
          grip: 'vert_grip',
          magazine: 'ext_quick_ar',
          stock: 'tactical_stock',
          scope: 'scope_3x',
        },
        reason: 'Compensator + Vert Grip + Tac Stock reduces vertical climb by ~38%, enabling laser beams at 80m.',
      },
      {
        playstyle: 'Pro Competitive',
        attachments: {
          muzzle: 'comp_ar',
          grip: 'half_grip',
          magazine: 'ext_quick_ar',
          stock: 'tactical_stock',
          scope: 'scope_6x',
        },
        reason: 'Half-Grip balances side-to-side wobble while 6x dialed to 3x offers clean high-FOV precision.',
      },
      {
        playstyle: 'Aggressive Close-Range',
        attachments: {
          muzzle: 'comp_ar',
          grip: 'laser_sight',
          magazine: 'ext_quick_ar',
          stock: 'tactical_stock',
          scope: 'red_dot',
        },
        reason: 'Maximum hipfire accuracy and fastest ADS time for building clearing.',
      },
    ],
  },
  {
    id: 'm762',
    name: 'Beryl M762',
    category: 'AR',
    ammo: '7.62mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_BerylM762_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_BerylM762_C_h.png`,
    tier: 'S',
    description: 'Heavy 7.62mm monster with blazing DPS. Extreme vertical kick requires strict compensation.',
    stats: {
      damage: 46,
      fireRate: 0.086,
      bulletSpeed: 715,
      effectiveRange: 280,
      magCapacity: 30,
      reloadTime: 2.3,
      verticalRecoilBase: 84,
      horizontalRecoilBase: 52,
      recoilRecovery: 45,
      spreadBase: 35,
    },
    supportedSlots: ['muzzle', 'grip', 'magazine', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Aggressive Close-Range',
        attachments: {
          muzzle: 'comp_ar',
          grip: 'vert_grip',
          magazine: 'ext_quick_ar',
          scope: 'red_dot',
        },
        reason: 'Essential compensator and vertical foregrip to tame the ferocious muzzle climb.',
      },
      {
        playstyle: 'Mid-Range Spray',
        attachments: {
          muzzle: 'comp_ar',
          grip: 'angled_grip',
          magazine: 'ext_quick_ar',
          scope: 'scope_3x',
        },
        reason: 'Angled grip stabilizes sudden horizontal drift during burst sprays.',
      },
    ],
  },
  {
    id: 'akm',
    name: 'AKM',
    category: 'AR',
    ammo: '7.62mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_AK47_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_AK47_C_h.png`,
    tier: 'A',
    description: 'High stopping power close-range rifle with punchy 48 damage. No foregrip slot available.',
    stats: {
      damage: 48,
      fireRate: 0.100,
      bulletSpeed: 715,
      effectiveRange: 300,
      magCapacity: 30,
      reloadTime: 2.3,
      verticalRecoilBase: 78,
      horizontalRecoilBase: 48,
      recoilRecovery: 50,
      spreadBase: 32,
    },
    supportedSlots: ['muzzle', 'magazine', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Aggressive Close-Range',
        attachments: {
          muzzle: 'comp_ar',
          magazine: 'ext_quick_ar',
          scope: 'red_dot',
        },
        reason: 'Compensator is paramount to lower initial 5-shot jump.',
      },
    ],
  },
  {
    id: 'scarl',
    name: 'SCAR-L',
    category: 'AR',
    ammo: '5.56mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_SCAR-L_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_SCAR-L_C_h.png`,
    tier: 'A',
    description: 'Steady 5.56mm rifle with mild horizontal recoil and predictable handling.',
    stats: {
      damage: 41,
      fireRate: 0.096,
      bulletSpeed: 870,
      effectiveRange: 340,
      magCapacity: 30,
      reloadTime: 2.2,
      verticalRecoilBase: 55,
      horizontalRecoilBase: 38,
      recoilRecovery: 64,
      spreadBase: 26,
    },
    supportedSlots: ['muzzle', 'grip', 'magazine', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Mid-Range Spray',
        attachments: {
          muzzle: 'comp_ar',
          grip: 'vert_grip',
          magazine: 'ext_quick_ar',
          scope: 'scope_3x',
        },
        reason: 'Clean vertical control makes mid-range sprays effortless.',
      },
    ],
  },
  {
    id: 'aug',
    name: 'AUG A3',
    category: 'AR',
    ammo: '5.56mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_AUG_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_AUG_C_h.png`,
    tier: 'S',
    description: 'High-velocity bullpup 5.56mm AR with blistering fire rate and flat recoil.',
    stats: {
      damage: 41,
      fireRate: 0.083,
      bulletSpeed: 940,
      effectiveRange: 380,
      magCapacity: 30,
      reloadTime: 2.4,
      verticalRecoilBase: 52,
      horizontalRecoilBase: 36,
      recoilRecovery: 68,
      spreadBase: 22,
    },
    supportedSlots: ['muzzle', 'grip', 'magazine', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Pro Competitive',
        attachments: {
          muzzle: 'comp_ar',
          grip: 'angled_grip',
          magazine: 'ext_quick_ar',
          scope: 'scope_3x',
        },
        reason: 'Blistering muzzle velocity plus angled grip delivers unmatched laser accuracy.',
      },
    ],
  },
  {
    id: 'groza',
    name: 'Groza',
    category: 'AR',
    ammo: '7.62mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_Groza_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_GROZA_C_h.png`,
    tier: 'S',
    description: 'Crate-exclusive 7.62mm shredder with the fastest AR time-to-kill in close quarters.',
    stats: {
      damage: 47,
      fireRate: 0.080,
      bulletSpeed: 715,
      effectiveRange: 250,
      magCapacity: 30,
      reloadTime: 2.2,
      verticalRecoilBase: 76,
      horizontalRecoilBase: 46,
      recoilRecovery: 48,
      spreadBase: 34,
    },
    supportedSlots: ['muzzle', 'magazine', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Aggressive Close-Range',
        attachments: {
          muzzle: 'supp_ar',
          magazine: 'ext_quick_ar',
          scope: 'red_dot',
        },
        reason: 'Only accepts AR suppressor on muzzle; dominates CQC duels.',
      },
    ],
  },
  {
    id: 'ace32',
    name: 'ACE32',
    category: 'AR',
    ammo: '7.62mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_ACE32_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_ACE32_C_h.png`,
    tier: 'A',
    description: 'Tactical 7.62mm rifle supporting all 5 attachment slots for controlled heavy sprays.',
    stats: {
      damage: 45,
      fireRate: 0.088,
      bulletSpeed: 720,
      effectiveRange: 290,
      magCapacity: 30,
      reloadTime: 2.3,
      verticalRecoilBase: 72,
      horizontalRecoilBase: 44,
      recoilRecovery: 54,
      spreadBase: 30,
    },
    supportedSlots: ['muzzle', 'grip', 'magazine', 'stock', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Mid-Range Spray',
        attachments: {
          muzzle: 'comp_ar',
          grip: 'vert_grip',
          magazine: 'ext_quick_ar',
          stock: 'tactical_stock',
          scope: 'scope_3x',
        },
        reason: 'Full 5-slot rig tames 7.62mm recoil much easier than Beryl.',
      },
    ],
  },
  {
    id: 'qbz95',
    name: 'QBZ95',
    category: 'AR',
    ammo: '5.56mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_QBZ95_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_QBZ95_C_h.png`,
    tier: 'A',
    description: 'Sanhok bullpup 5.56mm AR with low recoil and solid mid-range stability.',
    stats: {
      damage: 41,
      fireRate: 0.092,
      bulletSpeed: 870,
      effectiveRange: 340,
      magCapacity: 30,
      reloadTime: 2.4,
      verticalRecoilBase: 54,
      horizontalRecoilBase: 37,
      recoilRecovery: 64,
      spreadBase: 24,
    },
    supportedSlots: ['muzzle', 'grip', 'magazine', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Mid-Range Spray',
        attachments: {
          muzzle: 'comp_ar',
          grip: 'half_grip',
          magazine: 'ext_quick_ar',
          scope: 'scope_3x',
        },
        reason: 'Half-Grip + Compensator keeps sprays tight on jungle mid-range fights.',
      },
    ],
  },
  {
    id: 'g36c',
    name: 'G36C',
    category: 'AR',
    ammo: '5.56mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_G36C_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_G36C_C_h.png`,
    tier: 'A',
    description: 'Vikendi 5.56mm workhorse with smooth handling and reliable full-auto control.',
    stats: {
      damage: 41,
      fireRate: 0.092,
      bulletSpeed: 870,
      effectiveRange: 340,
      magCapacity: 30,
      reloadTime: 2.3,
      verticalRecoilBase: 56,
      horizontalRecoilBase: 36,
      recoilRecovery: 65,
      spreadBase: 25,
    },
    supportedSlots: ['muzzle', 'grip', 'magazine', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Mid-Range Spray',
        attachments: {
          muzzle: 'comp_ar',
          grip: 'vert_grip',
          magazine: 'ext_quick_ar',
          scope: 'scope_3x',
        },
        reason: 'Steady vertical climb for long snowfield sprays.',
      },
    ],
  },
  {
    id: 'k2',
    name: 'K2',
    category: 'AR',
    ammo: '5.56mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_K2_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_K2_C_h.png`,
    tier: 'B',
    description: 'Taego 5.56mm assault rifle with crisp burst and full-auto accuracy.',
    stats: {
      damage: 41,
      fireRate: 0.092,
      bulletSpeed: 880,
      effectiveRange: 340,
      magCapacity: 30,
      reloadTime: 2.2,
      verticalRecoilBase: 59,
      horizontalRecoilBase: 40,
      recoilRecovery: 60,
      spreadBase: 26,
    },
    supportedSlots: ['muzzle', 'magazine', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Mid-Range Spray',
        attachments: {
          muzzle: 'comp_ar',
          magazine: 'ext_quick_ar',
          scope: 'red_dot',
        },
        reason: 'Compensator stabilizes full-auto bursts without needing a grip.',
      },
    ],
  },
  {
    id: 'm16a4',
    name: 'M16A4',
    category: 'AR',
    ammo: '5.56mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_M16A4_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_M16A4_C_h.png`,
    tier: 'B',
    description: 'Single/3-round burst 5.56mm rifle with high muzzle velocity for rapid tap-firing.',
    stats: {
      damage: 43,
      fireRate: 0.075,
      bulletSpeed: 900,
      effectiveRange: 420,
      magCapacity: 30,
      reloadTime: 2.2,
      verticalRecoilBase: 62,
      horizontalRecoilBase: 34,
      recoilRecovery: 72,
      spreadBase: 20,
    },
    supportedSlots: ['muzzle', 'magazine', 'stock', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Pro Competitive',
        attachments: {
          muzzle: 'comp_ar',
          magazine: 'ext_quick_ar',
          stock: 'tactical_stock',
          scope: 'scope_4x',
        },
        reason: 'Tactical stock + compensator makes M16A4 a rapid-tap DMR alternative.',
      },
    ],
  },
  {
    id: 'mk47',
    name: 'Mk47 Mutant',
    category: 'AR',
    ammo: '7.62mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_Mk47Mutant_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_Mk47Mutant_C_h.png`,
    tier: 'B',
    description: '2-round burst 7.62mm rifle delivering devastating punch when tapped accurately.',
    stats: {
      damage: 49,
      fireRate: 0.100,
      bulletSpeed: 780,
      effectiveRange: 380,
      magCapacity: 20,
      reloadTime: 2.4,
      verticalRecoilBase: 74,
      horizontalRecoilBase: 40,
      recoilRecovery: 62,
      spreadBase: 22,
    },
    supportedSlots: ['muzzle', 'grip', 'magazine', 'stock', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Pro Competitive',
        attachments: {
          muzzle: 'comp_ar',
          grip: 'light_grip',
          magazine: 'ext_quick_ar',
          stock: 'tactical_stock',
          scope: 'scope_4x',
        },
        reason: 'Light grip + tactical stock resets burst recoil almost instantly.',
      },
    ],
  },
  {
    id: 'famas',
    name: 'FAMAS',
    category: 'AR',
    ammo: '5.56mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_FAMASG2_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_FAMASG2_C_h.png`,
    tier: 'S',
    description: 'Ultra-fast 900 RPM crate bullpup rifle built to melt enemies in close-to-mid range.',
    stats: {
      damage: 39,
      fireRate: 0.067,
      bulletSpeed: 925,
      effectiveRange: 300,
      magCapacity: 30,
      reloadTime: 2.3,
      verticalRecoilBase: 66,
      horizontalRecoilBase: 46,
      recoilRecovery: 58,
      spreadBase: 28,
    },
    supportedSlots: ['muzzle', 'magazine', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Aggressive Close-Range',
        attachments: {
          muzzle: 'supp_ar',
          magazine: 'ext_quick_ar',
          scope: 'red_dot',
        },
        reason: 'Blistering RPM pairs with extended mag to wipe squads in seconds.',
      },
    ],
  },

  // ==================== SUBMACHINE GUNS (SMG) ====================
  {
    id: 'ump45',
    name: 'UMP45',
    category: 'SMG',
    ammo: '.45 ACP',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_UMP_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_UMP_C_h.png`,
    tier: 'S',
    description: 'The CQC limb-damage meta king. Very easy recoil management and ultra-dense bullet grouping.',
    stats: {
      damage: 41,
      fireRate: 0.092,
      bulletSpeed: 360,
      effectiveRange: 150,
      magCapacity: 25,
      reloadTime: 1.9,
      verticalRecoilBase: 35,
      horizontalRecoilBase: 22,
      recoilRecovery: 80,
      spreadBase: 15,
    },
    supportedSlots: ['muzzle', 'grip', 'magazine', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Aggressive Close-Range',
        attachments: {
          muzzle: 'comp_smg',
          grip: 'laser_sight',
          magazine: 'ext_quick_smg',
          scope: 'red_dot',
        },
        reason: 'Laser sight turns UMP45 into an unmatched hipfire shredder inside 20 meters.',
      },
    ],
  },
  {
    id: 'vector',
    name: 'Vector',
    category: 'SMG',
    ammo: '9mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_Vector_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_Vector_C_h.png`,
    tier: 'S',
    description: 'Extreme 1100+ RPM close-range bullet hose. Requires an extended mag to shine.',
    stats: {
      damage: 31,
      fireRate: 0.055,
      bulletSpeed: 350,
      effectiveRange: 120,
      magCapacity: 19,
      reloadTime: 1.8,
      verticalRecoilBase: 38,
      horizontalRecoilBase: 24,
      recoilRecovery: 82,
      spreadBase: 16,
    },
    supportedSlots: ['muzzle', 'grip', 'magazine', 'stock', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Aggressive Close-Range',
        attachments: {
          muzzle: 'comp_smg',
          grip: 'vert_grip',
          magazine: 'ext_quick_smg',
          stock: 'tactical_stock',
          scope: 'red_dot',
        },
        reason: 'Full 5-slot kit turns Vector into a zero-recoil CQC laser.',
      },
    ],
  },
  {
    id: 'uzi',
    name: 'Micro UZI',
    category: 'SMG',
    ammo: '9mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_UZI_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_UZI_C_h.png`,
    tier: 'A',
    description: 'Insane close-quarters fire rate with pinpoint hipfire accuracy.',
    stats: {
      damage: 26,
      fireRate: 0.048,
      bulletSpeed: 350,
      effectiveRange: 100,
      magCapacity: 25,
      reloadTime: 1.8,
      verticalRecoilBase: 34,
      horizontalRecoilBase: 26,
      recoilRecovery: 84,
      spreadBase: 14,
    },
    supportedSlots: ['muzzle', 'magazine', 'stock', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Aggressive Close-Range',
        attachments: {
          muzzle: 'comp_smg',
          magazine: 'ext_quick_smg',
          stock: 'uzi_stock',
          scope: 'red_dot',
        },
        reason: 'UZI Stock + Extended QuickDraw is essential for melting rushing enemies.',
      },
    ],
  },
  {
    id: 'bizon',
    name: 'PP-19 Bizon',
    category: 'SMG',
    ammo: '9mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_BizonPP19_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_BizonPP19_C_h.png`,
    tier: 'B',
    description: 'Built-in 53-round helical magazine with very smooth, beginner-friendly recoil.',
    stats: {
      damage: 35,
      fireRate: 0.086,
      bulletSpeed: 408,
      effectiveRange: 160,
      magCapacity: 53,
      reloadTime: 2.5,
      verticalRecoilBase: 32,
      horizontalRecoilBase: 20,
      recoilRecovery: 80,
      spreadBase: 18,
    },
    supportedSlots: ['muzzle', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Aggressive Close-Range',
        attachments: {
          muzzle: 'comp_smg',
          scope: 'red_dot',
        },
        reason: 'Massive 53-round capacity needs only a compensator and optic.',
      },
    ],
  },
  {
    id: 'thompson',
    name: 'Tommy Gun',
    category: 'SMG',
    ammo: '.45 ACP',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_Thompson_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_Thompson_C_h.png`,
    tier: 'B',
    description: 'High-capacity .45 ACP submachine gun with 50-round drum potential.',
    stats: {
      damage: 40,
      fireRate: 0.086,
      bulletSpeed: 280,
      effectiveRange: 130,
      magCapacity: 30,
      reloadTime: 2.2,
      verticalRecoilBase: 44,
      horizontalRecoilBase: 30,
      recoilRecovery: 72,
      spreadBase: 20,
    },
    supportedSlots: ['muzzle', 'grip', 'magazine', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Aggressive Close-Range',
        attachments: {
          muzzle: 'supp_smg',
          grip: 'vert_grip',
          magazine: 'ext_quick_smg',
          scope: 'red_dot',
        },
        reason: 'Vertical grip + 50r extended drum shreds squads in hot drops.',
      },
    ],
  },
  {
    id: 'mp5k',
    name: 'MP5K',
    category: 'SMG',
    ammo: '9mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_MP5K_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_MP5K_C_h.png`,
    tier: 'A',
    description: 'All-attachment 9mm SMG with surgical accuracy and controllable recoil.',
    stats: {
      damage: 33,
      fireRate: 0.067,
      bulletSpeed: 400,
      effectiveRange: 160,
      magCapacity: 30,
      reloadTime: 2.0,
      verticalRecoilBase: 36,
      horizontalRecoilBase: 22,
      recoilRecovery: 78,
      spreadBase: 16,
    },
    supportedSlots: ['muzzle', 'grip', 'magazine', 'stock', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Pro Competitive',
        attachments: {
          muzzle: 'comp_smg',
          grip: 'half_grip',
          magazine: 'ext_quick_smg',
          stock: 'tactical_stock',
          scope: 'red_dot',
        },
        reason: 'Tactical stock + compensator makes MP5K a mid-range beam.',
      },
    ],
  },
  {
    id: 'p90',
    name: 'P90',
    category: 'SMG',
    ammo: '5.7mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_P90_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_P90_C_h.png`,
    tier: 'S',
    description: 'Crate-exclusive 50-round 5.7mm SMG with built-in optic and near-zero recoil.',
    stats: {
      damage: 35,
      fireRate: 0.060,
      bulletSpeed: 715,
      effectiveRange: 250,
      magCapacity: 50,
      reloadTime: 2.3,
      verticalRecoilBase: 28,
      horizontalRecoilBase: 18,
      recoilRecovery: 88,
      spreadBase: 12,
    },
    supportedSlots: [],
    recommendedLoadouts: [
      {
        playstyle: 'Pro Competitive',
        attachments: {},
        reason: 'Comes pre-equipped from air drops with integrated suppressor, laser, and 50r mag.',
      },
    ],
  },
  {
    id: 'mp9',
    name: 'MP9',
    category: 'SMG',
    ammo: '9mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_MP9_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_MP9_C_h.png`,
    tier: 'A',
    description: 'Fast-handling Deston SMG with integrated suppressor and laser sight.',
    stats: {
      damage: 31,
      fireRate: 0.060,
      bulletSpeed: 400,
      effectiveRange: 140,
      magCapacity: 30,
      reloadTime: 1.9,
      verticalRecoilBase: 32,
      horizontalRecoilBase: 20,
      recoilRecovery: 82,
      spreadBase: 15,
    },
    supportedSlots: ['magazine', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Aggressive Close-Range',
        attachments: {
          magazine: 'ext_quick_smg',
          scope: 'red_dot',
        },
        reason: 'Integrated suppressor & laser make it lethal out of the box.',
      },
    ],
  },

  // ==================== MARKSMAN RIFLES (DMR) ====================
  {
    id: 'slr',
    name: 'SLR',
    category: 'DMR',
    ammo: '7.62mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_FNFal_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_FNFAL_C_h.png`,
    tier: 'A',
    description: 'Hard-hitting semi-automatic Marksman rifle. Massive damage payoff for skilled tap-shooters.',
    stats: {
      damage: 58,
      fireRate: 0.100,
      bulletSpeed: 840,
      effectiveRange: 500,
      magCapacity: 10,
      reloadTime: 2.8,
      verticalRecoilBase: 88,
      horizontalRecoilBase: 38,
      recoilRecovery: 55,
      spreadBase: 12,
    },
    supportedSlots: ['muzzle', 'magazine', 'stock', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Pro Competitive',
        attachments: {
          muzzle: 'comp_ar',
          magazine: 'ext_quick_ar',
          stock: 'cheek_pad',
          scope: 'scope_6x',
        },
        reason: 'Compensator + Cheek Pad cushions violent upward shock between rapid taps.',
      },
    ],
  },
  {
    id: 'sks',
    name: 'SKS',
    category: 'DMR',
    ammo: '7.62mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_SKS_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_SKS_C_h.png`,
    tier: 'A',
    description: 'Modular 7.62mm DMR accepting a foregrip and cheek pad for smooth follow-up shots.',
    stats: {
      damage: 53,
      fireRate: 0.090,
      bulletSpeed: 800,
      effectiveRange: 480,
      magCapacity: 10,
      reloadTime: 2.7,
      verticalRecoilBase: 80,
      horizontalRecoilBase: 36,
      recoilRecovery: 60,
      spreadBase: 14,
    },
    supportedSlots: ['muzzle', 'grip', 'magazine', 'stock', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Pro Competitive',
        attachments: {
          muzzle: 'comp_ar',
          grip: 'light_grip',
          magazine: 'ext_quick_ar',
          stock: 'cheek_pad',
          scope: 'scope_6x',
        },
        reason: 'Light Grip + Cheek Pad recovers the crosshair cleanly after every single tap.',
      },
    ],
  },
  {
    id: 'mini14',
    name: 'Mini 14',
    category: 'DMR',
    ammo: '5.56mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_Mini14_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_Mini14_C_h.png`,
    tier: 'S',
    description: 'Esports favorite 5.56mm DMR with 990 m/s bullet speed and 20-round base magazine.',
    stats: {
      damage: 48,
      fireRate: 0.100,
      bulletSpeed: 990,
      effectiveRange: 550,
      magCapacity: 20,
      reloadTime: 2.5,
      verticalRecoilBase: 60,
      horizontalRecoilBase: 28,
      recoilRecovery: 70,
      spreadBase: 10,
    },
    supportedSlots: ['muzzle', 'magazine', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Pro Competitive',
        attachments: {
          muzzle: 'comp_ar',
          magazine: 'ext_quick_ar',
          scope: 'scope_6x',
        },
        reason: 'Fastest bullet travel speed in class makes leading moving targets effortless.',
      },
    ],
  },
  {
    id: 'mk14',
    name: 'Mk14',
    category: 'DMR',
    ammo: '7.62mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_Mk14_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_Mk14_C_h.png`,
    tier: 'S',
    description: 'Crate-exclusive 7.62mm DMR with full-auto capability and devastating 61 damage.',
    stats: {
      damage: 61,
      fireRate: 0.090,
      bulletSpeed: 853,
      effectiveRange: 520,
      magCapacity: 10,
      reloadTime: 2.9,
      verticalRecoilBase: 92,
      horizontalRecoilBase: 44,
      recoilRecovery: 50,
      spreadBase: 14,
    },
    supportedSlots: ['muzzle', 'magazine', 'stock', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Aggressive Close-Range',
        attachments: {
          muzzle: 'comp_ar',
          magazine: 'ext_quick_ar',
          stock: 'cheek_pad',
          scope: 'red_dot',
        },
        reason: 'Full-auto Mk14 deletes Level 3 vests faster than any gun in PUBG Mobile.',
      },
    ],
  },
  {
    id: 'mk12',
    name: 'Mk12',
    category: 'DMR',
    ammo: '5.56mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_Mk12_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_Mk12_C_h.png`,
    tier: 'S',
    description: 'Bipod-equipped 5.56mm DMR with foregrip slot and ultra-low tap recoil.',
    stats: {
      damage: 50,
      fireRate: 0.100,
      bulletSpeed: 930,
      effectiveRange: 520,
      magCapacity: 20,
      reloadTime: 2.5,
      verticalRecoilBase: 54,
      horizontalRecoilBase: 26,
      recoilRecovery: 74,
      spreadBase: 10,
    },
    supportedSlots: ['muzzle', 'grip', 'magazine', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Pro Competitive',
        attachments: {
          muzzle: 'comp_ar',
          grip: 'light_grip',
          magazine: 'ext_quick_ar',
          scope: 'scope_6x',
        },
        reason: 'Light grip + compensator gives practically zero reticle bounce on rapid taps.',
      },
    ],
  },
  {
    id: 'qbu',
    name: 'QBU',
    category: 'DMR',
    ammo: '5.56mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_QBU88_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_QBU88_C_h.png`,
    tier: 'A',
    description: 'Sanhok bullpup 5.56mm DMR with bipod stability and crisp velocity.',
    stats: {
      damage: 48,
      fireRate: 0.100,
      bulletSpeed: 945,
      effectiveRange: 520,
      magCapacity: 10,
      reloadTime: 2.6,
      verticalRecoilBase: 58,
      horizontalRecoilBase: 28,
      recoilRecovery: 68,
      spreadBase: 11,
    },
    supportedSlots: ['muzzle', 'magazine', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Pro Competitive',
        attachments: {
          muzzle: 'supp_ar',
          magazine: 'ext_quick_ar',
          scope: 'scope_4x',
        },
        reason: 'Silent jungle sniping with fast 5.56mm velocity.',
      },
    ],
  },
  {
    id: 'vss',
    name: 'VSS',
    category: 'DMR',
    ammo: '9mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_VSS_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_VSS_C_h.png`,
    tier: 'B',
    description: 'Integrally suppressed 9mm full-auto DMR with built-in 4x optic.',
    stats: {
      damage: 43,
      fireRate: 0.086,
      bulletSpeed: 330,
      effectiveRange: 250,
      magCapacity: 10,
      reloadTime: 2.3,
      verticalRecoilBase: 40,
      horizontalRecoilBase: 22,
      recoilRecovery: 76,
      spreadBase: 16,
    },
    supportedSlots: ['magazine'],
    recommendedLoadouts: [
      {
        playstyle: 'Aggressive Close-Range',
        attachments: {},
        reason: 'Built-in suppressor and 4x scope make stealth ambushes deadly.',
      },
    ],
  },
  {
    id: 'dragunov',
    name: 'Dragunov',
    category: 'DMR',
    ammo: '7.62mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_Dragunov_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_Dragunov_C_h.png`,
    tier: 'A',
    description: 'High-caliber 7.62mm DMR capable of devastating headshot damage.',
    stats: {
      damage: 60,
      fireRate: 0.140,
      bulletSpeed: 830,
      effectiveRange: 520,
      magCapacity: 10,
      reloadTime: 2.8,
      verticalRecoilBase: 86,
      horizontalRecoilBase: 36,
      recoilRecovery: 56,
      spreadBase: 12,
    },
    supportedSlots: ['muzzle', 'magazine', 'stock', 'scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Pro Competitive',
        attachments: {
          muzzle: 'comp_ar',
          magazine: 'ext_quick_ar',
          stock: 'cheek_pad',
          scope: 'scope_6x',
        },
        reason: 'Cheek pad + compensator helps reset between heavy-caliber taps.',
      },
    ],
  },

  // ==================== LIGHT MACHINE GUNS (LMG) ====================
  {
    id: 'm249',
    name: 'M249',
    category: 'LMG',
    ammo: '5.56mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_M249_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_M249_C_h.png`,
    tier: 'A',
    description: '75-round 5.56mm squad suppressor ideal for vehicle destruction and sustained fire.',
    stats: {
      damage: 40,
      fireRate: 0.075,
      bulletSpeed: 915,
      effectiveRange: 380,
      magCapacity: 75,
      reloadTime: 4.8,
      verticalRecoilBase: 64,
      horizontalRecoilBase: 40,
      recoilRecovery: 58,
      spreadBase: 28,
    },
    supportedSlots: ['scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Mid-Range Spray',
        attachments: {
          scope: 'red_dot',
        },
        reason: '75-round box shreds vehicles and suppresses entire squads.',
      },
    ],
  },
  {
    id: 'dp28',
    name: 'DP-28',
    category: 'LMG',
    ammo: '7.62mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_DP28_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_DP28_C_h.png`,
    tier: 'A',
    description: '47-round 7.62mm pan-mag LMG famous for ultra-stable prone & crouch sprays.',
    stats: {
      damage: 51,
      fireRate: 0.109,
      bulletSpeed: 715,
      effectiveRange: 400,
      magCapacity: 47,
      reloadTime: 4.5,
      verticalRecoilBase: 54,
      horizontalRecoilBase: 30,
      recoilRecovery: 64,
      spreadBase: 22,
    },
    supportedSlots: ['scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Mid-Range Spray',
        attachments: {
          scope: 'scope_4x',
        },
        reason: 'Low horizontal wobble lets you beam moving vehicles at 150m with a 4x.',
      },
    ],
  },
  {
    id: 'mg3',
    name: 'MG3',
    category: 'LMG',
    ammo: '7.62mm',
    image: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_MG3_C.png`,
    showcaseImage: `${PUBGM_WEAPON_ASSET_BASE}/Item_Weapon_MG3_C_h.png`,
    tier: 'S',
    description: 'Crate-exclusive 75-round 7.62mm LMG with selectable 660/990 RPM fire modes.',
    stats: {
      damage: 42,
      fireRate: 0.061,
      bulletSpeed: 820,
      effectiveRange: 400,
      magCapacity: 75,
      reloadTime: 4.6,
      verticalRecoilBase: 68,
      horizontalRecoilBase: 42,
      recoilRecovery: 56,
      spreadBase: 24,
    },
    supportedSlots: ['scope'],
    recommendedLoadouts: [
      {
        playstyle: 'Aggressive Close-Range',
        attachments: {
          scope: 'red_dot',
        },
        reason: '990 RPM mode melts enemies and vehicles faster than almost any weapon.',
      },
    ],
  },
];
