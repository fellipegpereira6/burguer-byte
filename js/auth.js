/* =========================================================
   BURGUER_BYTE — sessão e proteção de páginas

   Como usar (no <head>, antes de qualquer conteúdo):
     <script src="js/auth.js" data-exigir="admin"></script>    só administrador
     <script src="js/auth.js" data-exigir="qualquer"></script> qualquer perfil logado

   ATENÇÃO — PROTÓTIPO: como não existe servidor, o login é conferido
   aqui no navegador e a senha fica visível no código. Isso NÃO protege
   nada de verdade. Em produção, valide usuário e senha em um backend
   (com sessão/token) e remova ADMIN_DEMO daqui.
   ========================================================= */
(() => {
  'use strict';

  const KEY = 'burguerbyte:sessao';
  const ADMIN_DEMO = { usuario: 'admin', senha: 'byte2026' };

  const alvo = document.currentScript && document.currentScript.dataset.exigir;

  function armazenamento() {
    try {
      const s = window.sessionStorage;
      s.setItem('__teste', '1');
      s.removeItem('__teste');
      return s;
    } catch {
      return null;
    }
  }

  const Sessao = {
    disponivel: () => !!armazenamento(),

    get() {
      const s = armazenamento();
      if (!s) return null;
      try { return JSON.parse(s.getItem(KEY) || 'null'); } catch { return null; }
    },

    set(perfil, dados = {}) {
      const s = armazenamento();
      if (!s) return false;
      s.setItem(KEY, JSON.stringify({ perfil, ...dados, em: Date.now() }));
      return true;
    },

    clear() {
      const s = armazenamento();
      if (s) s.removeItem(KEY);
    },

    validarAdmin(usuario, senha) {
      return String(usuario).trim().toLowerCase() === ADMIN_DEMO.usuario && senha === ADMIN_DEMO.senha;
    },

    /* Redireciona para a tela de acesso se o perfil exigido não estiver logado. */
    exigir(perfil) {
      const sessao = this.get();

      if (perfil === 'admin') {
        if (!sessao || sessao.perfil !== 'admin') location.replace('index.html?acesso=admin');
        return;
      }
      // qualquer perfil: se o navegador bloqueia o armazenamento, deixa passar
      if (!sessao && this.disponivel()) location.replace('index.html');
    }
  };

  window.Sessao = Sessao;
  if (alvo) Sessao.exigir(alvo);
})();
