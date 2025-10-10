import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
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

interface SitterReviewsModalProps {
  visible: boolean;
  onClose: () => void;
  sitterId: string;
  sitterName: string;
}

const SitterReviewsModal: React.FC<SitterReviewsModalProps> = ({
  visible,
  onClose,
  sitterId,
  sitterName,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    if (visible && sitterId) {
      loadReviews();
    }
  }, [visible, sitterId]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const { makeApiCall } = await import('../services/networkService');
      const authService = (await import('../services/authService')).default;
      const currentUser = await authService.getCurrentUser();
      const token = currentUser?.token;

      const response = await makeApiCall(`/api/sitters/${sitterId}/reviews`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
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
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Reviews for {sitterName}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
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
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
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
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    padding: 20,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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

export default SitterReviewsModal;
