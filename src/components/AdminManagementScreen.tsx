import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Shield,
  Users,
  Search,
  UserCheck,
  UserX,
  Trash2,
  ArrowLeft,
  RefreshCw,
  Crown,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react-native';
import { colors } from '../theme';
import {
  UserProfile,
  fetchAllOperators,
  subscribeToOperators,
  updateOperatorRole,
  toggleOperatorStatus,
  deleteOperator,
} from '../utils/authService';

interface Props {
  onBack: () => void;
  currentUser: UserProfile | null;
}

export const AdminManagementScreen: React.FC<Props> = ({ onBack, currentUser }) => {
  const [operators, setOperators] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'admin' | 'operator'>('ALL');

  useEffect(() => {
    // Subscribe to real-time updates from Firestore
    const unsubscribe = subscribeToOperators((data) => {
      setOperators(data);
      setLoading(false);
    });

    // Initial fetch in case snapshot takes a second
    fetchAllOperators().then((res) => {
      if (res.length > 0) setOperators(res);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleToggleRole = (user: UserProfile) => {
    if (!user.id) return;
    const targetRole = user.role === 'admin' ? 'operator' : 'admin';

    Alert.alert(
      'Modify Role',
      `Change role of ${user.inGameName} to ${targetRole.toUpperCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const ok = await updateOperatorRole(user.id!, targetRole);
            if (ok) {
              setOperators((prev) =>
                prev.map((o) => (o.id === user.id ? { ...o, role: targetRole } : o))
              );
            } else {
              Alert.alert('Error', 'Failed to update user role.');
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = (user: UserProfile) => {
    if (!user.id) return;
    const isSuspended = user.status === 'suspended';
    const actionText = isSuspended ? 'ACTIVATE' : 'SUSPEND';

    Alert.alert(
      `${actionText} Account`,
      `Are you sure you want to ${actionText.toLowerCase()} ${user.inGameName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: isSuspended ? 'default' : 'destructive',
          onPress: async () => {
            const ok = await toggleOperatorStatus(user.id!, user.status);
            if (ok) {
              setOperators((prev) =>
                prev.map((o) =>
                  o.id === user.id ? { ...o, status: isSuspended ? 'active' : 'suspended' } : o
                )
              );
            } else {
              Alert.alert('Error', 'Failed to change account status.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = (user: UserProfile) => {
    if (!user.id) return;

    Alert.alert(
      'Delete Operator Account',
      `Permanently delete ${user.inGameName} from the database? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteOperator(user.id!);
            if (ok) {
              setOperators((prev) => prev.filter((o) => o.id !== user.id));
            } else {
              Alert.alert('Error', 'Failed to delete user.');
            }
          },
        },
      ]
    );
  };

  const filtered = operators.filter((u) => {
    const matchesSearch =
      u.inGameName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'ALL' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const totalAdmins = operators.filter((u) => u.role === 'admin').length;
  const totalActive = operators.filter((u) => u.status !== 'suspended').length;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={18} color="#F8FAFC" />
          <Text style={styles.backButtonText}>Armory</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>ADMIN CONSOLE</Text>
          <Text style={styles.headerSubtitle}>Firebase Account Management</Text>
        </View>

        <View style={styles.adminBadge}>
          <Crown size={12} color="#F59E0B" />
          <Text style={styles.adminBadgeText}>ADMIN</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Metric Cards */}
        <View style={styles.metricsRow}>
          <View style={styles.statCard}>
            <Users size={18} color="#38BDF8" />
            <Text style={styles.statNumber}>{operators.length}</Text>
            <Text style={styles.statLabel}>TOTAL OPERATORS</Text>
          </View>

          <View style={styles.statCard}>
            <Shield size={18} color="#F59E0B" />
            <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{totalAdmins}</Text>
            <Text style={styles.statLabel}>ADMIN ACCOUNTS</Text>
          </View>

          <View style={styles.statCard}>
            <CheckCircle size={18} color="#10B981" />
            <Text style={[styles.statNumber, { color: '#10B981' }]}>{totalActive}</Text>
            <Text style={styles.statLabel}>ACTIVE OPERATORS</Text>
          </View>
        </View>

        {/* Search & Filter Controls */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Search size={16} color="#64748B" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by IGN or name..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.filterGroup}>
            {(['ALL', 'admin', 'operator'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.filterChip, filterRole === r && styles.filterChipActive]}
                onPress={() => setFilterRole(r)}
              >
                <Text
                  style={[styles.filterChipText, filterRole === r && styles.filterChipTextActive]}
                >
                  {r.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* User Accounts List */}
        <View style={styles.listSection}>
          <Text style={styles.listSectionTitle}>
            REGISTERED ACCOUNTS ({filtered.length})
          </Text>

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#F59E0B" />
              <Text style={styles.loadingText}>Connecting to Firebase Firestore...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <AlertTriangle size={32} color="#64748B" />
              <Text style={styles.emptyTitle}>No Operators Found</Text>
              <Text style={styles.emptySub}>
                {searchQuery ? 'Try matching another search keyword.' : 'Accounts will show here once registered.'}
              </Text>
            </View>
          ) : (
            filtered.map((user) => {
              const isAdmin = user.role === 'admin';
              const isSuspended = user.status === 'suspended';

              return (
                <View key={user.id || user.inGameName} style={styles.userCard}>
                  {/* Left Column: User details */}
                  <View style={styles.userInfo}>
                    <View style={styles.userHeading}>
                      <Text style={styles.userIGN}>{user.inGameName}</Text>
                      {isAdmin && (
                        <View style={styles.roleTagAdmin}>
                          <Crown size={10} color="#F59E0B" />
                          <Text style={styles.roleTagTextAdmin}>ADMIN</Text>
                        </View>
                      )}
                      {isSuspended && (
                        <View style={styles.statusTagSuspended}>
                          <Text style={styles.statusTagTextSuspended}>SUSPENDED</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.userName}>
                      {user.firstName} {user.lastName} · {user.gender} · {user.age} yrs
                    </Text>

                    <Text style={styles.userDate}>
                      Joined: {new Date(user.signedInAt).toLocaleDateString()}
                    </Text>
                  </View>

                  {/* Right Column: Actions */}
                  <View style={styles.actionCol}>
                    <TouchableOpacity
                      style={[styles.actionBtn, isAdmin && styles.actionBtnAdminActive]}
                      onPress={() => handleToggleRole(user)}
                      activeOpacity={0.7}
                    >
                      <Crown size={12} color={isAdmin ? '#F59E0B' : '#94A3B8'} />
                      <Text
                        style={[
                          styles.actionBtnText,
                          isAdmin && { color: '#F59E0B', fontWeight: '800' },
                        ]}
                      >
                        {isAdmin ? 'Demote' : 'Make Admin'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        isSuspended ? styles.actionBtnActive : styles.actionBtnWarn,
                      ]}
                      onPress={() => handleToggleStatus(user)}
                      activeOpacity={0.7}
                    >
                      {isSuspended ? (
                        <>
                          <UserCheck size={12} color="#10B981" />
                          <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Activate</Text>
                        </>
                      ) : (
                        <>
                          <UserX size={12} color="#F59E0B" />
                          <Text style={[styles.actionBtnText, { color: '#F59E0B' }]}>Suspend</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnDanger]}
                      onPress={() => handleDeleteUser(user)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={12} color="#EF4444" />
                      <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  headerTitleContainer: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.amberTint,
    borderWidth: 1,
    borderColor: colors.amberBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  adminBadgeText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  statNumber: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '900',
    marginVertical: 4,
  },
  statLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  searchRow: {
    marginBottom: 16,
  },
  searchInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 10,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    color: '#F8FAFC',
    paddingLeft: 38,
    paddingRight: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  filterChipText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#0F172A',
    fontWeight: '900',
  },
  listSection: {
    marginTop: 4,
  },
  listSectionTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 10,
  },
  emptyCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 10,
  },
  emptySub: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  userCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginRight: 10,
  },
  userHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  userIGN: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '900',
  },
  roleTagAdmin: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B20',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    gap: 3,
  },
  roleTagTextAdmin: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '900',
  },
  statusTagSuspended: {
    backgroundColor: '#EF444420',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  statusTagTextSuspended: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '900',
  },
  userName: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  userDate: {
    color: '#475569',
    fontSize: 10,
  },
  actionCol: {
    flexDirection: 'column',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  actionBtnAdminActive: {
    backgroundColor: '#F59E0B15',
    borderWidth: 1,
    borderColor: '#F59E0B40',
  },
  actionBtnActive: {
    backgroundColor: '#10B98115',
    borderWidth: 1,
    borderColor: '#10B98140',
  },
  actionBtnWarn: {
    backgroundColor: '#F59E0B15',
    borderWidth: 1,
    borderColor: '#F59E0B40',
  },
  actionBtnDanger: {
    backgroundColor: '#EF444415',
    borderWidth: 1,
    borderColor: '#EF444440',
  },
  actionBtnText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
  },
});
