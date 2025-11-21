import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, NativeModules, Platform, Image, Linking } from "react-native";
import { firestoreDb } from "../services/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";

export default function EntregadorMap({ navigation }) {
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [driverLocation, setDriverLocation] = useState({ latitude: -23.55, longitude: -46.63 });
  const mapRef = useRef(null);

  // Estado para carregar dinamicamente o módulo de mapas apenas quando disponível
  const [mapComponents, setMapComponents] = useState(null);

  // NOTE: em um app real o driverId viria do auth
  const driverId = "driver_mock_1";

  useEffect(() => {
    // Detecta se o módulo nativo do react-native-maps está disponível
    const hasNativeMaps = !!NativeModules?.RNMapsAirModule || !!NativeModules?.AirMapManager || Platform.OS === 'web';
    if (hasNativeMaps) {
      try {
        const Maps = require('react-native-maps');
        setMapComponents({
          MapView: Maps.default || Maps,
          Marker: Maps.Marker,
          Polyline: Maps.Polyline,
        });
      } catch (e) {
        console.warn('react-native-maps not available at runtime', e?.message);
        setMapComponents(null);
      }
    } else {
      setMapComponents(null);
    }

    // Observa pedidos atribuídos ao entregador
    if (!firestoreDb) return;
    const coll = collection(firestoreDb, "deliveries");
    const q = query(coll, where("assignedDriverId", "==", driverId));
    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setAssignedOrders(arr);
    });
    return () => unsub();
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      const docRef = doc(firestoreDb, "deliveries", orderId);
      await updateDoc(docRef, { status });
      Alert.alert("OK", `Status atualizado: ${status}`);
    } catch (e) {
      console.warn(e);
      Alert.alert("Erro", "Não foi possível atualizar status");
    }
  };

  const openExternalMap = (lat, lng, label) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });
    Linking.openURL(url).catch((e) => console.warn('openExternalMap error', e));
  };

  return (
    <View style={styles.container}>
      {mapComponents && mapComponents.MapView ? (
        (() => {
          const { MapView, Marker, Polyline } = mapComponents;
          return (
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: driverLocation.latitude,
                longitude: driverLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              <Marker coordinate={driverLocation} title="Você (Entregador)" pinColor="blue" />

              {assignedOrders.map((o) => (
                o.destination?.location && (
                  <Marker
                    key={o.id}
                    coordinate={{ latitude: o.destination.location.lat, longitude: o.destination.location.lng }}
                    title={`Pedido ${o.id}`}
                    description={o.status}
                  />
                )
              ))}

            </MapView>
          );
        })()
      ) : (
        <View style={styles.fallbackMap}>
          <Image
            source={{ uri: `https://maps.googleapis.com/maps/api/staticmap?center=${driverLocation.latitude},${driverLocation.longitude}&zoom=13&size=600x300&markers=color:blue%7Clabel:D%7C${driverLocation.latitude},${driverLocation.longitude}` }}
            style={{ width: '100%', height: 180, resizeMode: 'cover', borderRadius: 8 }}
          />
          <Text style={{ marginTop: 8, textAlign: 'center' }}>MapView não disponível no Expo Go. Abra no app de mapas:</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
            <TouchableOpacity onPress={() => openExternalMap(driverLocation.latitude, driverLocation.longitude, 'Sua localização')} style={[styles.btn, { marginRight: 8 }] }>
              <Text style={styles.btnText}>Abrir minha posição</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openExternalMap(assignedOrders[0]?.destination?.location?.lat ?? driverLocation.latitude, assignedOrders[0]?.destination?.location?.lng ?? driverLocation.longitude, 'Destino')} style={[styles.btn, { backgroundColor: '#f39c12' }]}>
              <Text style={styles.btnText}>Abrir destino</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.panel}>
        <Text style={styles.title}>Entregas atribuídas</Text>
        {assignedOrders.map((o) => (
          <View key={o.id} style={styles.orderRow}>
            <Text style={{ flex: 1 }}>{o.id} — {o.status}</Text>
            <TouchableOpacity onPress={() => updateStatus(o.id, "enroute")} style={styles.btn}>
              <Text style={styles.btnText}>Iniciar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => updateStatus(o.id, "delivered")} style={[styles.btn, { backgroundColor: "#2ecc71" }] }>
              <Text style={styles.btnText}>Entregue</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openExternalMap(o.destination?.location?.lat ?? driverLocation.latitude, o.destination?.location?.lng ?? driverLocation.longitude, `Pedido ${o.id}`)} style={[styles.btn, { backgroundColor: '#425bab', marginLeft: 6 }]}>
              <Text style={styles.btnText}>Abrir no Maps</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  panel: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(255,255,255,0.95)", padding: 10 },
  title: { fontWeight: "bold", marginBottom: 8 },
  orderRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  btn: { backgroundColor: "#425bab", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginLeft: 6 },
  btnText: { color: "#fff", fontWeight: "600" },
});
