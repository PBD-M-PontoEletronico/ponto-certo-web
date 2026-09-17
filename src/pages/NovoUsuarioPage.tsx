import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as usuariosApi from '../api/usuarios';
import * as empresasApi from '../api/empresas';
import { extrairErro } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PERFIL_LABELS, type Empresa, type Perfil } from '../types';

const PERFIS_CADASTRAVEIS: Perfil[] = [
  'RH_ADMIN',
  'GESTOR',
  'FUNCIONARIO',
  'USUARIO_SETOR',
];

// Ação disparada ao enviar o formulário: qual botão foi clicado
type AcaoSalvar = 'continuar' | 'sair';

export function NovoUsuarioPage() {
  const { usuario: usuarioLogado } = useAuth();
  const ehSuperAdmin = usuarioLogado?.perfil === 'SUPERADMIN';

  const navigate = useNavigate();

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  // Controla qual dos dois botões está em loading
  const [acaoSalvando, setAcaoSalvando] = useState<AcaoSalvar | null>(null);

  const [nome, setNome] = useState('');
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState<Perfil>('FUNCIONARIO');
  const [empresaId, setEmpresaId] = useState('');
  const [matricula, setMatricula] = useState('');
  const [cargo, setCargo] = useState('');

  const ehFuncionario = perfil === 'FUNCIONARIO';

  useEffect(() => {
    if (ehSuperAdmin) {
      empresasApi.listarEmpresas().then(setEmpresas).catch(() => {});
    }
  }, [ehSuperAdmin]);

  function limparFormulario() {
    setNome('');
    setLogin('');
    setSenha('');
    setPerfil('FUNCIONARIO');
    setMatricula('');
    setCargo('');
    // Mantém a empresa selecionada ao continuar cadastrando (fluxo mais rápido)
  }

  async function salvar(acao: AcaoSalvar) {
    setErro(null);
    setSucesso(null);
    setAcaoSalvando(acao);

    try {
      await usuariosApi.criarUsuario({
        nome,
        usuario: login,
        senha,
        perfil,
        empresaId: ehSuperAdmin ? empresaId : undefined,
        matricula: ehFuncionario ? matricula : undefined,
        cargo: ehFuncionario ? cargo : undefined,
      });

      const mensagem = `Usuário "${nome}" cadastrado com sucesso.`;

      if (acao === 'sair') {
        navigate('/usuarios', { state: { sucesso: mensagem } });
        return;
      }

      // "salvar e continuar": limpa o formulário e mantém o usuário na página
      setSucesso(mensagem);
      limparFormulario();
    } catch (err) {
      setErro(extrairErro(err).message);
    } finally {
      setAcaoSalvando(null);
    }
  }

  const salvando = acaoSalvando !== null;

  return (
    <div className="mx-auto max-w-xl">
      <header className="mb-8">
        <Link
          to="/usuarios"
          className="mb-2 inline-block text-sm font-medium text-primary hover:underline"
        >
          ← Voltar para Usuários
        </Link>
        <h1 className="text-xl font-semibold text-ink">Cadastrar usuário</h1>
        <p className="mt-1 text-sm text-muted">
          {ehSuperAdmin
            ? 'Cadastre um usuário para qualquer empresa.'
            : 'Cadastre um usuário para a sua empresa.'}
        </p>
      </header>

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          salvar('continuar');
        }}
        className="rounded-lg border border-border bg-surface p-5"
      >
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Nome
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Usuário (login)
            </label>
            <input
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Senha provisória
          </label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
          />
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Perfil
            </label>
            <select
              value={perfil}
              onChange={(e) => setPerfil(e.target.value as Perfil)}
              className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            >
              {PERFIS_CADASTRAVEIS.map((p) => (
                <option key={p} value={p}>
                  {PERFIL_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          {ehSuperAdmin && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Empresa
              </label>
              <select
                value={empresaId}
                onChange={(e) => setEmpresaId(e.target.value)}
                required
                className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              >
                <option value="" disabled>
                  Selecione
                </option>
                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.razaoSocial}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {ehFuncionario && (
          <div className="mb-4 grid grid-cols-2 gap-4 rounded-sm border border-border bg-canvas/50 p-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Matrícula
              </label>
              <input
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                required
                className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Cargo
              </label>
              <input
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
            </div>
          </div>
        )}

        {erro && (
          <p className="mb-4 rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">
            {erro}
          </p>
        )}

        {sucesso && (
          <p className="mb-4 rounded-sm bg-success/10 px-3 py-2 text-sm text-success">
            {sucesso}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={salvando}
            className="flex-1 rounded-sm border border-primary py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
          >
            {acaoSalvando === 'continuar' ? 'Salvando...' : 'Cadastrar e continuar'}
          </button>
          <button
            type="button"
            onClick={() => salvar('sair')}
            disabled={salvando}
            className="flex-1 rounded-sm bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {acaoSalvando === 'sair' ? 'Salvando...' : 'Cadastrar e sair'}
          </button>
        </div>
      </form>
    </div>
  );
}