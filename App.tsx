import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LayoutDashboard, Zap, ChevronRight, Activity, TrendingUp, TrendingDown, User, LogOut, Shield, Menu, X } from 'lucide-react-native';
import { WEAPONS_DATA, ATTACHMENTS, Weapon, Attachment, AttachmentSlot, WeaponNerfBuffAdjustment } from './src/data/weapons';
import { calculateRecoilSimulation } from './src/utils/recoilEngine';
import { syncAndFetchProjectAssets } from './src/utils/assetDatabaseService';
import { RecoilPatternView } from './src/components/RecoilPatternView';
import { AttachmentSelector } from './src/components/AttachmentSelector';
import { WeaponVisualDisplay } from './src/components/WeaponVisualDisplay';
import { WeaponCardItem } from './src/components/WeaponCardItem';
import { DashboardScreen } from './src/components/DashboardScreen';
import { SignInScreen } from './src/components/SignInScreen';
import { AdminManagementScreen } from './src/components/AdminManagementScreen';
import { UserProfile, getStoredUserProfile, clearUserProfile } from './src/utils/authService';
import { colors } from './src/theme';

const PUBG_LANDING_BACKGROUND_URL =
  'https://club.jollymax.com/wp-content/uploads/2025/08/14-2.webp';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'ARMORY' | 'DASHBOARD' | 'ADMIN'>('ARMORY');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showSignInModal, setShowSignInModal] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [weaponsList, setWeaponsList] = useState<Weapon[]>(WEAPONS_DATA);
  const [attachmentsMap, setAttachmentsMap] = useState<Record<string, Attachment>>(ATTACHMENTS);
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon>(WEAPONS_DATA[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedAttachments, setSelectedAttachments] = useState<
    Partial<Record<AttachmentSlot, string>>
  >({
    muzzle: 'comp_ar',
    grip: 'vert_grip',
    magazine: 'ext_quick_ar',
    stock: 'tactical_stock',
    scope: 'scope_3x',
  });

  // Track gun interaction / click analytics
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({
    m416: 42,
    m762: 28,
    akm: 19,
    ump45: 23,
    slr: 14,
    awm: 31,
  });

  // Global map of custom developer Nerf/Buff adjustments per gun
  const [nerfBuffMap, setNerfBuffMap] = useState<Record<string, WeaponNerfBuffAdjustment>>({});

  // Load existing signed-in profile and sync/fetch PUBG assets from Firestore
  useEffect(() => {
    async function loadAppInit() {
      const [stored, dbAssets] = await Promise.all([
        getStoredUserProfile(),
        syncAndFetchProjectAssets(),
      ]);
      if (stored) {
        setUserProfile(stored);
      }
      if (dbAssets.weapons.length > 0) {
        setWeaponsList(dbAssets.weapons);
        setAttachmentsMap(dbAssets.attachments);
        setSelectedWeapon((prev) =>
          dbAssets.weapons.find((w) => w.id === prev.id) || dbAssets.weapons[0]
        );
      }
      setIsAuthLoading(false);
    }
    loadAppInit();
  }, []);

  const handleSignOut = () => {
    const doLogout = async () => {
      await clearUserProfile();
      setUserProfile(null);
      setCurrentScreen('ARMORY');
      setShowSignInModal(true);
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Sign out from ${userProfile?.inGameName || 'account'}?`);
      if (confirmed) {
        doLogout();
      }
      return;
    }

    Alert.alert(
      'Sign Out Operator',
      `Sign out from ${userProfile?.inGameName || 'account'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: doLogout,
        },
      ]
    );
  };

  const categories = ['ALL', 'AR', 'SMG', 'DMR', 'LMG'];

  const filteredWeapons =
    selectedCategory === 'ALL'
      ? weaponsList
      : weaponsList.filter((w) => w.category === selectedCategory);

  const handleSelectWeapon = (w: Weapon) => {
    setSelectedWeapon(w);
    // Increment click analytics for this gun
    setClickCounts((prev) => ({
      ...prev,
      [w.id]: (prev[w.id] || 0) + 1,
    }));

    // Apply primary meta preset
    if (w.recommendedLoadouts.length > 0) {
      setSelectedAttachments({ ...w.recommendedLoadouts[0].attachments });
    } else {
      setSelectedAttachments({});
    }
  };

  const handleAttachmentChange = (slot: AttachmentSlot, id: string | null) => {
    setSelectedAttachments((prev) => {
      const updated = { ...prev };
      if (!id) delete updated[slot];
      else updated[slot] = id;
      return updated;
    });
  };

  const handleApplyPreset = (preset: Partial<Record<AttachmentSlot, string>>) => {
    setSelectedAttachments({ ...preset });
  };

  const handleUpdateNerfBuff = (weaponId: string, adjustment: WeaponNerfBuffAdjustment) => {
    setNerfBuffMap((prev) => ({
      ...prev,
      [weaponId]: adjustment,
    }));
  };

  const handleResetNerfBuff = (weaponId: string) => {
    setNerfBuffMap((prev) => {
      const updated = { ...prev };
      delete updated[weaponId];
      return updated;
    });
  };

  // Dynamic physics calculation with Nerf/Buff adjustment applied in real time
  const activeNerfBuff = nerfBuffMap[selectedWeapon.id];
  const recoilAnalysis = calculateRecoilSimulation(
    selectedWeapon,
    selectedAttachments,
    activeNerfBuff
  );

  // If on Dashboard screen, render DashboardScreen
  if (currentScreen === 'DASHBOARD') {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom', 'left', 'right']}>
          <StatusBar style="light" />
          <DashboardScreen
            onBackToArmory={() => setCurrentScreen('ARMORY')}
            onSelectWeapon={(w) => handleSelectWeapon(w)}
            clickCounts={clickCounts}
            nerfBuffMap={nerfBuffMap}
            onUpdateNerfBuff={handleUpdateNerfBuff}
            onResetNerfBuff={handleResetNerfBuff}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // If on Admin Management screen, render AdminManagementScreen (admin only)
  if (currentScreen === 'ADMIN' && userProfile?.role === 'admin') {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom', 'left', 'right']}>
          <StatusBar style="light" />
          <AdminManagementScreen
            onBack={() => setCurrentScreen('ARMORY')}
            currentUser={userProfile}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar style="light" />

        {/* PUBG Battlegrounds Background Wallpaper with Tactical Dark Overlay */}
        <ImageBackground
          source={{ uri: PUBG_LANDING_BACKGROUND_URL }}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.backdropOverlay}>
            {/* Top Header Navigation */}
            <View style={styles.navbar}>
              <View style={styles.brandRow}>
                <View style={styles.brandBadge}>
                  <Text style={styles.brandBadgeText}>PUBG</Text>
                </View>
                <View style={styles.brandTextGroup}>
                  <Text style={styles.navTitle} numberOfLines={1} ellipsizeMode="tail">
                    GUNLAB PLATFORM
                  </Text>
                  <Text style={styles.navSubtitle} numberOfLines={1} ellipsizeMode="tail">
                    ATTACHMENT & LIVE RECOIL LAB
                  </Text>
                </View>
              </View>

              {/* Right Controls: Operator Badge + Hamburger Menu */}
              <View style={styles.navRightGroup}>
                {userProfile ? (
                  <View style={styles.operatorBadge}>
                    <View style={styles.operatorDot} />
                    <View style={styles.operatorTextGroup}>
                      <Text style={styles.operatorIGN} numberOfLines={1} ellipsizeMode="tail">
                        {userProfile.inGameName}
                      </Text>
                      <Text style={styles.operatorSub} numberOfLines={1} ellipsizeMode="tail">
                        {userProfile.firstName} ({userProfile.gender[0]}, {userProfile.age})
                      </Text>
                    </View>
                  </View>
                ) : (
                <TouchableOpacity
                  style={styles.signInBtn}
                  onPress={() => setShowSignInModal(true)}
                  activeOpacity={0.8}
                >
                  <User size={13} color="#0F172A" />
                  <Text style={styles.signInBtnText}>SIGN IN</Text>
                </TouchableOpacity>
              )}

              {/* Hamburger Menu Toggle Button */}
              <TouchableOpacity
                style={[styles.hamburgerBtn, isMenuOpen && styles.hamburgerBtnActive]}
                onPress={() => setIsMenuOpen((prev) => !prev)}
                activeOpacity={0.8}
              >
                {isMenuOpen ? (
                  <X size={18} color="#F59E0B" />
                ) : (
                  <Menu size={18} color="#F8FAFC" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Unified Dropdown Menu for Dashboard, Admin, and Logout */}
          {isMenuOpen && (
            <View style={styles.menuDropdown}>
              {/* Option 1: Armory */}
              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemActive]}
                onPress={() => {
                  setCurrentScreen('ARMORY');
                  setIsMenuOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Zap size={15} color="#F59E0B" />
                <Text style={[styles.menuItemText, styles.menuItemTextActive]}>
                  Armory & Recoil Lab
                </Text>
              </TouchableOpacity>

              {/* Option 2: Dashboard */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setCurrentScreen('DASHBOARD');
                  setIsMenuOpen(false);
                }}
                activeOpacity={0.7}
              >
                <LayoutDashboard size={15} color="#94A3B8" />
                <Text style={styles.menuItemText}>
                  Telemetry Dashboard
                </Text>
              </TouchableOpacity>

              {/* Option 3: Admin Console (Only visible when logged in as Admin) */}
              {userProfile?.role === 'admin' && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setCurrentScreen('ADMIN');
                    setIsMenuOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Shield size={15} color="#94A3B8" />
                  <View style={styles.menuItemRow}>
                    <Text style={styles.menuItemText}>
                      Admin Account Console
                    </Text>
                    <View style={styles.adminMiniPill}>
                      <Text style={styles.adminMiniPillText}>ADMIN</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              <View style={styles.menuDivider} />

              {/* Option 4: Logout / Sign In */}
              {userProfile ? (
                <TouchableOpacity
                  style={[styles.menuItem, styles.menuItemLogout]}
                  onPress={() => {
                    setIsMenuOpen(false);
                    handleSignOut();
                  }}
                  activeOpacity={0.7}
                >
                  <LogOut size={15} color="#EF4444" />
                  <Text style={[styles.menuItemText, { color: '#EF4444', fontWeight: '800' }]}>
                    Log Out ({userProfile.inGameName})
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setIsMenuOpen(false);
                    setShowSignInModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <User size={15} color="#F59E0B" />
                  <Text style={[styles.menuItemText, { color: '#F59E0B', fontWeight: '800' }]}>
                    Sign In / Register
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <ScrollView style={styles.mainScroll} contentContainerStyle={styles.scrollContent}>
            {/* Hero Section with Quick Dashboard Banner */}
            <View style={styles.heroBanner}>
              <View style={styles.heroRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroTag}>ARMORY & BALLISTIC BENCHMARK</Text>
                  <Text style={styles.heroHeading}>Select Gun & Attachments</Text>
                  <Text style={styles.heroSub}>
                    Every attachment change or developer nerf/buff updates ballistics and recoil in real time.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.heroDashAction}
                  onPress={() => setCurrentScreen('DASHBOARD')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.heroDashActionText}>View Clicks & Nerf/Buff Workshop</Text>
                  <ChevronRight size={13} color="#38BDF8" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Category Filter Tabs */}
            <View style={styles.categoryRow}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    selectedCategory === cat && styles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      selectedCategory === cat && styles.categoryButtonTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Weapon Selection Carousel with White Frosted Blur Cards */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.weaponScroll}
            >
              {filteredWeapons.map((wp) => (
                <WeaponCardItem
                  key={wp.id}
                  weapon={wp}
                  isSelected={wp.id === selectedWeapon.id}
                  onSelect={handleSelectWeapon}
                  nerfBuffAdjustment={nerfBuffMap[wp.id]}
                />
              ))}
            </ScrollView>

            {/* Custom Mod Alert if Nerfed/Buffed */}
            {activeNerfBuff && (
              (() => {
                const isBuff =
                  activeNerfBuff.damageDelta > 0 ||
                  activeNerfBuff.fireRatePercent > 0 ||
                  activeNerfBuff.recoilPercent < 0 ||
                  activeNerfBuff.adsSpeedPercent > 0;
                return (
                  <View style={[styles.activeModBanner, isBuff ? styles.activeModBannerBuff : styles.activeModBannerNerf]}>
                    <View style={styles.activeModBadge}>
                      {isBuff ? (
                        <TrendingUp size={12} color="#10B981" strokeWidth={3} />
                      ) : (
                        <TrendingDown size={12} color="#EF4444" strokeWidth={3} />
                      )}
                      <Text style={[styles.activeModBadgeText, isBuff ? styles.activeModBadgeBuffText : styles.activeModBadgeNerfText]}>
                        {isBuff ? 'BUFFED' : 'NERFED'}
                      </Text>
                    </View>
                    <Text style={styles.activeModBannerText}>
                      DMG {activeNerfBuff.damageDelta >= 0 ? `+${activeNerfBuff.damageDelta}` : activeNerfBuff.damageDelta} | FIRE {activeNerfBuff.fireRatePercent >= 0 ? `+${activeNerfBuff.fireRatePercent}` : activeNerfBuff.fireRatePercent}% | RECOIL {activeNerfBuff.recoilPercent >= 0 ? `+${activeNerfBuff.recoilPercent}` : activeNerfBuff.recoilPercent}% | ADS {activeNerfBuff.adsSpeedPercent >= 0 ? `+${activeNerfBuff.adsSpeedPercent}` : activeNerfBuff.adsSpeedPercent}%
                    </Text>
                    <TouchableOpacity
                      style={styles.activeModResetBtn}
                      onPress={() => handleResetNerfBuff(selectedWeapon.id)}
                    >
                      <Text style={styles.activeModReset}>Reset</Text>
                    </TouchableOpacity>
                  </View>
                );
              })()
            )}

            {/* Weapon Showcase Card With LIVE ANALYSIS DIRECTLY UNDER THE GUN */}
            <WeaponVisualDisplay
              weapon={selectedWeapon}
              selectedAttachments={selectedAttachments}
              recoilAnalysis={recoilAnalysis}
              attachmentsMap={attachmentsMap}
            />

            {/* Interactive Recoil 25-Shot Spray Canvas Plot */}
            <RecoilPatternView
              analysis={recoilAnalysis}
              weaponName={selectedWeapon.name}
            />

            {/* Attachment Customizer & Recommendations (Modifies live analysis above) */}
            <AttachmentSelector
              weapon={selectedWeapon}
              selectedAttachments={selectedAttachments}
              attachmentsMap={attachmentsMap}
              onSelectAttachment={handleAttachmentChange}
              onApplyPreset={handleApplyPreset}
            />
          </ScrollView>
        </View>
      </ImageBackground>

      {/* Modal for Sign In Screen */}
      <Modal
        visible={showSignInModal || (!userProfile && !isAuthLoading)}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#020617' }} edges={['top', 'bottom', 'left', 'right']}>
          <StatusBar style="light" />
          <SignInScreen
            onSignInSuccess={(profile) => {
              setUserProfile(profile);
              setShowSignInModal(false);
              if (profile.role === 'admin') {
                setCurrentScreen('ADMIN');
              } else {
                setCurrentScreen('ARMORY');
              }
            }}
          />
        </SafeAreaView>
      </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backdropOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.84)',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  brandRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  brandBadge: {
    backgroundColor: colors.amber,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
    flexShrink: 0,
  },
  brandBadgeText: {
    color: colors.bg,
    fontWeight: '900',
    fontSize: 11,
  },
  navTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.6,
  },
  navSubtitle: {
    color: colors.textMuted,
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  hamburgerBtn: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerBtnActive: {
    backgroundColor: colors.amberTint,
    borderColor: colors.amber,
  },
  menuDropdown: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 99,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 10,
  },
  menuItemActive: {
    backgroundColor: colors.amberTint,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  menuItemText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  menuItemTextActive: {
    color: colors.amber,
    fontWeight: '900',
  },
  adminMiniPill: {
    backgroundColor: colors.amberTint,
    borderColor: colors.amberBorder,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  adminMiniPillText: {
    color: colors.amber,
    fontSize: 9,
    fontWeight: '900',
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
  },
  menuItemLogout: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  navRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  operatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  operatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
    maxWidth: 125,
  },
  operatorTextGroup: {
    flexShrink: 1,
    minWidth: 0,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  signOutText: {
    color: colors.danger,
    fontSize: 10,
    fontWeight: '800',
  },
  operatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  operatorIGN: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  operatorSub: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '600',
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.amber,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  signInBtnText: {
    color: colors.bg,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  navAdminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  navAdminText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
  },
  navDashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  navDashboardText: {
    color: '#020617',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroBanner: {
    marginBottom: 16,
  },
  heroRow: {
    flexDirection: 'column',
    gap: 10,
  },
  heroTag: {
    color: colors.amber,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  heroHeading: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroSub: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  heroDashAction: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.cyanTint,
    borderColor: colors.cyan,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroDashActionText: {
    color: colors.cyan,
    fontSize: 11,
    fontWeight: '700',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  categoryButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryButtonActive: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  categoryButtonText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  categoryButtonTextActive: {
    color: colors.bg,
  },
  weaponScroll: {
    paddingBottom: 16,
  },
  activeModBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
    gap: 8,
  },
  activeModBannerBuff: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderColor: '#10B981',
  },
  activeModBannerNerf: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderColor: '#EF4444',
  },
  activeModBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  activeModBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  activeModBadgeBuffText: {
    color: '#10B981',
  },
  activeModBadgeNerfText: {
    color: '#EF4444',
  },
  activeModBannerText: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: '700',
    flex: 1,
  },
  activeModResetBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeModReset: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
  },
});
