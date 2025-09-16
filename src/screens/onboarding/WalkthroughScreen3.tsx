import React from 'react';
import {
    Image,
    StyleSheet,
    Text,
    View
} from 'react-native';

interface WalkthroughScreen3Props {
  onNext: () => void;
}

const WalkthroughScreen3: React.FC<WalkthroughScreen3Props> = ({ onNext }) => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/on3.png')} // Placeholder image
        style={styles.image}
      />
      <View style={styles.content}>
        <Text style={styles.title}>Connect & Care</Text>
        <Text style={styles.description}>
          Build meaningful relationships with pets and their owners. Share moments, provide care,
          and create lasting bonds.
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

export default WalkthroughScreen3; 