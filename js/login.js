/* =========================================================
   BURGUER_BYTE — tela de acesso
   Escolha entre cliente (loja) e administrador (painel)
   Depende de js/auth.js (Sessao) e js/data.js (ART)
   ========================================================= */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);

  const MAX_TENTATIVAS = 5;
  const BLOQUEIO_SEG = 30;

  /* chegar aqui equivale a sair: qualquer sessão anterior é encerrada */
  Sessao.clear();

  $('#heroArt').innerHTML = ART('combo');

  /* ---------- abas: cliente | administrador ---------- */
  const tabs = [...document.querySelectorAll('.role')];
  const panes = { cliente: $('#painel-cliente'), admin: $('#painel-admin') };

  function selecionar(perfil, { foco = false } = {}) {
    tabs.forEach((t) => {
      const ativo = t.dataset.perfil === perfil;
      t.setAttribute('aria-selected', String(ativo));
      t.tabIndex = ativo ? 0 : -1;
      if (ativo && foco) t.focus();
    });
    Object.entries(panes).forEach(([nome, el]) => { el.hidden = nome !== perfil; });
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      selecionar(tab.dataset.perfil);
      const alvo = tab.dataset.perfil === 'admin' ? $('#usuario') : $('#nome');
      alvo.focus();
    });
    tab.addEventListener('keydown', (e) => {
      const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!dir) return;
      e.preventDefault();
      const prox = tabs[(i + dir + tabs.length) % tabs.length];
      selecionar(prox.dataset.perfil, { foco: true });
    });
  });

  /* ---------- cliente ---------- */
  $('#formCliente').addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = $('#nome').value.trim().replace(/\s+/g, ' ').slice(0, 20);
    Sessao.set('cliente', { nome });      // sem armazenamento, a loja abre do mesmo jeito
    location.href = 'loja.html';
  });

  /* ---------- administrador ---------- */
  const formAdmin = $('#formAdmin');
  const usuario = $('#usuario');
  const senha = $('#senha');
  const erro = $('#erro');
  const aviso = $('#aviso');
  const entrar = $('#entrarAdmin');

  let tentativas = 0;
  let bloqueadoAte = 0;
  let relogio = null;

  function mostrarErro(msg, campos = []) {
    erro.textContent = msg;
    erro.hidden = false;
    [usuario, senha].forEach((c) => c.removeAttribute('aria-invalid'));
    campos.forEach((c) => c.setAttribute('aria-invalid', 'true'));
  }

  function limparErro() {
    erro.hidden = true;
    [usuario, senha].forEach((c) => c.removeAttribute('aria-invalid'));
  }

  function iniciarBloqueio() {
    bloqueadoAte = Date.now() + BLOQUEIO_SEG * 1000;
    entrar.disabled = true;
    clearInterval(relogio);
    const atualizar = () => {
      const resta = Math.ceil((bloqueadoAte - Date.now()) / 1000);
      if (resta <= 0) {
        clearInterval(relogio);
        entrar.disabled = false;
        tentativas = 0;
        limparErro();
        return;
      }
      mostrarErro(`Muitas tentativas. Tente novamente em ${resta}s.`);
    };
    atualizar();
    relogio = setInterval(atualizar, 1000);
  }

  formAdmin.addEventListener('submit', (e) => {
    e.preventDefault();
    if (Date.now() < bloqueadoAte) return;

    const u = usuario.value.trim();
    const s = senha.value;

    if (!u && !s) { mostrarErro('Informe o usuário e a senha.', [usuario, senha]); usuario.focus(); return; }
    if (!u)       { mostrarErro('Informe o usuário.', [usuario]); usuario.focus(); return; }
    if (!s)       { mostrarErro('Informe a senha.', [senha]); senha.focus(); return; }

    if (!Sessao.validarAdmin(u, s)) {
      tentativas += 1;
      if (tentativas >= MAX_TENTATIVAS) { iniciarBloqueio(); return; }
      const restam = MAX_TENTATIVAS - tentativas;
      mostrarErro(`Usuário ou senha incorretos. Restam ${restam} ${restam === 1 ? 'tentativa' : 'tentativas'}.`, [usuario, senha]);
      senha.select();
      return;
    }

    if (!Sessao.set('admin', { usuario: u.toLowerCase() })) {
      mostrarErro('Seu navegador está bloqueando o armazenamento da sessão. Libere e tente de novo.');
      return;
    }
    location.href = 'admin.html';
  });

  [usuario, senha].forEach((c) => c.addEventListener('input', () => { if (Date.now() >= bloqueadoAte) limparErro(); }));

  /* mostrar / ocultar senha */
  const ver = $('#verSenha');
  ver.addEventListener('click', () => {
    const mostrar = senha.type === 'password';
    senha.type = mostrar ? 'text' : 'password';
    ver.textContent = mostrar ? 'Ocultar' : 'Mostrar';
    ver.setAttribute('aria-pressed', String(mostrar));
    ver.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
  });

  /* veio de uma página protegida sem estar logado */
  if (new URLSearchParams(location.search).get('acesso') === 'admin') {
    selecionar('admin');
    aviso.textContent = 'Entre como administrador para abrir o painel.';
    aviso.hidden = false;
  }
})();
