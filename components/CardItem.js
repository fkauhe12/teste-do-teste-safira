import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function CardItem({ 
  title, 
  description, 
  price, 
  imageUrl, 
  onPress, 
  style,
  discount,
  rating,
}) {
  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Imagem do produto */}
      <View style={styles.imageContainer}>
        <Image 
          source={typeof imageUrl === 'string' ? { uri: imageUrl } : imageUrl}
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* Badge de desconto */}
        {discount > 0 && (
          <LinearGradient
            colors={['#FF4B4B', '#FF6B6B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.discountBadge}
          >
            <Text style={styles.discountText}>-{discount}%</Text>
          </LinearGradient>
        )}
      </View>

      {/* Informações do produto */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        
        {description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}

        {/* Preço e avaliação */}
        <View style={styles.footer}>
          <Text style={styles.price}>
            R$ {typeof price === 'number' ? price.toFixed(2) : price}
          </Text>
          
          {rating > 0 && (
            <View style={styles.rating}>
              <Text style={styles.ratingText}>★ {rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  imageContainer: {
    position: 'relative',
    aspectRatio: 1,
    backgroundColor: '#F5F5F5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  info: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#212121',
  },
  description: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4873FF',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#FFA000',
    fontWeight: '500',
  },
});