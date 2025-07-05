import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import WalkthroughScreen1 from '../src/screens/onboarding/WalkthroughScreen1';
import WalkthroughScreen2 from '../src/screens/onboarding/WalkthroughScreen2';
import WalkthroughScreen3 from '../src/screens/onboarding/WalkthroughScreen3';
import WelcomeScreen from '../src/screens/onboarding/WelcomeScreen';

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      router.replace('/auth');
    }
  };

  const goToAuth = () => {
    router.replace('/auth');
  };

  switch (currentStep) {
    case 1:
      return <WalkthroughScreen1 onNext={nextStep} />;
    case 2:
      return <WalkthroughScreen2 onNext={nextStep} />;
    case 3:
      return <WalkthroughScreen3 onNext={nextStep} />;
    case 4:
      return <WelcomeScreen onGetStarted={goToAuth} />;
    default:
      return <WalkthroughScreen1 onNext={nextStep} />;
  }
} 