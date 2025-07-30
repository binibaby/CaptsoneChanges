import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Moment {
  id: string;
  user: {
    name: string;
    image: any;
  };
  pet: {
    name: string;
    type: string;
  };
  image: any;
  caption: string;
  likes: number;
  comments: number;
  timeAgo: string;
  isLiked: boolean;
}

const MomentsScreen = () => {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMoments = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // For now, simulate fetching moments
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMoments([
        {
          id: '1',
          user: {
            name: 'Sarah Johnson',
            image: require('../../assets/images/default-avatar.png'),
          },
          pet: {
            name: 'Max',
            type: 'Golden Retriever',
          },
          image: require('../../assets/images/dog.png'),
          caption: 'Max had the best time at the park today! 🐕❤️',
          likes: 24,
          comments: 5,
          timeAgo: '2 hours ago',
          isLiked: false,
        },
        {
          id: '2',
          user: {
            name: 'Mike Chen',
            image: require('../../assets/images/default-avatar.png'),
          },
          pet: {
            name: 'Luna',
            type: 'Persian Cat',
          },
          image: require('../../assets/images/cat.png'),
          caption: 'Luna found the perfect spot for her afternoon nap 😴',
          likes: 18,
          comments: 3,
          timeAgo: '4 hours ago',
          isLiked: true,
        },
        {
          id: '3',
          user: {
            name: 'Emily Davis',
            image: require('../../assets/images/default-avatar.png'),
          },
          pet: {
            name: 'Buddy',
            type: 'Labrador',
          },
          image: require('../../assets/images/dog.png'),
          caption: 'Training session success! Buddy learned a new trick today 🎾',
          likes: 31,
          comments: 8,
          timeAgo: '6 hours ago',
          isLiked: false,
        },
        {
          id: '4',
          user: {
            name: 'Alex Wilson',
            image: require('../../assets/images/default-avatar.png'),
          },
          pet: {
            name: 'Whiskers',
            type: 'Siamese Cat',
          },
          image: require('../../assets/images/cat.png'),
          caption: 'Whiskers exploring the new cat tree 🐱',
          likes: 15,
          comments: 2,
          timeAgo: '1 day ago',
          isLiked: false,
        },
      ]);
    } catch (err) {
      setError('Failed to fetch moments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    fetchMoments();
  }, []);

  const handleLike = (momentId: string) => {
    setMoments(prevMoments =>
      prevMoments.map(moment =>
        moment.id === momentId
          ? {
              ...moment,
              isLiked: !moment.isLiked,
              likes: moment.isLiked ? moment.likes - 1 : moment.likes + 1,
            }
          : moment
      )
    );
  };

  const handleComment = (momentId: string) => {
    console.log('Comment on moment:', momentId);
    // TODO: Implement comment functionality
  };

  const handleShare = (momentId: string) => {
    console.log('Share moment:', momentId);
    // TODO: Implement share functionality
  };

  const renderMomentCard = ({ item }: { item: Moment }) => (
    <View style={styles.momentCard}>
      {/* User Header */}
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Image source={item.user.image} style={styles.userImage} />
          <View>
            <Text style={styles.userName}>{item.user.name}</Text>
            <Text style={styles.petInfo}>
              with {item.pet.name} • {item.pet.type}
            </Text>
          </View>
        </View>
        <Text style={styles.timeAgo}>{item.timeAgo}</Text>
      </View>

      {/* Moment Image */}
      <Image source={item.image} style={styles.momentImage} />

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
        >
          <Ionicons
            name={item.isLiked ? 'heart' : 'heart-outline'}
            size={24}
            color={item.isLiked ? '#FF6B6B' : '#333'}
          />
          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleComment(item.id)}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#333" />
          <Text style={styles.actionText}>{item.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleShare(item.id)}
        >
          <Ionicons name="share-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Caption */}
      <View style={styles.captionContainer}>
        <Text style={styles.caption}>{item.caption}</Text>
      </View>
    </View>
  );

  if (loading && moments.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Moments</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="search-outline" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="add-circle-outline" size={24} color="#F59E0B" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>Loading Moments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Moments</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="search-outline" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="add-circle-outline" size={24} color="#F59E0B" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (moments.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Moments</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="search-outline" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="add-circle-outline" size={24} color="#F59E0B" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>No moments yet. Be the first to add one!</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Moments</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="search-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="add-circle-outline" size={24} color="#F59E0B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stories/Highlights */}
      <View style={styles.storiesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={styles.addStoryButton}>
            <Ionicons name="add" size={24} color="#F59E0B" />
            <Text style={styles.addStoryText}>Add Story</Text>
          </TouchableOpacity>
          
          {moments.slice(0, 5).map((moment, index) => (
            <TouchableOpacity key={index} style={styles.storyItem}>
              <Image source={moment.image} style={styles.storyImage} />
              <Text style={styles.storyName}>{moment.pet.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Moments Feed */}
      <FlatList
        data={moments}
        keyExtractor={(item) => item.id}
        renderItem={renderMomentCard}
        contentContainerStyle={styles.momentsList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 15,
  },
  headerButton: {
    padding: 5,
  },
  storiesContainer: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addStoryButton: {
    alignItems: 'center',
    marginHorizontal: 10,
    width: 70,
  },
  addStoryText: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 5,
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 10,
    width: 70,
  },
  storyImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  storyName: {
    fontSize: 12,
    color: '#333',
    marginTop: 5,
    textAlign: 'center',
  },
  momentsList: {
    padding: 10,
  },
  momentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  petInfo: {
    fontSize: 12,
    color: '#666',
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
  },
  momentImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  actions: {
    flexDirection: 'row',
    padding: 15,
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  captionContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  caption: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
});

export default MomentsScreen; 