import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface UserBadgeProps {
  role: string;
  verifiedRole?: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export default function UserBadge({ role, verifiedRole, size = 'medium', style }: UserBadgeProps) {
  const displayRole = verifiedRole || role;
  
  const getBadgeConfig = (role: string) => {
    switch (role.toLowerCase()) {
      case 'listener':
        return {
          color: '#6b7280', // Gray
          backgroundColor: 'rgba(107, 114, 128, 0.15)',
          icon: 'headset' as const,
          label: 'Listener'
        };
      case 'creator':
        return {
          color: '#ff6b9d', // Pink
          backgroundColor: 'rgba(255, 107, 157, 0.15)',
          icon: 'mic' as const,
          label: 'Creator'
        };
      case 'expert':
        return {
          color: '#45d4aa', // Green
          backgroundColor: 'rgba(69, 212, 170, 0.15)',
          icon: 'star' as const,
          label: 'Expert'
        };
      case 'label':
        return {
          color: '#c770f0', // Purple
          backgroundColor: 'rgba(199, 112, 240, 0.15)',
          icon: 'business' as const,
          label: 'Label'
        };
      default:
        return {
          color: '#6b7280',
          backgroundColor: 'rgba(107, 114, 128, 0.15)',
          icon: 'person' as const,
          label: 'User'
        };
    }
  };

  const getSizeConfig = (size: string) => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 8,
          fontSize: 10,
          iconSize: 12
        };
      case 'medium':
        return {
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 10,
          fontSize: 12,
          iconSize: 14
        };
      case 'large':
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12,
          fontSize: 14,
          iconSize: 16
        };
      default:
        return {
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 10,
          fontSize: 12,
          iconSize: 14
        };
    }
  };

  const badgeConfig = getBadgeConfig(displayRole);
  const sizeConfig = getSizeConfig(size);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeConfig.backgroundColor,
          borderColor: badgeConfig.color,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          paddingVertical: sizeConfig.paddingVertical,
          borderRadius: sizeConfig.borderRadius,
        },
        style,
      ]}
    >
      <Ionicons
        name={badgeConfig.icon}
        size={sizeConfig.iconSize}
        color={badgeConfig.color}
        style={styles.icon}
      />
      <Text
        style={[
          styles.badgeText,
          {
            color: badgeConfig.color,
            fontSize: sizeConfig.fontSize,
          },
        ]}
      >
        {badgeConfig.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  badgeText: {
    fontWeight: '600',
  },
});