import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned_at: string;
}

interface BadgeDisplayProps {
  badges?: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    earned_at: string;
  }>;
  showDescription?: boolean;
  size?: 'small' | 'medium' | 'large';
  maxDisplay?: number;
  isPetSitter?: boolean; // Add this prop to identify pet sitters
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ 
  badges, 
  showDescription = false, 
  size = 'medium', 
  maxDisplay, 
  isPetSitter = false 
}) => {
  const getIcon = (iconName: string) => {
    const iconMap: { [key: string]: string } = {
      'shield-checkmark': '🛡️',
      'flag': '🇵🇭',
      'card': '🪪',
      'car': '🚗',
      'briefcase': '💼',
      'heart': '❤️',
      'calculator': '🧮',
      'mail': '📮',
      'checkmark-circle': '✅',
      'school': '🎓',
      'airplane': '✈️',
      'globe': '🌍',
      'star': '⭐',
      'cpu': '🤖',
      'alert-circle': '⚠️', // Add alert icon for not verified status
    };
    return iconMap[iconName] || '🏆';
  };

  const getBadgeStyle = (color: string) => ({
    backgroundColor: color + '20', // Add transparency
    borderColor: color,
    borderWidth: 1,
  });

  // If no badges and this is a pet sitter, show "Not Verified Yet" badge
  if ((!badges || badges.length === 0) && isPetSitter) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Verification Status</Text>
        <View style={styles.badgesContainer}>
          <View style={[styles.badge, getBadgeStyle('#FF9800')]}>
            <Text style={styles.badgeIcon}>⚠️</Text>
            <View style={styles.badgeContent}>
              <Text style={[styles.badgeName, { color: '#FF9800' }]}>
                Not Verified Yet
              </Text>
              <Text style={styles.badgeDescription}>
                Complete ID verification to earn verification badges
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // If no badges and not a pet sitter, return null
  if (!badges || badges.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verification Badges</Text>
      <View style={styles.badgesContainer}>
        {badges.map((badge, index) => (
          <View key={badge.id} style={[styles.badge, getBadgeStyle(badge.color)]}>
            <Text style={styles.badgeIcon}>{getIcon(badge.icon)}</Text>
            <View style={styles.badgeContent}>
              <Text style={[styles.badgeName, { color: badge.color }]}>
                {badge.name}
              </Text>
              {showDescription && (
                <Text style={styles.badgeDescription}>
                  {badge.description}
                </Text>
              )}
              <Text style={styles.badgeDate}>
                {new Date(badge.earned_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1F2937',
  },
  badgesContainer: {
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  badgeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  badgeContent: {
    flex: 1,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  badgeDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  badgeDate: {
    fontSize: 10,
    color: '#9CA3AF',
  },
});

export default BadgeDisplay; 