import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import * as authApi from '../api/auth';
import type { LoginRequest, LoginResponse, Perfil } from '../types';

interface SessaoUsuario {
  nome: string;
  perfil: Perfil;
  empresaId: string | null;
}

interface AuthContextValue {
  usuario: SessaoUsuario | null;
  carregando: boolean;
  entrar: (request: LoginRequest) => Promise<void>;
  sair: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'meuponto:token';
const USUARIO_KEY = 'meuponto:usuario';

function carregarSessaoSalva(): SessaoUsuario | null {
  const raw = localStorage.getItem(USUARIO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessaoUsuario;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<SessaoUsuario | null>(
    carregarSessaoSalva
  );
  const [carregando, setCarregando] = useState(false);

  async function entrar(request: LoginRequest) {
    setCarregando(true);
    try {
      const response: LoginResponse = await authApi.login(request);

      const sessao: SessaoUsuario = {
        nome: response.nome,
        perfil: response.perfil,
        empresaId: response.empresaId,
      };

      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USUARIO_KEY, JSON.stringify(sessao));
      setUsuario(sessao);
    } finally {
      setCarregando(false);
    }
  }

  function sair() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth precisa ser usado dentro de um AuthProvider');
  }
  return context;
}
