import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import WalkthroughScreen1 from '../src/screens/onboarding/WalkthroughScreen1';
import WalkthroughScreen2 from '../src/screens/onboarding/WalkthroughScreen2';
import WalkthroughScreen3 from '../src/screens/onboarding/WalkthroughScreen3';
import WelcomeScreen from '../src/screens/onboarding/WelcomeScreen';

const { width: screenWidth } = Dimensions.get('window');

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();

  const screens = [
    { component: WalkthroughScreen1, key: 'walkthrough1' },
    { component: WalkthroughScreen2, key: 'walkthrough2' },
    { component: WalkthroughScreen3, key: 'walkthrough3' },
    { component: WelcomeScreen, key: 'welcome' },
  ];

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const step = Math.round(contentOffset / screenWidth);
    if (step !== currentStep) {
      setCurrentStep(step);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < screens.length) {
      scrollViewRef.current?.scrollTo({
        x: step * screenWidth,
        animated: true,
      });
      setCurrentStep(step);
    }
  };

  const nextStep = () => {
    if (currentStep < screens.length - 1) {
      goToStep(currentStep + 1);
    } else {
      router.replace('/auth');
    }
  };

  const goToAuth = () => {
    router.replace('/auth');
  };

  const renderScreen = (ScreenComponent: any, index: number) => {
    if (index === screens.length - 1) {
      // Welcome screen
      return (
        <View key={index} style={styles.screenContainer}>
          <ScreenComponent onGetStarted={goToAuth} />
        </View>
      );
    } else {
      // Walkthrough screens
      return (
        <View key={index} style={styles.screenContainer}>
          <ScreenComponent onNext={nextStep} />
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {screens.map((screen, index) => renderScreen(screen.component, index))}
      </ScrollView>
      
      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        {screens.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.paginationDot,
              currentStep === index && styles.paginationDotActive,
            ]}
            onPress={() => goToStep(index)}
            activeOpacity={0.7}
          />
        ))}
      </View>
      
      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {currentStep < screens.length - 1 && (
          <TouchableOpacity style={styles.skipButton} onPress={goToAuth}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}
        
        {currentStep < screens.length - 1 && (
          <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    alignItems: 'center',
  },
  screenContainer: {
    width: screenWidth,
    flex: 1,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
    transition: 'all 0.3s ease',
  },
  paginationDotActive: {
    backgroundColor: '#F59E0B',
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 30,
    paddingTop: 10,
  },
  skipButton: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  skipButtonText: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 