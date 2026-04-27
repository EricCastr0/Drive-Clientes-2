# Instruções de Desenvolvimento

## 2026-04-17 - Início do Projeto "Drive Clientes 2"
O usuário solicitou:
> Vamos criar uma plicação semelhante ao google drive e onedrive. Essa aplicação será localmente para poder ter o controle dos arquivos de clientes da minha empresa. Me apresente um projeto moderno, e que seja de fácil acesso e entendimento dos meus colaboradores

### Escopo Inicial:
- Aplicação moderna inspirada em Google Drive/OneDrive.
- Foco em controle local de arquivos de clientes.
- Interface intuitiva para colaboradores.
- Tecnologias: Vite, React, Vanilla CSS, Express.

## 2026-04-17 - Inicialização e Desenvolvimento Inicial
- Estrutura base criada (`/client` e `/server`).
- Servidor Express configurado com rotas para listar arquivos, upload e criação de pastas.
- Interface React implementada com Design System moderno (Dark Mode + Glassmorphism).
- Integração de API concluída para visualização de arquivos locais em tempo real.
- Funcionalidades de "Novo Upload" e "Nova Pasta" adicionadas.
- Navegação real entre pastas e Breadcrumbs funcionais implementados.
- Painel de Detalhes lateral implementado com informações de metadados e pré-visualização.
- Ajuste de interface: Redução da largura dos painéis laterais para maximizar a área de conteúdo.
- Barra de Ações Superior: Redesenhada para seguir o padrão visual do Google Drive (referência do usuário).
- Download de Arquivos: Corrigido e otimizado para maior compatibilidade com navegadores.
- Atalho de Download: Adicionado botão de download rápido diretamente nos cards de arquivos.
- Limpeza de Interface: Removidas opções de "Compartilhados" e "Lixeira" do menu lateral.
- Funcionalidade de Resumo: Implementado o "Resumo de Informações" básico.
- Busca em Tempo Real: Barra de pesquisa agora filtra arquivos instantaneamente na pasta atual.
- Animações Fluidas: Implementado Framer Motion para transições de cards, painéis e modais.
- Exclusão de Arquivos: Botão de lixeira agora funcional com confirmação e exclusão real no servidor.
- Renomeação Inteligente: Agora o sistema preserva a extensão do arquivo automaticamente e solicita apenas o novo nome.
- Armazenamento em Tempo Real: Implementado cálculo automático do espaço usado na pasta `storage`, com barra de progresso e limites reais.
- Integração Supabase Auth: Implementada tela de login premium conectada diretamente ao seu Supabase. Agora o sistema é protegido e exige autenticação.
- Perfil de Usuário: Adicionado exibição de e-mail e avatar dinâmico na barra lateral, além da funcionalidade de Logout.
- Documentação: Criado `README.md` intuitivo e moderno para o repositório no GitHub, detalhando funcionalidades, tecnologias e guia de instalação.
- Rebranding: Aplicação renomeada para **InfoDrive**. O esquema de cores principal foi alterado de roxo/índigo para **azul**, refletindo a nova identidade visual em todo o CSS e componentes React.
- Rastreamento de Metadados: Implementado sistema de armazenamento de metadados (`.metadata.json`) no servidor. Agora o sistema registra e exibe o **Proprietário** (usuário que fez o upload) e a **Data de Upload** no painel de detalhes e no resumo de cada arquivo ou pasta.
- Limpeza de Interface: Removida a opção de "Resumo" do menu superior para simplificar a barra de ferramentas.
- Acesso via Rede: Configurada a aplicação para ser acessível por outros dispositivos na mesma rede local. O frontend agora utiliza `window.location.hostname` para chamadas de API, e o servidor Vite foi configurado para aceitar conexões externas (`--host`). O backend também exibe agora o IP da rede local ao iniciar.
## 2026-04-24 - Correção de Nomenclatura e Codificação de Arquivos
- O usuário solicitou a remoção dos códigos numéricos (timestamps) adicionados automaticamente ao início dos nomes dos arquivos no upload.
- Corrigido o problema de codificação UTF-8 onde caracteres especiais (ç, ã, etc.) ficavam desconfigurados.
- Implementada a decodificação de `latin1` para `utf8` utilizando `Buffer` na configuração do Multer para garantir a integridade dos nomes dos arquivos originais.

## 2026-04-27 - Implementação de Drag and Drop
- Adicionada funcionalidade de arrastar e soltar arquivos para upload direto em qualquer lugar da aplicação.
- Implementado overlay visual dinâmico com animações via Framer Motion para feedback de arraste.
- Refatorada a lógica de upload para suportar múltiplos arquivos simultaneamente.
- Adicionado indicador global de progresso de upload no canto superior direito.
- Utilização do ícone `UploadCloud` da Lucide para o overlay de arraste.

