// Dados simulados para teste do app
export const mockProducts = [
  {
    id: 1,
    title: 'Sapato Elegante',
    description: 'Sapato social em couro legítimo, perfeito para ocasiões especiais',
    price: 299.90,
    imageUrl: require('../assets/images/Logo_safira.png'),
    discount: 15,
    rating: 4.5,
  },
  {
    id: 2,
    title: 'Tênis Casual',
    description: 'Tênis confortável para o dia a dia, design moderno',
    price: 199.90,
    imageUrl: require('../assets/images/Logo_safira.png'),
    discount: 20,
    rating: 4.8,
  },
  {
    id: 3,
    title: 'Sandália Feminina',
    description: 'Sandália elegante com salto médio',
    price: 159.90,
    imageUrl: require('../assets/images/Logo_safira.png'),
    discount: 10,
    rating: 4.3,
  },
  {
    id: 4,
    title: 'Bota Masculina',
    description: 'Bota em couro resistente, ideal para o inverno',
    price: 399.90,
    imageUrl: require('../assets/images/Logo_safira.png'),
    discount: 25,
    rating: 4.7,
  }
];

export const mockCategories = [
  {
    id: 1,
    name: 'Sapatos Sociais',
    icon: 'business'
  },
  {
    id: 2,
    name: 'Tênis',
    icon: 'walk'
  },
  {
    id: 3,
    name: 'Sandálias',
    icon: 'sunny'
  },
  {
    id: 4,
    name: 'Botas',
    icon: 'snow'
  }
];

export const mockUser = {
  name: 'Usuário Teste',
  email: 'usuario@teste.com',
  favoriteProducts: [1, 3],
  cartItems: [2, 4]
};