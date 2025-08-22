import React from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface WalkthroughScreen1Props {
  onNext: () => void;
}

const WalkthroughScreen1: React.FC<WalkthroughScreen1Props> = ({ onNext }) => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/walkthrough1.png')} // Placeholder image
        style={styles.image}
      />
      <View style={styles.content}>
        <Text style={styles.title}>Petsit Connect </Text>
        <Text style={styles.description}>
          Embark on a heartwarming journey to find your perfect companion. Swipe, match, and open
          your heart to a new furry friend.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    marginBottom: 40,
  },
  content: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
  },
});

export default WalkthroughScreen1; 