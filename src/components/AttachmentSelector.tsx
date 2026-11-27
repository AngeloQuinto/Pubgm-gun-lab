import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Weapon, AttachmentSlot, ATTACHMENTS, Attachment } from '../data/weapons';
import { colors } from '../theme';
import { AttachmentGlowBox } from '../utils/AttachmentGlowBox';

interface Props {
  weapon: Weapon;
  selectedAttachments: Partial<Record<AttachmentSlot, string>>;
  attachmentsMap?: Record<string, Attachment>;
  onSelectAttachment: (slot: AttachmentSlot, attachmentId: string | null) => void;
  onApplyPreset: (presetAttachments: Partial<Record<AttachmentSlot, string>>) => void;
}

export const AttachmentSelector: React.FC<Props> = ({
  weapon,
  selectedAttachments,
  attachmentsMap = ATTACHMENTS,
  onSelectAttachment,
  onApplyPreset,
}) => {
  const getSlotCompatibleAttachments = (slot: AttachmentSlot): Attachment[] => {
    return Object.values(attachmentsMap).filter(
      att =>
        att.slot === slot &&
        (att.compatibleWith.includes('ALL') || att.compatibleWith.includes(weapon.id))
    );
  };

  return (
    <View style={styles.container}>
      {/* Recommended Pro Presets */}
      <View style={styles.presetSection}>
        <Text style={styles.sectionTitle}>PRO LOADOUT PRESETS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsList}>
          {weapon.recommendedLoadouts.map((loadout, idx) => (
            <TouchableOpacity
              key={`preset-${idx}`}
              style={styles.presetButton}
              onPress={() => onApplyPreset(loadout.attachments)}
              activeOpacity={0.7}
            >
              <View style={styles.presetBadge}>
                <Text style={styles.presetBadgeText}>PRO META</Text>
              </View>
              <Text style={styles.presetName}>{loadout.playstyle}</Text>
              <Text style={styles.presetReason} numberOfLines={2}>{loadout.reason}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Attachment Slots Configurator */}
      <Text style={[styles.sectionTitle, { marginTop: 14 }]}>MODULAR ATTACHMENT SLOTS</Text>

      {weapon.supportedSlots.map(slot => {
        const activeAttachmentId = selectedAttachments[slot];
        const activeAttachment = activeAttachmentId ? attachmentsMap[activeAttachmentId] : null;
        const availableOptions = getSlotCompatibleAttachments(slot);

        return (
          <View key={`slot-${slot}`} style={styles.slotRow}>
            <View style={styles.slotHeader}>
              <Text style={styles.slotTitle}>{slot.toUpperCase()}</Text>
              {activeAttachment && (
                <TouchableOpacity onPress={() => onSelectAttachment(slot, null)}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionsScroll}>
              {/* None Option */}
              <TouchableOpacity
                style={[
                  styles.optionChip,
                  !activeAttachmentId ? styles.activeChip : styles.inactiveChip,
                ]}
                onPress={() => onSelectAttachment(slot, null)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.chipIndicator,
                    { backgroundColor: !activeAttachmentId ? colors.amber : colors.border },
                  ]}
                />
                <Text style={[styles.optionText, !activeAttachmentId && styles.activeChipText]}>
                  Stock (None)
                </Text>
              </TouchableOpacity>

              {/* Available Attachments */}
              {availableOptions.map((att, index) => {
                const isSelected = activeAttachmentId === att.id;
                return (
                  <TouchableOpacity
                    key={att.id}
                    style={[
                      styles.optionChip,
                      isSelected ? styles.activeChip : styles.inactiveChip,
                    ]}
                    onPress={() => onSelectAttachment(slot, att.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.chipIndicator,
                        { backgroundColor: isSelected ? colors.amber : colors.border },
                      ]}
                    />
                    <View style={styles.optionRow}>
                      <AttachmentGlowBox
                        uri={att.image}
                        size={32}
                        floating={isSelected}
                        delay={index * 150}
                        backgroundColor="rgba(66, 48, 18, 0.92)"
                        borderColor={isSelected ? colors.amber : colors.amberBorder}
                      />
                      <View style={styles.optionTextContainer}>
                        <Text
                          style={[styles.optionText, isSelected && styles.activeChipText]}
                          numberOfLines={1}
                        >
                          {att.name}
                        </Text>
                        {att.recommendationTag && (
                          <View style={styles.tagBadge}>
                            <Text style={styles.tagBadgeText}>{att.recommendationTag}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Description of active selection */}
            {activeAttachment && (
              <View style={styles.activeDetail}>
                <Text style={styles.activeDescription}>{activeAttachment.description}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  presetSection: {
    marginBottom: 8,
  },
  presetsList: {
    gap: 12,
  },
  presetButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    width: 220,
    borderWidth: 1,
    borderColor: colors.cyan,
  },
  presetBadge: {
    backgroundColor: colors.cyanTint,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  presetBadgeText: {
    color: colors.cyan,
    fontSize: 9,
    fontWeight: '900',
  },
  presetName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  presetReason: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  slotRow: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  slotTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  clearText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  optionsScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    gap: 8,
  },
  inactiveChip: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
  },
  activeChip: {
    backgroundColor: colors.bg,
    borderColor: colors.amberBorder,
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  chipIndicator: {
    width: 4,
    height: 28,
    borderRadius: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionTextContainer: {
    justifyContent: 'center',
    maxWidth: 160,
  },
  optionText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  activeChipText: {
    color: colors.text,
    fontWeight: '800',
  },
  tagBadge: {
    marginTop: 2,
    backgroundColor: colors.amberTint,
    borderColor: colors.amberBorder,
    borderWidth: 0.5,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    alignSelf: 'flex-start',
  },
  tagBadgeText: {
    fontSize: 8,
    color: colors.amber,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  activeDetail: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  activeDescription: {
    color: colors.cyan,
    fontSize: 11,
    fontStyle: 'italic',
  },
});

export default AttachmentSelector;
