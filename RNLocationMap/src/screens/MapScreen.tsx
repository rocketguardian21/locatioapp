import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, PermissionsAndroid, Platform, Alert, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import io, { Socket } from 'socket.io-client';

const { width, height } = Dimensions.get('window');

// Coordenadas de Santiago, República Dominicana
const SANTIAGO_COORDS = {
  latitude: 19.4517,
  longitude: -70.6970,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

interface Location {
  latitude: number;
  longitude: number;
}

interface User {
  id: string;
  location: Location;
}

interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp: number;
}

const MapScreen = () => {
  const [userA, setUserA] = useState<User>({
    id: 'A',
    location: { latitude: SANTIAGO_COORDS.latitude, longitude: SANTIAGO_COORDS.longitude }
  });
  const [userB, setUserB] = useState<User>({
    id: 'B',
    location: { latitude: SANTIAGO_COORDS.latitude, longitude: SANTIAGO_COORDS.longitude }
  });
  const [destination, setDestination] = useState<Location | null>(null);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [isSelectingDestination, setIsSelectingDestination] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [_mapReady, setMapReady] = useState(false);
  const [journeyStarted, setJourneyStarted] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    const initializeSocket = () => {
      try {
        socketRef.current = io('http://10.0.2.2:3000');
        
        socketRef.current.on('connect', () => {
          console.log('Conectado al servidor');
        });

        socketRef.current.on('locationUpdate', async (data: { userId: string; location: Location }) => {
          if (data.userId === 'B' && journeyStarted) {
            setUserB(prev => ({ ...prev, location: data.location }));
            setRoutePoints(prev => [...prev, { ...data.location, timestamp: Date.now() }]);
          }
        });
      } catch (error) {
        console.error('Error inicializando socket:', error);
      }
    };

    initializeSocket();
    
    return () => {
      socketRef.current?.disconnect();
    };
  }, [journeyStarted]);

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permiso de ubicación',
            message: 'La aplicación necesita acceso a tu ubicación.',
            buttonNeutral: 'Preguntar luego',
            buttonNegative: 'Cancelar',
            buttonPositive: 'OK',
          },
        );
        
        setHasLocationPermission(true);

        // Si el permiso fue denegado, usar ubicación por defecto
        if (granted === PermissionsAndroid.RESULTS.DENIED || 
            granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          setUserA(prev => ({
            ...prev,
            location: { latitude: SANTIAGO_COORDS.latitude, longitude: SANTIAGO_COORDS.longitude }
          }));
          setUserB(prev => ({
            ...prev,
            location: { latitude: SANTIAGO_COORDS.latitude, longitude: SANTIAGO_COORDS.longitude }
          }));
          
          if (mapRef.current) {
            mapRef.current.animateToRegion(SANTIAGO_COORDS, 1000);
          }

          setIsSelectingDestination(true);
          Alert.alert(
            'Ubicación por defecto',
            'Se usará Santiago como tu ubicación inicial.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Intentar obtener la ubicación actual
        try {
          Geolocation.getCurrentPosition(
            position => {
              const newLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              };
              setUserA(prev => ({ ...prev, location: newLocation }));
              setUserB(prev => ({ ...prev, location: newLocation }));
              
              if (mapRef.current) {
                mapRef.current.animateToRegion({
                  ...newLocation,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }, 1000);
              }

              setIsSelectingDestination(true);
              Alert.alert(
                'Selecciona destino',
                'Toca un punto en el mapa para establecer el destino del viaje.'
              );
            },
            error => {
              console.error('Error obteniendo ubicación:', error);
              // En caso de error, usar ubicación por defecto
              setUserA(prev => ({
                ...prev,
                location: { latitude: SANTIAGO_COORDS.latitude, longitude: SANTIAGO_COORDS.longitude }
              }));
              setUserB(prev => ({
                ...prev,
                location: { latitude: SANTIAGO_COORDS.latitude, longitude: SANTIAGO_COORDS.longitude }
              }));
              
              if (mapRef.current) {
                mapRef.current.animateToRegion(SANTIAGO_COORDS, 1000);
              }

              setIsSelectingDestination(true);
              Alert.alert(
                'Ubicación por defecto',
                'No se pudo obtener tu ubicación. Se usará Santiago como ubicación inicial.',
                [{ text: 'OK' }]
              );
            },
            { 
              enableHighAccuracy: granted === PermissionsAndroid.RESULTS.GRANTED,
              timeout: 15000,
              maximumAge: 10000
            }
          );
        } catch (geoError) {
          console.error('Error crítico al obtener ubicación:', geoError);
          // En caso de error crítico, usar ubicación por defecto
          setUserA(prev => ({
            ...prev,
            location: { latitude: SANTIAGO_COORDS.latitude, longitude: SANTIAGO_COORDS.longitude }
          }));
          setUserB(prev => ({
            ...prev,
            location: { latitude: SANTIAGO_COORDS.latitude, longitude: SANTIAGO_COORDS.longitude }
          }));
          
          if (mapRef.current) {
            mapRef.current.animateToRegion(SANTIAGO_COORDS, 1000);
          }

          setIsSelectingDestination(true);
          Alert.alert(
            'Error de ubicación',
            'Hubo un problema al obtener tu ubicación. Se usará Santiago como ubicación inicial.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (err) {
      console.warn('Error al solicitar permisos:', err);
      // En caso de error en los permisos, usar ubicación por defecto
      setHasLocationPermission(true);
      setUserA(prev => ({
        ...prev,
        location: { latitude: SANTIAGO_COORDS.latitude, longitude: SANTIAGO_COORDS.longitude }
      }));
      setUserB(prev => ({
        ...prev,
        location: { latitude: SANTIAGO_COORDS.latitude, longitude: SANTIAGO_COORDS.longitude }
      }));
      
      if (mapRef.current) {
        mapRef.current.animateToRegion(SANTIAGO_COORDS, 1000);
      }

      setIsSelectingDestination(true);
      Alert.alert(
        'Error de permisos',
        'No se pudieron obtener los permisos. Se usará Santiago como ubicación inicial.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleMapReady = () => {
    setMapReady(true);
    if (mapRef.current) {
      mapRef.current.animateToRegion(SANTIAGO_COORDS, 1000);
    }
    requestLocationPermission();
  };

  const handleMapPress = async (event: { nativeEvent: { coordinate: Location } }) => {
    if (isSelectingDestination && !journeyStarted) {
      const selectedLocation = event.nativeEvent.coordinate;
      setDestination(selectedLocation);
      
      Alert.alert(
        'Confirmar destino',
        '¿Deseas iniciar el viaje hacia este destino?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => setDestination(null)
          },
          {
            text: 'Iniciar',
            onPress: () => {
              setJourneyStarted(true);
              setIsSelectingDestination(false);
              socketRef.current?.emit('setDestination', {
                destination: selectedLocation
              });
              // Limpiar puntos de ruta anteriores
              setRoutePoints([{ ...userB.location, timestamp: Date.now() }]);
            }
          }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={SANTIAGO_COORDS}
        onMapReady={handleMapReady}
        onPress={handleMapPress}
      >
        {hasLocationPermission && (
          <>
            <Marker
              coordinate={userA.location}
              title="Usuario A"
              description="Tu ubicación"
              pinColor="red"
            />
            {journeyStarted && (
              <Marker
                coordinate={userB.location}
                title="Usuario B"
                description="En camino"
                pinColor="blue"
              />
            )}
            {destination && (
              <Marker
                coordinate={destination}
                title="Destino"
                description="Punto de llegada"
                pinColor="green"
              />
            )}
            {routePoints.length > 1 && journeyStarted && (
              <Polyline
                coordinates={routePoints}
                strokeColor="#000"
                strokeWidth={3}
              />
            )}
          </>
        )}
      </MapView>
      {isSelectingDestination && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>
            Toca el mapa para seleccionar el destino
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width,
    height,
  },
  overlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
  },
  overlayText: {
    color: 'white',
    textAlign: 'center',
  },
});

export default MapScreen; 