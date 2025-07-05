import React from 'react';
import {
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface WalkthroughScreen3Props {
  onNext: () => void;
}

const WalkthroughScreen3: React.FC<WalkthroughScreen3Props> = ({ onNext }) => {
  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require('../../assets/images/walkthrough3.png')} // Placeholder image
        style={styles.image}
      />
      <View style={styles.content}>
        <Text style={styles.title}>Start Your Journey</Text>
        <Text style={styles.description}>
          Ready to find your perfect pet companion? Join our community and start your
          heartwarming journey today.
        </Text>
      </View>
      <View style={styles.pagination}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={[styles.dot, styles.activeDot]} />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.skipButton} onPress={onNext}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.continueButton} onPress={onNext}>
          <Text style={styles.continueButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 50,
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    marginBottom: 30,
  },
  content: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    marginTop: 40,
    marginBottom: 30,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#F59E0B',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '85%',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 50,
  },
  skipButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  skipButtonText: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WalkthroughScreen3; 