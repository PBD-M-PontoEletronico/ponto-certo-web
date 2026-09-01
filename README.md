# MeuPonto — Painel Web

Front-end (React + TypeScript + Vite + Tailwind CSS) do sistema de ponto,
implementando o módulo **WEB 01** (empresas, usuários e autenticação).

Este projeto consome a API Spring Boot (`com.mobdata.meuponto`) já construída.

## Stack

- **React 18** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** (estilização)
- **React Router** (rotas e proteção por perfil)
- **Axios** (chamadas HTTP)

## Como rodar

### 1. Instale as dependências

```bash
npm install
```

### 2. Configure a URL da API

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Por padrão, `.env` aponta para `http://localhost:8080` — ajuste se sua API
rodar em outra porta/endereço.

### 3. Rode em modo desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:5173`.

## Estrutura de pastas

```
src/
├── api/            # Funções que chamam a API (uma por recurso: auth, empresas, usuarios)
├── components/      # Componentes reutilizáveis (Layout)
├── context/          # AuthContext — guarda sessão, token, perfil do usuário logado
├── pages/            # Telas (Login, Dashboard, Empresas, Usuarios)
├── routes/            # ProtectedRoute — bloqueia acesso por autenticação/perfil
└── types/              # Tipos TypeScript espelhando os DTOs do backend Java
```

## Como a autenticação funciona

1. `LoginPage` chama `AuthContext.entrar()`, que por sua vez chama a API `/auth/login`
2. O token JWT retornado é guardado no `localStorage` (`meuponto:token`)
3. `src/api/client.ts` tem um **interceptor** que anexa esse token em toda
   requisição subsequente (`Authorization: Bearer <token>`)
4. Se a API responder `401` (token inválido/expirado), o interceptor desloga
   automaticamente e redireciona pro `/login`
5. `ProtectedRoute` bloqueia acesso a rotas que exigem login, e também pode
   restringir por perfil (ex: `/empresas` só é acessível a `SUPERADMIN`)

⚠️ **Importante**: a proteção de rotas no front-end é só uma camada de UX
(evita mostrar telas que a pessoa não devia ver). A segurança de verdade
**sempre** é validada de novo no backend (`SecurityConfig.java`), em cada
requisição — nunca confie só na validação do front-end.

## Endpoints da API consumidos

| Método | Rota | Perfil exigido |
|---|---|---|
| `POST` | `/auth/login` | Público |
| `GET` | `/empresas` | `SUPERADMIN` |
| `POST` | `/empresas` | `SUPERADMIN` |
| `PATCH` | `/empresas/{id}/situacao?ativa=bool` | `SUPERADMIN` |
| `POST` | `/usuarios` | `SUPERADMIN`, `RH_ADMIN` |
| `GET` | `/usuarios` | ⚠️ **ainda não existe no backend** — ver nota abaixo |

### Pendência conhecida no backend

O `UsuarioController` do backend, até o momento, só tem o endpoint de
cadastro (`POST /usuarios`) — não há um `GET /usuarios` pra listar. Por isso
a `UsuariosPage` deste front-end **não lista** os usuários já cadastrados,
só mostra o formulário de criação. A função `listarUsuarios()` já está
pronta em `src/api/usuarios.ts`, esperando esse endpoint ser criado no
backend (seguindo o mesmo padrão usado em `SetorRepository`, filtrando por
empresa via `TenantContext`).

## Paleta de cores (design tokens)

Definidos em `tailwind.config.js`:

| Token | Hex | Uso |
|---|---|---|
| `primary` | `#2B3A67` | Ações principais, navegação ativa |
| `accent` | `#C68A2E` | Destaques pontuais |
| `canvas` | `#F7F7F5` | Fundo da aplicação |
| `surface` | `#FFFFFF` | Cartões, formulários |
| `success` | `#2F7A52` | Estados positivos (empresa ativa) |
| `danger` | `#B84234` | Erros, estados negativos |

