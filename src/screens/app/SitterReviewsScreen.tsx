import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Review {
  id: string;
  rating: number;
  review: string;
  owner_name: string;
  pet_name: string;
  date: string;
  created_at: string;
}

const SitterReviewsScreen = () => {
  const router = useRouter();
  const { sitterId, sitterName } = useLocalSearchParams<{
    sitterId: string;
    sitterName: string;
  }>();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    if (sitterId) {
      loadReviews();
    }
  }, [sitterId]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const { makeApiCall } = await import('../../services/networkService');
      const authService = (await import('../../services/authService')).default;
      const currentUser = await authService.getCurrentUser();
      const token = currentUser?.token;

      console.log('🔍 Loading reviews for sitter:', { sitterId, sitterName });

      const response = await makeApiCall(`/api/sitters/${sitterId}/reviews`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🔍 Reviews API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Reviews API error:', errorData);
        throw new Error(errorData.message || 'Failed to load reviews');
      }

      const result = await response.json();
      console.log('✅ Reviews loaded successfully:', result);

      setReviews(result.reviews || []);
      setAverageRating(result.sitter?.average_rating || 0);
      setTotalReviews(result.sitter?.total_reviews || 0);

    } catch (error) {
      console.error('❌ Error loading reviews:', error);
      Alert.alert('Error', `Failed to load reviews: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={16}
          color={i <= rating ? '#FFD700' : '#E5E7EB'}
        />
      );
    }
    return stars;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reviews</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {/* Rating Summary */}
          <View style={styles.ratingSummary}>
            <View style={styles.ratingContainer}>
              <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
              <View style={styles.starsContainer}>
                {renderStars(Math.round(averageRating))}
              </View>
              <Text style={styles.totalReviews}>
                Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Reviews List */}
          {reviews.length > 0 ? (
            <View style={styles.reviewsList}>
              {reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerInfo}>
                      <Text style={styles.reviewerName}>{review.owner_name}</Text>
                      <Text style={styles.petName}>Pet: {review.pet_name}</Text>
                    </View>
                    <View style={styles.reviewRating}>
                      <View style={styles.starsContainer}>
                        {renderStars(review.rating)}
                      </View>
                      <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
                    </View>
                  </View>
                  {review.review && (
                    <Text style={styles.reviewText}>{review.review}</Text>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="star-outline" size={48} color="#ccc" />
              <Text style={styles.emptyTitle}>No Reviews Yet</Text>
              <Text style={styles.emptySubtitle}>
                This sitter hasn't received any reviews yet.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  ratingSummary: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  averageRating: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  totalReviews: {
    fontSize: 14,
    color: '#6B7280',
  },
  reviewsList: {
    padding: 16,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  petName: {
    fontSize: 14,
    color: '#6B7280',
  },
  reviewRating: {
    alignItems: 'flex-end',
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  reviewText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SitterReviewsScreen;
