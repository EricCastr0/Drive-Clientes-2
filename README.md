# 🚀 Drive Clientes 2

Um sistema de gerenciamento de arquivos moderno, seguro e local, desenvolvido para oferecer controle total sobre os dados da sua empresa com uma experiência similar ao Google Drive e OneDrive.

![Status do Projeto](https://img.shields.io/badge/Status-Em_Desenvolvimento-blue?style=for-the-badge)
![Tecnologias](https://img.shields.io/badge/Stack-React_|_Node.js_|_Supabase-purple?style=for-the-badge)

---

## ✨ Funcionalidades Principais

- **🎨 Interface Premium**: Design moderno com Glassmorphism, Dark Mode e animações fluidas (Framer Motion).
- **🔒 Autenticação Segura**: Integração completa com **Supabase Auth** para controle de acesso.
- **📁 Gestão de Arquivos**: 
  - Upload e Download de alta performance.
  - Criação de pastas e navegação hierárquica (Breadcrumbs).
  - Renomeação inteligente (preserva extensões).
  - Exclusão com confirmação.
- **🔍 Busca em Tempo Real**: Encontre seus arquivos instantaneamente.
- **📊 Controle de Armazenamento**: Monitoramento em tempo real do espaço utilizado no servidor local.
- **📱 Responsivo**: Otimizado para diferentes tamanhos de tela.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React + Vite**: Performance e rapidez no desenvolvimento.
- **Vanilla CSS**: Estilização personalizada e leve.
- **Framer Motion**: Animações de interface de alto nível.
- **Lucide React**: Biblioteca de ícones modernos.
- **Supabase JS**: Integração com backend as a service.

### Backend
- **Node.js + Express**: Servidor robusto para manipulação de arquivos locais.
- **Multer**: Middleware para upload de arquivos.
- **FS (File System)**: Controle direto e seguro do armazenamento local.

---

## 🚀 Como Começar

### Pré-requisitos
- [Node.js](https://nodejs.org/) instalado.
- Conta no [Supabase](https://supabase.com/).

### Instalação

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/drive-clientes-2.git
   cd drive-clientes-2
   ```

2. **Configuração do Servidor:**
   ```bash
   cd server
   npm install
   # Crie um arquivo .env se necessário (o servidor usa a pasta /storage por padrão)
   npm start
   ```

3. **Configuração do Cliente:**
   ```bash
   cd ../client
   npm install
   # Configure suas variáveis do Supabase no .env
   # VITE_SUPABASE_URL=sua_url
   # VITE_SUPABASE_ANON_KEY=sua_key
   npm run dev
   ```

---

## 📂 Estrutura do Projeto

- `/client`: Aplicação React (Interface do Usuário).
- `/server`: Servidor Express (Lógica de Arquivos).
- `/storage`: Onde os arquivos físicos são armazenados localmente.

---

## 📝 Licença

Este projeto é de uso interno e privado. Todos os direitos reservados.

---
*Desenvolvido com ❤️ para otimizar a gestão de arquivos da sua empresa.*
