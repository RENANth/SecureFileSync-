
# SafeShare - Plataforma Segura de Compartilhamento de Arquivos

## Sobre o Projeto

SafeShare é uma plataforma web para compartilhamento seguro de arquivos com criptografia, links expiráveis e registro de atividades.

## Tecnologias Utilizadas

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Radix UI (componentes de interface)
- React Query (gerenciamento de estado e cache)
- React Hook Form (formulários)

### Backend
- Node.js
- Express
- TypeScript
- DrizzleORM (banco de dados)
- NeonDB (PostgreSQL serverless)
- Multer (upload de arquivos)

## Funcionalidades

- Upload de arquivos
- Compartilhamento via links seguros
- Criptografia dos arquivos
- Logs de atividade
- Interface responsiva
- Gestão de arquivos
- Links com expiração

## Como Usar

1. Clone o projeto no Replit
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente no Secrets do Replit:
- `DATABASE_URL`: URL do banco de dados PostgreSQL
- `SESSION_SECRET`: Chave secreta para sessões
- `ENCRYPTION_KEY`: Chave para criptografia dos arquivos

4. Execute o projeto:
```bash
npm run dev
```

O servidor estará disponível em `http://0.0.0.0:5000`

## Estrutura do Projeto

```
├── client/          # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── hooks/      # Hooks personalizados
│   │   ├── lib/        # Utilitários
│   │   └── pages/      # Páginas da aplicação
├── server/          # Backend Express
│   ├── db.ts       # Configuração do banco
│   ├── routes.ts   # Rotas da API
│   └── storage.ts  # Gerenciamento de arquivos
└── shared/         # Código compartilhado
    └── schema.ts   # Schemas do banco
```

## Scripts Disponíveis

- `npm run dev`: Inicia o ambiente de desenvolvimento
- `npm run build`: Compila o projeto para produção
- `npm run start`: Inicia o servidor em produção
- `npm run check`: Verifica tipos TypeScript
- `npm run db:push`: Atualiza o esquema do banco de dados

## Requisitos

- Node.js 20+
- NPM ou Yarn
- Conta no Replit
- Banco de dados PostgreSQL (recomendado NeonDB)
