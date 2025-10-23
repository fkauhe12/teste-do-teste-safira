# Safira App

Aplicativo React Native/Expo com interface moderna e funcionalidades de e-commerce.

## 📁 Estrutura do Projeto

```
teste-do-teste-safira/
│
├─ assets/                 # Arquivos estáticos
│   ├─ images/            # Imagens (ex: logos, splash)
│   ├─ fonts/            # Fontes customizadas
│   └─ icons/            # Ícones do app
│
├─ components/            # Componentes reutilizáveis
│   └─ ...              # Seus componentes compartilhados
│
├─ hooks/                # Custom Hooks
│   └─ useEndereco.js   # Hook para gerenciar endereços
│
├─ services/             # Serviços e integrações
│   ├─ _firebase.js     # Configuração do Firebase
│   └─ api.js           # Cliente API REST
│
├─ screens/              # Telas do app
│   ├─ HomeScreen.js
│   ├─ CartScreen.js
│   ├─ SearchScreen.js
│   └─ ...
│
├─ navigation/           # Configuração de navegação
│   └─ AppNavigator.js  # Navegação principal
│
└─ App.js               # Entrada do app
```

## 🚀 Como Executar

1. Instale as dependências:
```bash
npm install
```

2. Inicie o app:
```bash
npm start
# ou
expo start
```

3. Use o app Expo Go no seu dispositivo ou execute em um emulador.

## 📱 Funcionalidades

- Login/Cadastro de usuários
- Navegação por tabs
- Carrinho de compras
- Busca de produtos
- Gerenciamento de endereços

## 🛠 Tecnologias

- React Native
- Expo
- React Navigation
- Firebase (autenticação/banco de dados)
- Axios para requisições HTTP
