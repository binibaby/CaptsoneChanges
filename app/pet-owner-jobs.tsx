import ProtectedScreen from '../src/components/ProtectedScreen';
import PetOwnerJobsScreen from '../src/screens/app/PetOwnerJobsScreen';

export default function PetOwnerJobs() {
  return (
    <ProtectedScreen screenName="PetOwnerJobs">
      <PetOwnerJobsScreen />
    </ProtectedScreen>
  );
} 