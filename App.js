import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Gambar placeholder default jika foto belum dipilih
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/150/cccccc/ffffff?text=No+Profile+Pic';

export default function App() {
  const [image, setImage] = useState(PLACEHOLDER_IMAGE);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  // Level 2: Memuat data dari AsyncStorage saat aplikasi pertama dibuka
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const savedImage = await AsyncStorage.getItem('@profile_image');
      const savedLocation = await AsyncStorage.getItem('@profile_location');
      
      if (savedImage) setImage(savedImage);
      if (savedLocation) setLocation(JSON.parse(savedLocation));
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat data profil lama.');
    }
  };

  const saveProfileData = async (imageUri, locationData) => {
    try {
      if (imageUri) await AsyncStorage.setItem('@profile_image', imageUri);
      if (locationData) await AsyncStorage.setItem('@profile_location', JSON.stringify(locationData));
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan data.');
    }
  };

  // Level 1: Fitur Kamera dengan Alur Permission yang benar
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Maaf, aplikasi memerlukan izin kamera untuk mengambil foto profil.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    // Level 1: Cek jika tidak dicancel, ambil assets[0].uri
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedUri = result.assets[0].uri;
      setImage(selectedUri);
      await saveProfileData(selectedUri, null);
    }
  };

  // Level 1: Fitur Galeri dengan Alur Permission yang benar
  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Maaf, aplikasi memerlukan izin galeri untuk memilih foto profil.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedUri = result.assets[0].uri;
      setImage(selectedUri);
      await saveProfileData(selectedUri, null);
    }
  };

  // Level 2: Menggabungkan Kamera + Galeri lewat dialog Alert pilihan sumber
  const handleSelectPhoto = () => {
    Alert.alert(
      'Pilih Foto Profil',
      'Silakan pilih metode pengambilan foto:',
      [
        { text: 'Kamera', onPress: takePhoto },
        { text: 'Galeri', onPress: pickImageFromGallery },
        { text: 'Batal', style: 'cancel' }
      ]
    );
  };

  // Level 1: Ambil Koordinat GPS (Latitude/Longitude)
  const getLocation = async () => {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      setLoading(false);
      Alert.alert('Izin Lokasi Ditolak', 'Aplikasi tidak dapat menampilkan koordinat tanpa izin GPS.');
      return;
    }

    try {
      let currentPosition = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude
      };
      setLocation(coords);
      await saveProfileData(null, coords);
    } catch (error) {
      Alert.alert('Error GPS', 'Gagal mengambil data koordinat lokasi.');
    } finally {
      setLoading(false);
    }
  };

  // Level 3 (Bonus): Hapus foto profil kembali ke placeholder awal
  const handleResetProfile = async () => {
    setImage(PLACEHOLDER_IMAGE);
    setLocation(null);
    await AsyncStorage.removeItem('@profile_image');
    await AsyncStorage.removeItem('@profile_location');
    Alert.alert('Sukses', 'Profil berhasil direset.');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Level 1: Tampilan UI Profile Card yang rapi */}
      <View style={styles.card}>
        <Image source={{ uri: image }} style={styles.profileImage} />
        
        <Text style={styles.nameText}>Diko Manik(Pagi A)</Text>
        <Text style={styles.bioText}>Mobile App Developer Student</Text>

        <View style={styles.locationContainer}>
          <Text style={styles.locationTitle}>📍 Koordinat GPS Anda:</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : location ? (
            <Text style={styles.locationData}>
              Lat: {location.latitude.toFixed(5)} | Lon: {location.longitude.toFixed(5)}
            </Text>
          ) : (
            <Text style={styles.locationPlaceholder}>Lokasi belum diambil</Text>
          )}
        </View>

        {/* Tombol-tombol Aksi */}
        <TouchableOpacity style={styles.button} onPress={handleSelectPhoto}>
          <Text style={styles.buttonText}>📸 Ubah Foto Profil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.geoButton]} onPress={getLocation}>
          <Text style={styles.buttonText}>🎯 Dapatkan Lokasi GPS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={handleResetProfile}>
          <Text style={styles.buttonText}>🗑️ Hapus Data Profil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: '#007AFF',
    marginBottom: 16,
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  bioText: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 20,
  },
  locationContainer: {
    backgroundColor: '#f8f8fa',
    width: '100%',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  locationTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  locationData: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34c759',
  },
  locationPlaceholder: {
    fontSize: 13,
    color: '#aeaeae',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#007AFF',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  geoButton: {
    backgroundColor: '#34c759',
  },
  resetButton: {
    backgroundColor: '#ff3b30',
    marginBottom: 0,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});