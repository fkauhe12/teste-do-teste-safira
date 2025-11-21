// screens/HomeScreen.js
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
  FlatList,
  InteractionManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';
import CardItem from '../components/CardItem';
import GlobalBottomBar from '../components/GlobalBottomBar';
import { anuncios } from '../data/anuncios';
import { onAuthStateChanged } from 'firebase/auth';
import { firestoreDb, auth, db } from '../services/firebase';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { ref, get } from 'firebase/database';
import { useCart } from '../context/CartContext';
import { loadProdutosFromCache, saveProdutosToCache } from '../services/productCache';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const stripAccents = (s) => {
  if (typeof s !== 'string') return '';
  try {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch {
    return '';
  }
};
const capitalize = (s) => {
  if (typeof s !== 'string' || !s.trim()) return '';
  const clean = stripAccents(s);
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
};
const getShortName = (fullName) => {
  if (!fullName) return '';
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return capitalize(parts[0]);
  return `${capitalize(parts[0])} ${capitalize(parts[parts.length - 1])}`;
};

const PaginationDots = ({ total, activeIndex, onDotPress }) => (
  <View style={styles.dotContainer}>
    {Array.from({ length: total }).map((_, i) => (
      <TouchableOpacity
        key={i}
        onPress={() => onDotPress(i)}
        style={[styles.dot, activeIndex === i ? styles.dotActive : styles.dotInactive]}
      />
    ))}
  </View>
);

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const logo = require('../assets/images/Logo_safira.png');
  const numAnuncios = anuncios.length;
  const loopItemWidth = width * 0.9 + 20;
  const scrollViewRef = useRef(null);

  const [activeIndex, setActiveIndex] = useState(1);
  const [greetingName, setGreetingName] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifCount, setNotifCount] = useState(0);
  const { addToCart } = useCart();
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    // Defer heavy fetch until after interactions to avoid jank on Android startup
    InteractionManager.runAfterInteractions(() => {
      (async () => {
        try {
          const cached = await loadProdutosFromCache();
          if (mounted && cached?.length) {
            setProdutos(cached);
            setLoading(false);
          }
          const snap = await getDocs(collection(firestoreDb, 'produtos'));
          const dados = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          if (mounted) setProdutos(dados);
          await saveProdutosToCache(dados);
        } catch (e) {
          console.warn('Erro ao carregar produtos', e?.message);
        } finally {
          if (mounted) setLoading(false);
        }
      })();
    });
    return () => (mounted = false);
  }, []);

  // When screen gains focus, bump reloadKey to force image components to remount/reload (fix Android image pause after navigation)
  useFocusEffect(
    useCallback(() => {
      setReloadKey((k) => k + 1);
    }, [])
  );

  // Memoized handlers map so render doesn't recreate many functions every frame
  const addHandlers = useMemo(() => {
    const map = {};
    produtos.forEach((p) => {
      map[p.id] = () => addToCart({ id: p.id, nome: p.nome, preco: Number(p.preco), imageUrl: p.imageUrl });
    });
    return map;
  }, [produtos, addToCart]);

  const topDoMomento = produtos.filter((p) => p.topDoMomento);
  const maisPesquisados = produtos.filter((p) => p.maisPesquisado);
  const maisVendidos = produtos.filter((p) => p.maisVendido);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return setGreetingName('');
      try {
        const snap = await get(ref(db, `users/${user.uid}`));
        const fullName = (snap.exists() && snap.val().fullName) || user.displayName || '';
        const short = getShortName(fullName);
        setGreetingName(short || user.email?.split('@')[0] || '');
      } catch (e) {
        setGreetingName(user.displayName || user.email?.split('@')[0] || '');
      }
    });
    return () => unsub();
  }, []);

  // unread notifications badge
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const q = query(collection(firestoreDb, 'notifications'), where('userId', '==', user.uid), where('read', '==', false));
      const unsub = onSnapshot(q, (snap) => setNotifCount(snap.size || 0), (err) => console.warn('notif listen', err?.message));
      return () => unsub();
    } catch (e) {
      console.warn('notif watch failed', e?.message);
    }
  }, []);

  const handleMomentumScrollEnd = (e) => {
    const offset = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offset / loopItemWidth);
    setActiveIndex(newIndex);
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#0E2E98" size="large" />
        <Text>Carregando produtos...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider style={styles.container} edges={["top", "left", "right"]}>
      <GlobalBottomBar currentRouteName="Home" navigate={navigation.navigate} />
      <Animated.View style={{ flex: 1, marginBottom: 60 }}>
        <LinearGradient colors={["#0E2E98", "#3E57AC", "#4873FF"]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <Image source={logo} style={styles.logo} />
          <Text style={styles.greeting}>{`Olá, ${greetingName || 'Visitante'}!`}</Text>
          <TouchableOpacity style={styles.notification} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
            {notifCount > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{notifCount > 99 ? '99+' : notifCount}</Text></View>
            )}
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
          <Text style={styles.carouselTitle}>Anúncios de Recomendação</Text>
          <ScrollView ref={scrollViewRef} horizontal pagingEnabled onMomentumScrollEnd={handleMomentumScrollEnd} showsHorizontalScrollIndicator={false} style={styles.carousel}>
            {[anuncios[numAnuncios - 1], ...anuncios, anuncios[0]].map((anuncio, i) => (
              <ImageBackground key={i} source={anuncio.URLImagem} style={[styles.anuncioCard, { width: width * 0.9 }]} imageStyle={{ borderRadius: 15 }}>
                <LinearGradient colors={["rgba(0,0,0,0.1)", "transparent"]} style={styles.anuncioOverlay}>
                  <Text style={styles.anuncioTitulo}>{anuncio.titulo}</Text>
                  <Text style={styles.anuncioDescricao}>{anuncio.descricao}</Text>
                </LinearGradient>
              </ImageBackground>
            ))}
          </ScrollView>
          {numAnuncios > 1 && <PaginationDots total={numAnuncios} activeIndex={activeIndex - 1} onDotPress={(i)=>{ scrollViewRef.current?.scrollTo({ x: (i+1)*loopItemWidth, animated: true}); setActiveIndex(i+1); }} />}

          {topDoMomento.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🔥 Top do Momento</Text>
              <FlatList
                data={topDoMomento}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => {
                  const handler = addHandlers[item.id] || (() => addToCart({ id: item.id, nome: item.nome, preco: Number(item.preco), imageUrl: item.imageUrl }));
                  return (
                    <CardItem
                      key={item.id}
                      title={item.nome}
                      description={item.descricao}
                      price={item.preco}
                      imageUrl={item.imageUrl}
                      style={styles.horizontalCard}
                      onPress={() => navigation.navigate('ProductDetail', { produto: item })}
                      onAdd={handler}
                      reloadKey={reloadKey}
                    />
                  );
                }}
              />
            </>
          )}

          {maisVendidos.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>💎 Mais Vendidos</Text>
              <FlatList
                data={maisVendidos}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => {
                  const handler = addHandlers[item.id] || (() => addToCart({ id: item.id, nome: item.nome, preco: Number(item.preco), imageUrl: item.imageUrl }));
                  return (
                    <CardItem
                      key={item.id}
                      title={item.nome}
                      description={item.descricao}
                      price={item.preco}
                      imageUrl={item.imageUrl}
                      style={styles.horizontalCard}
                      onPress={() => navigation.navigate('ProductDetail', { produto: item })}
                      onAdd={handler}
                      reloadKey={reloadKey}
                    />
                  );
                }}
              />
            </>
          )}

          {maisPesquisados.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>📈 Mais Pesquisados</Text>
              <FlatList
                data={maisPesquisados}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => {
                  const handler = addHandlers[item.id] || (() => addToCart({ id: item.id, nome: item.nome, preco: Number(item.preco), imageUrl: item.imageUrl }));
                  return (
                    <CardItem
                      key={item.id}
                      title={item.nome}
                      description={item.descricao}
                      price={item.preco}
                      imageUrl={item.imageUrl}
                      style={styles.horizontalCard}
                      onPress={() => navigation.navigate('ProductDetail', { produto: item })}
                      onAdd={handler}
                      reloadKey={reloadKey}
                    />
                  );
                }}
              />
            </>
          )}

          <Text style={styles.sectionTitle}>🛒 Produtos</Text>
          <FlatList
            data={produtos}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => {
              const handler = addHandlers[item.id] || (() => addToCart({ id: item.id, nome: item.nome, preco: Number(item.preco), imageUrl: item.imageUrl }));
              return (
                <CardItem
                  key={item.id}
                  title={item.nome}
                  description={item.descricao}
                  price={item.preco}
                  imageUrl={item.imageUrl}
                  style={styles.horizontalCard}
                  onPress={() => navigation.navigate('ProductDetail', { produto: item })}
                  onAdd={handler}
                  reloadKey={reloadKey}
                />
              );
            }}
          />

        </ScrollView>
      </Animated.View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#d9d9d9' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { height: '16%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 22, minHeight: 72, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  logo: { width: 52, height: 52, resizeMode: 'contain', borderRadius: 100 },
  greeting: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '600', marginLeft: 10 },
  notification: { position: 'relative', backgroundColor: '#fff', borderRadius: 1000, padding: 6 },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: 'red', borderRadius: 1000, paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  content: { paddingHorizontal: 10 },
  carouselTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, marginLeft: 10, marginTop: 15 },
  anuncioCard: { borderRadius: 15, height: 150, marginHorizontal: 10, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  anuncioTitulo: { fontSize: 24, fontWeight: 'bold', color: '#000', marginBottom: 5 },
  anuncioDescricao: { fontSize: 14, color: '#000', textAlign: 'center', fontWeight: 'bold', paddingHorizontal: 20 },
  anuncioOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 15, paddingHorizontal: 15 },
  dotContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 5 },
  dot: { width: 10, height: 10, borderRadius: 5, marginHorizontal: 5 },
  dotInactive: { backgroundColor: '#ccc' },
  dotActive: { backgroundColor: '#0E2E98', width: 12, height: 12, borderRadius: 6 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 20, marginLeft: 10 },
  horizontalList: { paddingHorizontal: 12 },
  horizontalCard: { width: 180, marginRight: 12 },
});
