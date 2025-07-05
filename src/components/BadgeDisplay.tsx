import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Badge } from '../services/verificationService';

interface BadgeDisplayProps {
  badges: Badge[];
  maxDisplay?: number;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({
  badges,
  maxDisplay = 3,
  size = 'medium',
  showText = false,
}) => {
  const displayBadges = badges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { iconSize: 12, containerSize: 20, fontSize: 10 };
      case 'large':
        return { iconSize: 20, containerSize: 32, fontSize: 14 };
      default:
        return { iconSize: 16, containerSize: 24, fontSize: 12 };
    }
  };

  const { iconSize, containerSize, fontSize } = getSizeConfig();

  if (badges.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {displayBadges.map((badge) => (
        <View
          key={badge.id}
          style={[
            styles.badge,
            {
              width: containerSize,
              height: containerSize,
              backgroundColor: badge.color,
            },
          ]}
        >
          <Ionicons name={badge.icon as any} size={iconSize} color="#fff" />
        </View>
      ))}
      
      {remainingCount > 0 && (
        <View style={[styles.badge, styles.remainingBadge, { width: containerSize, height: containerSize }]}>
          <Text style={[styles.remainingText, { fontSize }]}>+{remainingCount}</Text>
        </View>
      )}
      
      {showText && badges.length > 0 && (
        <Text style={[styles.badgeText, { fontSize }]}>
          {badges.length} {badges.length === 1 ? 'badge' : 'badges'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  remainingBadge: {
    backgroundColor: '#6B7280',
  },
  remainingText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  badgeText: {
    color: '#666',
    marginLeft: 4,
  },
});

export default BadgeDisplay; 