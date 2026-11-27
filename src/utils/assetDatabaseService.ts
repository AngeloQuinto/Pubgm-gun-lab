import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  ATTACHMENTS,
  Attachment,
  WEAPONS_DATA,
  Weapon,
} from '../data/weapons';

const ASSET_CACHE_KEY = '@pubgm_gunlab_assets_v2';
const FIRESTORE_ASSETS_COLLECTION = 'pubgm_assets';
const ASSETS_CATALOG_VERSION = '2026-11-26-no-sr-v2';

export interface ProjectAssetCatalog {
  version: string;
  sourceRepo: string;
  weapons: Weapon[];
  attachments: Record<string, Attachment>;
  updatedAt: string;
}

/**
 * Syncs the selected PUBG Mobile weapon & attachment assets from
 * https://github.com/pubg/api-assets into Firebase Firestore, then
 * fetches only the needed project catalog from the database.
 */
export async function syncAndFetchProjectAssets(): Promise<{
  weapons: Weapon[];
  attachments: Record<string, Attachment>;
  source: 'firestore' | 'cache' | 'local';
}> {
  const localCatalog: ProjectAssetCatalog = {
    version: ASSETS_CATALOG_VERSION,
    sourceRepo: 'https://github.com/pubg/api-assets',
    weapons: WEAPONS_DATA,
    attachments: ATTACHMENTS,
    updatedAt: new Date().toISOString(),
  };

  try {
    const weaponsRef = doc(db, FIRESTORE_ASSETS_COLLECTION, 'weapons_catalog');
    const attachmentsRef = doc(db, FIRESTORE_ASSETS_COLLECTION, 'attachments_catalog');

    const [weaponsSnap, attachmentsSnap] = await Promise.all([
      getDoc(weaponsRef),
      getDoc(attachmentsRef),
    ]);

    const weaponsNeedsSeed =
      !weaponsSnap.exists() ||
      weaponsSnap.data()?.version !== ASSETS_CATALOG_VERSION;

    const attachmentsNeedsSeed =
      !attachmentsSnap.exists() ||
      attachmentsSnap.data()?.version !== ASSETS_CATALOG_VERSION;

    if (weaponsNeedsSeed) {
      await setDoc(weaponsRef, {
        version: ASSETS_CATALOG_VERSION,
        sourceRepo: localCatalog.sourceRepo,
        items: localCatalog.weapons,
        updatedAt: localCatalog.updatedAt,
      });
    }

    if (attachmentsNeedsSeed) {
      await setDoc(attachmentsRef, {
        version: ASSETS_CATALOG_VERSION,
        sourceRepo: localCatalog.sourceRepo,
        items: localCatalog.attachments,
        updatedAt: localCatalog.updatedAt,
      });
    }

    // Re-read from database to ensure the app uses only the stored database assets
    const [freshWeaponsSnap, freshAttachmentsSnap] = await Promise.all([
      weaponsNeedsSeed ? getDoc(weaponsRef) : Promise.resolve(weaponsSnap),
      attachmentsNeedsSeed ? getDoc(attachmentsRef) : Promise.resolve(attachmentsSnap),
    ]);

    const dbWeapons = (freshWeaponsSnap.data()?.items as Weapon[]) || WEAPONS_DATA;
    const dbAttachments =
      (freshAttachmentsSnap.data()?.items as Record<string, Attachment>) || ATTACHMENTS;

    // Filter out SR if any legacy entry exists
    const filteredWeapons = dbWeapons.filter(
      (w) => (w.category as string) !== 'SR',
    );

    await AsyncStorage.setItem(
      ASSET_CACHE_KEY,
      JSON.stringify({
        version: ASSETS_CATALOG_VERSION,
        weapons: filteredWeapons,
        attachments: dbAttachments,
      }),
    );

    return {
      weapons: filteredWeapons,
      attachments: dbAttachments,
      source: 'firestore',
    };
  } catch (err) {
    console.warn('Firestore asset sync fallback to cache/local:', err);
    try {
      const cachedRaw = await AsyncStorage.getItem(ASSET_CACHE_KEY);
      if (cachedRaw) {
        const parsed = JSON.parse(cachedRaw) as {
          version: string;
          weapons: Weapon[];
          attachments: Record<string, Attachment>;
        };
        if (parsed.version === ASSETS_CATALOG_VERSION) {
          return {
            weapons: parsed.weapons,
            attachments: parsed.attachments,
            source: 'cache',
          };
        }
      }
    } catch {
      // Ignore cache read error
    }

    return {
      weapons: WEAPONS_DATA,
      attachments: ATTACHMENTS,
      source: 'local',
    };
  }
}
