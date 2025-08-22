import React from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface WalkthroughScreen2Props {
  onNext: () => void;
}

const WalkthroughScreen2: React.FC<WalkthroughScreen2Props> = ({ onNext }) => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/walkthrough2.png')} // Placeholder image
        style={styles.image}
      />
      <View style={styles.content}>
        <Text style={styles.title}>Find Your Perfect Match</Text>
        <Text style={styles.description}>
          Discover pets that match your lifestyle and preferences. Our smart matching system helps
          you find the perfect companion.
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

export default WalkthroughScreen2; 