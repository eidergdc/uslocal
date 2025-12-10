# US LOCAL - Marketplace Brasileiro nos EUA

Um PWA (Progressive Web App) marketplace para conectar brasileiros que vivem nos Estados Unidos, oferecendo serviços e locais da comunidade.

## 🚀 Funcionalidades

### Core Features
- ✅ Sistema de autenticação Firebase (Email/Password + Anônimo)
- ✅ Marketplace com aprovação de itens
- ✅ Mapa interativo Google Maps com clustering
- ✅ Sistema de avaliações e comentários
- ✅ Favoritos e histórico de visualizações
- ✅ Painel administrativo completo
- ✅ PWA com service worker e manifest
- ✅ Busca avançada com filtros
- ✅ Upload de imagens Firebase Storage
- ✅ Sistema de banners rotativos

### Páginas
- **Home (/)**: Busca, filtros, carrossel de banners, lista/mapa de itens
- **Item Detail (/item/:id)**: Galeria, avaliações, ações (Maps, WhatsApp, etc.)
- **Cadastrar (/cadastrar)**: Formulário completo para novos itens
- **Perfil (/perfil)**: Gerenciar conta, itens e favoritos
- **Admin (/admin)**: Moderação e métricas (apenas role=admin)

## 🔧 Configuração

### 1. Firebase
As credenciais do Firebase já estão configuradas em `src/config/firebase.ts`.

### 2. Google Maps
Configure sua chave da API no arquivo `src/config/maps.ts`:
```typescript
export const GOOGLE_MAPS_CONFIG = {
  apiKey: 'SUA_CHAVE_GOOGLE_MAPS_API_KEY',
  // ...
};
```

### 3. Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:
```
REACT_APP_GOOGLE_MAPS_API_KEY=sua_chave_aqui
REACT_APP_ADMIN_EMAILS=admin@exemplo.com,outro@exemplo.com
```

## 🗄️ Estrutura do Banco (Firestore)

### Coleções
- **users**: Dados dos usuários
- **items**: Serviços e locais
- **reviews**: Avaliações dos itens
- **banners**: Banners do carrossel
- **categories**: Categorias de serviços

### Regras de Segurança (Firestore Rules)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Items are publicly readable if approved
    match /items/{itemId} {
      allow read: if resource.data.status == 'approved';
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.ownerId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Reviews
    match /reviews/{reviewId} {
      allow read: if resource.data.reported == false;
      allow create: if request.auth != null && !request.auth.token.firebase.sign_in_provider == 'anonymous';
    }
    
    // Banners and categories are publicly readable
    match /banners/{bannerId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /items/{itemId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /profile-photos/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🎨 Design System

### Cores Principais
- **Verde Brasil**: #009739 (Primary)
- **Amarelo Brasil**: #FEDD00 (Secondary)
- **Azul Brasil**: #012169 (Accent)
- **Vermelho EUA**: #B22234 (Error)
- **Azul EUA**: #3C3B6E (Info)

### Componentes
- Cards responsivos com hover effects
- Sistema de avaliação por estrelas
- Galeria de imagens com modal
- Mapa interativo com clustering
- Filtros avançados colapsáveis

## 🧪 Seeds de Teste

Execute o seguinte código no console do navegador para popular o banco:
```typescript
import { seedDatabase } from './src/utils/seeds';
seedDatabase();
```

## 📱 PWA Features
- Manifest configurado
- Service Worker para cache
- Ícones otimizados
- Funcionalidade offline básica

## 🔐 Segurança
- Row Level Security implementado
- Validação de formulários
- Sanitização de dados
- Prevenção de XSS

## 🚀 Como Executar

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente

3. Execute o projeto:
```bash
npm run dev
```

4. Para produção:
```bash
npm run build
```

## 📊 Funcionalidades Admin

- Aprovar/rejeitar novos itens
- Destacar itens em banners
- Verificar prestadores
- Visualizar métricas
- Moderar conteúdo

## 🌐 Internacionalização

O app suporta português (padrão) e inglês. Para trocar o idioma, use:
```typescript
import { setLanguage } from './src/i18n';
setLanguage('en-US'); // ou 'pt-BR'
```

## 🤝 Contribuição

Este é um projeto marketplace completo e funcional, pronto para produção com todas as funcionalidades implementadas.