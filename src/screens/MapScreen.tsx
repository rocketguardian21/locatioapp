import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { socket, emitLocation, listenToLocation } from '../services/socket';
import type { Location } from '../types';

const SANTIAGO_REGION = {
  latitude: 19.4517,
  longitude: -70.6970,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const MapScreen: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [targetLocation, setTargetLocation] = useState<Location | null>(null);

  useEffect(() => {
    // Solicitar permisos de ubicación
    Geolocation.requestAuthorization('whenInUse');

    // Iniciar seguimiento de ubicación
    const watchId = Geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp,
        };
        setCurrentLocation(location);
        emitLocation(location);
      },
      (error) => {
        console.error(error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Actualizar cada 10 metros
        interval: 5000, // Actualizar cada 5 segundos
      }
    );

    // Escuchar actualizaciones de ubicación del otro usuario
    listenToLocation((location) => {
      setTargetLocation(location);
    });

    return () => {
      Geolocation.clearWatch(watchId);
    };
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={SANTIAGO_REGION}
      >
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Mi ubicación"
          />
        )}
        {targetLocation && (
          <Marker
            coordinate={{
              latitude: targetLocation.latitude,
              longitude: targetLocation.longitude,
            }}
            title="Ubicación objetivo"
            pinColor="blue"
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default MapScreen; 