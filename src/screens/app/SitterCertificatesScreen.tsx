import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import CertificateViewer from '../../components/CertificateViewer';

interface Certificate {
  id: string;
  name: string;
  image: string;
  date: string;
  issuer: string;
}

const SitterCertificatesScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Get data from navigation params
  const sitterName = params.sitterName as string || 'Pet Sitter';
  const certificatesData = params.certificates as string;
  
  // Parse certificates from string
  let certificates: Certificate[] = [];
  try {
    certificates = certificatesData ? JSON.parse(certificatesData) : [];
    console.log('📋 Parsed certificates:', certificates);
    certificates.forEach((cert, index) => {
      console.log(`📋 Certificate ${index + 1}:`, {
        id: cert.id,
        name: cert.name,
        image: cert.image,
        imageType: typeof cert.image,
        imageStartsWith: cert.image?.startsWith('file://'),
        imageStartsWithHttp: cert.image?.startsWith('http')
      });
    });
  } catch (error) {
    console.error('Error parsing certificates:', error);
    certificates = [];
  }

  const handleBack = () => {
    router.back();
  };

  const handleCertificatePress = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setViewerVisible(true);
  };

  const handleCloseViewer = () => {
    setViewerVisible(false);
    setSelectedCertificate(null);
  };

  const handleImageError = (certificateId: string) => {
    console.log('Image error for certificate:', certificateId);
    setImageErrors(prev => ({
      ...prev,
      [certificateId]: true
    }));
  };

  const resetImageErrors = () => {
    console.log('🔄 Resetting image errors and forcing refresh');
    setImageErrors({});
    setRefreshKey(prev => prev + 1);
  };

  // Reset errors on mount to ensure fresh start
  useEffect(() => {
    console.log('🔄 Component mounted, resetting image errors');
    setImageErrors({});
  }, []);

  // Helper function to get proper image source
  const getImageSource = (imagePath: string) => {
    console.log('🖼️ Certificate - Getting image source for:', imagePath);
    
    if (!imagePath) {
      console.log('🖼️ Certificate - No image path, using placeholder');
      return null;
    }
    
    // If it's a URL (starts with http), use it directly
    if (imagePath.startsWith('http')) {
      console.log('🖼️ Certificate - Using HTTP URL:', imagePath);
      return { uri: imagePath };
    }
    
    // If it's a storage path (starts with /storage/), construct full URL
    if (imagePath.startsWith('/storage/')) {
      const { networkService } = require('../../services/networkService');
      const fullUrl = networkService.getImageUrl(imagePath);
      console.log('🖼️ Certificate - Using storage path, full URL:', fullUrl);
      return { uri: fullUrl };
    }
    
    // For local file paths from ImagePicker, these won't work in this context
    if (imagePath.startsWith('file://')) {
      console.log('🖼️ Certificate - Local file path not accessible, using placeholder');
      return null;
    }
    
    // For any other string, treat as URI
    console.log('🖼️ Certificate - Using string as URI:', imagePath);
    return { uri: imagePath };
  };

  // Test function to force show a working image
  const getTestImageSource = (item: Certificate) => {
    // Use a local asset instead of network URL
    console.log('🧪 Test - Using local asset for:', item.name);
    return require('../../assets/images/default-avatar.png');
  };

  const renderCertificate = ({ item }: { item: Certificate }) => {
    const hasImageError = imageErrors[item.id] || false;
    const isLocalFile = item.image?.startsWith('file://');
    const isServerUrl = item.image?.startsWith('http');
    
    // Priority: Server URLs > Storage paths > Local files (fallback to placeholder)
    let imageSource = null;
    if (isServerUrl) {
      imageSource = getImageSource(item.image);
    } else if (isLocalFile) {
      // For local files, show placeholder since they won't work
      imageSource = null;
    } else {
      imageSource = getImageSource(item.image);
    }
    
    console.log(`🖼️ Rendering certificate ${item.name}:`, {
      hasImageError,
      isLocalFile,
      isServerUrl,
      imageSource,
      originalImage: item.image,
      refreshKey
    });
    
    return (
      <TouchableOpacity
        style={styles.certificateItem}
        onPress={() => handleCertificatePress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          {!hasImageError && imageSource ? (
            <Image 
              key={`${item.id}-${refreshKey}`}
              source={imageSource} 
              style={styles.certificateImage}
              onError={(error) => {
                console.log('❌ Certificate image error for', item.name, ':', error.nativeEvent.error);
                console.log('❌ Failed image source:', imageSource);
                console.log('❌ Original image path:', item.image);
                console.log('🔄 Setting error state for certificate:', item.id);
                handleImageError(item.id);
              }}
              onLoad={() => {
                console.log('✅ Certificate image loaded successfully:', item.name);
                console.log('✅ Image source that worked:', imageSource);
              }}
              onLoadStart={() => {
                console.log('🔄 Starting to load image for:', item.name);
              }}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="medal" size={50} color="#F59E0B" />
              <Text style={styles.placeholderTitle}>{item.name}</Text>
              <Text style={styles.placeholderSubtitle}>
                {isLocalFile ? 'Image Not Available' : hasImageError ? 'Failed to Load' : 'No Image'}
              </Text>
            </View>
          )}
          <View style={styles.viewOverlay}>
            <Ionicons name="eye" size={20} color="#fff" />
          </View>
        </View>
        <View style={styles.certificateInfo}>
          <Text style={styles.certificateName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.certificateIssuer}>{item.issuer}</Text>
          <Text style={styles.certificateDate}>{item.date}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="medal-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Certificates</Text>
      <Text style={styles.emptyMessage}>
        This sitter hasn't uploaded any certificates yet.
      </Text>
    </View>
  );

  const renderImageNote = () => {
    const hasLocalFiles = certificates.some(cert => cert.image?.startsWith('file://'));
    
    if (!hasLocalFiles) return null;
    
    return (
      <View style={styles.noteContainer}>
        <Ionicons name="information-circle" size={20} color="#F59E0B" />
        <Text style={styles.noteText}>
          Certificate images are not accessible from local files. Placeholder images are shown instead. The sitter needs to re-upload their certificates to make actual images visible.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{sitterName}'s Certificates</Text>
          <Text style={styles.certificateCount}>
            {certificates.length} certificate{certificates.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={resetImageErrors} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderImageNote()}
        {certificates.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={certificates}
            renderItem={renderCertificate}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Individual Certificate Viewer */}
      {selectedCertificate && (
        <CertificateViewer
          visible={viewerVisible}
          onClose={handleCloseViewer}
          certificates={[selectedCertificate]}
          sitterName={sitterName}
        />
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F59E0B',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
  },
  certificateCount: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  placeholder: {
    width: 50,
  },
  refreshButton: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  grid: {
    paddingBottom: 20,
  },
  certificateItem: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  certificateImage: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  imagePlaceholder: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  placeholderTitle: {
    fontSize: 16,
    color: '#1f2937',
    marginTop: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  placeholderSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  viewOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  certificateInfo: {
    flex: 1,
  },
  certificateName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
    lineHeight: 20,
  },
  certificateIssuer: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  certificateDate: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '400',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '400',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    marginLeft: 12,
    lineHeight: 20,
    fontWeight: '500',
  },
});

export default SitterCertificatesScreen;
