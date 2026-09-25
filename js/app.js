/* =========================================================
   BURGUER_BYTE — fluxo do totem
   Depende de js/data.js (PRODUCTS, CATEGORIES, ART, artBox)
   ========================================================= */
(() => {
  'use strict';

  /* ---------- utilidades ---------- */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const byId = (id) => PRODUCTS.find((p) => p.id === id);
  const pad2 = (n) => String(n).padStart(2, '0');

  const listPT = (items) =>
    items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;

  const priceSpeech = (n) => {
    const reais = Math.floor(n);
    const cent = Math.round((n - reais) * 100);
    return `${reais} ${reais === 1 ? 'real' : 'reais'}${cent ? ` e ${cent} centavos` : ''}`;
  };

  /* ---------- configuração ---------- */
  const IDLE_LIMIT = 120;            // segundos sem toque até voltar ao início
  const IDLE_WARN  = 15;             // aviso "você ainda está aí?"
  const PIX_LIMIT  = 299;            // validade do código PIX (04:59)
  const PAUSE_IDLE = new Set(['pix', 'card']);   // telas que aguardam o banco
  const SENHA_KEY  = 'burguerbyte:senha';

  /* ---------- cliente logado (js/auth.js) ---------- */
  const sessao = (window.Sessao && Sessao.get()) || {};
  const nomeCliente = sessao.perfil === 'cliente' ? (sessao.nome || '').trim() : '';

  /* ---------- estado ---------- */
  const state = {
    screen: 'welcome',
    category: 'combos',
    productId: null,
    draft: null,               // { id, removed:Set, editKey }
    cart: [],                  // { key, id, removed:[], qty }
    mode: 'local',             // local | levar
    idle: IDLE_LIMIT,
    pix: PIX_LIMIT,
    a11y: { libras: false, audio: false, contrast: false, text: false }
  };

  let pixInterval = null;
  let toastTimer = null;
  let senhaFallback = 401;

  /* ---------- elementos ---------- */
  const app       = $('#app');
  const titleEl   = $('#screenTitle');
  const toastEl   = $('#toast');
  const timerEl   = $('#timer');
  const dlgA11y   = $('#a11yDialog');
  const dlgConf   = $('#confirmDialog');
  const dlgIdle   = $('#idleDialog');

  /* =========================================================
     Carrinho
     ========================================================= */
  const lineKey = (id, removed) => `${id}|${[...removed].sort().join(',')}`;
  const cartCount = () => state.cart.reduce((s, l) => s + l.qty, 0);
  const cartTotal = () => state.cart.reduce((s, l) => s + byId(l.id).price * l.qty, 0);

  function addToCart(id, removed = []) {
    const key = lineKey(id, removed);
    const found = state.cart.find((l) => l.key === key);
    if (found) found.qty += 1;
    else state.cart.push({ key, id, removed, qty: 1 });
    updateOrderbar();
  }

  /* =========================================================
     Renderização das telas
     ========================================================= */
  const productCard = (p) => `
    <button class="product" type="button" data-product="${p.id}">
      ${artBox(p, 'card')}
      ${p.badge ? `<span class="badge">${p.badge}</span>` : ''}
      <span class="product__name">${p.name}</span>
      <span class="product__kcal">${p.kcal} kcal</span>
      <span class="product__price">${brl(p.price)}</span>
    </button>`;

  function renderTabs() {
    $('#tabs').innerHTML = CATEGORIES.map((c) =>
      `<button class="chip" type="button" role="tab" data-cat="${c.id}" aria-selected="${c.id === state.category}">${c.label}</button>`
    ).join('');
  }

  function renderMenu() {
    const cat = CATEGORIES.find((c) => c.id === state.category);
    $$('#tabs .chip').forEach((b) => b.setAttribute('aria-selected', b.dataset.cat === state.category));
    $('#menuHeading').textContent = cat.title;
    $('#productGrid').innerHTML = PRODUCTS.filter((p) => p.cat === cat.id).map(productCard).join('');
    $('.screen[data-screen="menu"] .screen__body').scrollTop = 0;
    updateOrderbar();
  }

  function updateOrderbar() {
    const n = cartCount();
    $('#orderbarTotal').textContent = n
      ? `${brl(cartTotal())} · ${n} ${n === 1 ? 'item' : 'itens'}`
      : 'R$ 0,00 (Vazio)';
    $('#viewCart').disabled = n === 0;
  }

  function renderDetail() {
    const p = byId(state.productId);
    $('#detailBody').innerHTML = `
      ${artBox(p, 'detail')}
      <div class="detail__head">
        <h2 class="detail__name">${p.name}</h2>
        <span class="detail__price">${brl(p.price)}</span>
      </div>
      <p class="detail__desc">${p.desc}</p>
      ${p.includes ? `
        <div class="box">
          <h3 class="box__title">O que está incluso:</h3>
          <ul>${p.includes.map((i) => `<li>${i}</li>`).join('')}</ul>
        </div>` : ''}
      <div class="actions">
        ${p.ingredients ? `<button class="btn btn--primary" type="button" data-action="customize">Personalizar ingredientes</button>` : ''}
        <button class="btn btn--ghost" type="button" data-action="add-direct">Adicionar direto por ${brl(p.price)}</button>
        <button class="link-btn" type="button" data-action="menu">Voltar ao cardápio</button>
      </div>`;
  }

  function customizeRow(name, i, removed) {
    return `
      <button class="toggle-row" type="button" role="switch" data-ing="${i}" aria-checked="${removed}">
        <span>Retirar ${name}</span>
        <span class="tag">${removed ? 'Retirado' : 'Manter'}</span>
      </button>`;
  }

  function renderCustomize() {
    const d = state.draft;
    const p = byId(d.id);
    const isCombo = p.cat === 'combos';
    $('.screen[data-screen="customize"]').dataset.title = isCombo ? 'Personalizar combo' : 'Personalizar item';

    const alert = p.allergens
      ? `<div class="alert" role="note">
           <p class="alert__title">⚠ Alerta de alergênicos!</p>
           <p>Este ${isCombo ? 'combo' : 'item'} contém ${listPT(p.allergens)}. Se você possui restrições severas, por favor avise ao atendente.</p>
         </div>`
      : '';

    $('#customizeBody').innerHTML = `
      ${alert}
      <h2 class="section-title">Remover ingredientes:</h2>
      ${p.ingredients.map((name, i) => customizeRow(name, i, d.removed.has(name))).join('')}
      <button class="btn btn--primary" type="button" data-action="confirm-custom">Confirmar personalização</button>
      <button class="link-btn" type="button" data-action="cancel-custom">Cancelar</button>`;
  }

  function renderCart() {
    const body = $('#cartBody');

    if (!state.cart.length) {
      body.innerHTML = `
        <div class="empty">
          <strong>Seu carrinho está vazio</strong>
          <p>Escolha um combo ou hambúrguer no cardápio para começar o pedido.</p>
          <button class="btn btn--primary" type="button" data-action="menu">Ver cardápio</button>
        </div>`;
      return;
    }

    const lines = state.cart.map((l) => {
      const p = byId(l.id);
      const custom = l.removed.length
        ? `<p class="cart-item__custom">⚙ Personalização: Sem ${listPT(l.removed)}</p>` : '';
      return `
        <article class="cart-item">
          <div class="cart-item__top">
            <span>${l.qty}x ${p.name}</span>
            <span>${brl(p.price * l.qty)}</span>
          </div>
          ${custom}
          <div class="cart-item__actions">
            ${p.ingredients ? `<button class="btn btn--mini" type="button" data-action="edit" data-key="${l.key}">Editar</button>` : ''}
            <button class="btn btn--mini btn--mini-danger" type="button" data-action="remove" data-key="${l.key}">Remover</button>
            <div class="qty" role="group" aria-label="Quantidade de ${p.name}">
              <button type="button" data-action="qty" data-delta="-1" data-key="${l.key}" aria-label="Diminuir" ${l.qty <= 1 ? 'disabled' : ''}>−</button>
              <span aria-live="polite">${l.qty}</span>
              <button type="button" data-action="qty" data-delta="1" data-key="${l.key}" aria-label="Aumentar">+</button>
            </div>
          </div>
        </article>`;
    }).join('');

    body.innerHTML = `
      ${lines}
      <h2 class="section-title">Onde deseja comer?</h2>
      <div class="mode-grid">
        <button class="mode" type="button" data-mode="local" aria-pressed="${state.mode === 'local'}">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 11v10M17 21V3c-2.2 1.5-3.5 4.2-3.5 7.5V14H17"/></svg>
          Comer no local
        </button>
        <button class="mode" type="button" data-mode="levar" aria-pressed="${state.mode === 'levar'}">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2"/></svg>
          Para levar
        </button>
      </div>
      <div class="total-row">
        <span class="total-row__label">Valor total:</span>
        <strong class="total-row__value">${brl(cartTotal())}</strong>
      </div>
      <button class="btn btn--success btn--lg" type="button" data-action="checkout">Prosseguir para o pagamento</button>
      <button class="link-btn" type="button" data-action="menu">Adicionar mais itens</button>`;
  }

  function renderPayment() {
    $('#payTotal').textContent = brl(cartTotal());
  }

  /* ---------- QR Code (demonstração, não é um PIX válido) ---------- */
  function qrSvg(seed) {
    const N = 25;
    let s = (seed >>> 0) || 1;
    const rnd = () => {
      s ^= s << 13; s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5;  s >>>= 0;
      return s / 4294967296;
    };
    const m = Array.from({ length: N }, () => Array.from({ length: N }, () => rnd() > 0.5));

    const finder = (x, y) => {
      for (let i = -1; i <= 7; i++) for (let j = -1; j <= 7; j++) {
        const xx = x + i, yy = y + j;
        if (xx < 0 || yy < 0 || xx >= N || yy >= N) continue;
        const inside = i >= 0 && i <= 6 && j >= 0 && j <= 6;
        const ring = i === 0 || i === 6 || j === 0 || j === 6;
        const core = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        m[yy][xx] = inside && (ring || core);
      }
    };
    finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
    for (let y = 9; y <= 15; y++) for (let x = 9; x <= 15; x++) m[y][x] = false;   // espaço do logo

    let d = '';
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (m[y][x]) d += `M${x} ${y}h1v1h-1z`;

    return `<svg viewBox="-1 -1 ${N + 2} ${N + 2}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
      <rect x="-1" y="-1" width="${N + 2}" height="${N + 2}" fill="#fff"/>
      <path d="${d}" fill="#111"/>
      <rect x="10" y="10" width="5" height="5" rx=".8" fill="#FFD100" stroke="#111" stroke-width=".35" shape-rendering="auto"/>
      <text x="12.5" y="13.9" text-anchor="middle" font-family="Syne, Arial Black, sans-serif" font-weight="800" font-size="3.6" fill="#111" shape-rendering="auto">B</text>
    </svg>`;
  }

  function paintPix() {
    $('#pixTimer').textContent = `${pad2(Math.floor(state.pix / 60))}:${pad2(state.pix % 60)}`;
  }

  function startPix() {
    stopPix();
    state.pix = PIX_LIMIT;
    $('#pixValue').textContent = brl(cartTotal());
    $('#qrCode').innerHTML = qrSvg(Math.round(cartTotal() * 100) + cartCount() * 7919 + nextSenhaPreview());
    paintPix();
    pixInterval = setInterval(() => {
      state.pix -= 1;
      paintPix();
      if (state.pix <= 0) {
        stopPix();
        go('payment');
        toast('O código PIX expirou. Escolha a forma de pagamento novamente.');
      }
    }, 1000);
  }

  function stopPix() {
    if (pixInterval) { clearInterval(pixInterval); pixInterval = null; }
  }

  /* ---------- terminal de cartão ---------- */
  function setCardState(name) {
    $$('.screen[data-screen="card"] [data-when]').forEach((el) => { el.hidden = el.dataset.when !== name; });
    if (name === 'waiting') $('#cardValue').textContent = brl(cartTotal());
    if (state.screen === 'card') speak(SPEECH.card(name));
  }

  /* ---------- senha do pedido ---------- */
  function readSenha() {
    try { return parseInt(localStorage.getItem(SENHA_KEY) || '', 10) || senhaFallback; }
    catch { return senhaFallback; }
  }
  const nextSenhaPreview = () => readSenha() + 1;

  function takeSenha() {
    const n = readSenha() + 1;
    senhaFallback = n;
    try { localStorage.setItem(SENHA_KEY, String(n)); } catch { /* armazenamento indisponível */ }
    return n;
  }

  function finalizeOrder() {
    stopPix();
    const senha = takeSenha();
    $('#ticketNumber').textContent = `#${senha}`;
    state.lastSenha = senha;
    state.cart = [];
    updateOrderbar();
    go('confirmation');
  }

  /* =========================================================
     Navegação
     ========================================================= */
  const RENDER = {
    menu: renderMenu,
    detail: renderDetail,
    customize: renderCustomize,
    cart: renderCart,
    payment: renderPayment
  };

  function go(name) {
    if (state.screen === 'pix' && name !== 'pix') stopPix();
    state.screen = name;
    clearTimeout(toastTimer);
    toastEl.classList.remove('is-visible');

    if (RENDER[name]) RENDER[name]();

    $$('.screen').forEach((s) => { s.hidden = s.dataset.screen !== name; });
    const section = $(`.screen[data-screen="${name}"]`);
    titleEl.textContent = section.dataset.title;
    app.dataset.screen = name;

    const body = $('.screen__body', section);
    if (body && name !== 'menu') body.scrollTop = 0;

    if (name === 'pix') startPix();
    if (name === 'card') setCardState('waiting');

    resetIdle();
    titleEl.focus({ preventScroll: true });
    speak(SPEECH.screen(name));
  }

  /* leave = true: libera o totem e volta para a tela de acesso (index.html) */
  function resetSession(leave = false) {
    stopPix();
    closeDialogs();
    Object.keys(state.a11y).forEach((k) => { if (state.a11y[k]) setA11y(k, false); });
    state.cart = [];
    state.mode = 'local';
    state.draft = null;
    state.category = 'combos';
    updateOrderbar();
    if (leave) {
      if (window.Sessao) Sessao.clear();
      location.href = 'index.html';
      return;
    }
    go('welcome');
  }

  /* =========================================================
     Inatividade
     ========================================================= */
  function paintTimer() {
    $('#timerValue').textContent = state.idle;
    timerEl.classList.toggle('timer--warn', state.idle <= IDLE_WARN);
  }

  function resetIdle() {
    state.idle = IDLE_LIMIT;
    paintTimer();
  }

  function tick() {
    if (state.screen === 'welcome' || PAUSE_IDLE.has(state.screen)) {
      if (state.idle !== IDLE_LIMIT) resetIdle();
      return;
    }
    state.idle -= 1;

    if (state.idle === IDLE_WARN && state.screen !== 'confirmation') {
      dlgIdle.showModal();
      speak('Você ainda está aí? Toque em continuar para manter o pedido.');
    }
    if (dlgIdle.open) $('#idleCount').textContent = Math.max(state.idle, 0);

    if (state.idle <= 0) resetSession(true);
    else paintTimer();
  }

  function closeDialogs() {
    $$('dialog[open]').forEach((d) => d.close());
  }

  /* =========================================================
     Toast e diálogo de confirmação
     ========================================================= */
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2800);
    speak(msg);
  }

  let confirmCb = null;
  function ask({ title, text, ok = 'Confirmar', cancel = 'Voltar', onOk }) {
    $('#confirmTitle').textContent = title;
    $('#confirmText').textContent = text;
    $('#confirmOk').textContent = ok;
    $('#confirmCancel').textContent = cancel;
    confirmCb = onOk;
    dlgConf.showModal();
  }

  /* =========================================================
     Acessibilidade
     ========================================================= */
  const SPEECH = {
    screen(name) {
      const p = state.productId && byId(state.productId);
      const map = {
        welcome: 'Bem-vindo ao Burguer Byte. Toque em iniciar para começar o seu pedido.',
        menu: 'Escolha sua delícia. Use as categorias no topo e toque em um produto.',
        detail: p ? `${p.name}, ${priceSpeech(p.price)}. ${p.desc}` : '',
        customize: 'Personalizar. Toque em um ingrediente para retirá-lo do pedido.',
        cart: state.cart.length
          ? `Seu carrinho tem ${cartCount()} ${cartCount() === 1 ? 'item' : 'itens'}, total de ${priceSpeech(cartTotal())}.`
          : 'Seu carrinho está vazio.',
        payment: 'Como deseja pagar? Escolha PIX ou cartão de crédito e débito.',
        pix: 'Pagamento por PIX. Escaneie o código com o aplicativo do seu banco.',
        card: '',
        confirmation: `Pagamento confirmado. Sua senha é ${String(state.lastSenha || '').split('').join(', ')}.`
      };
      return map[name] || '';
    },
    card(name) {
      return {
        waiting: 'Aproxime ou insira o cartão na maquininha.',
        connecting: 'Reconectando à maquininha. Aguarde.',
        error: 'Conexão com o terminal perdida. Seu cartão não foi cobrado. Escolha uma opção.'
      }[name] || '';
    }
  };

  function speak(text) {
    if (!state.a11y.audio || !text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR';
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }

  let vlibrasReady = false;
  function toggleLibras(on) {
    let host = $('#vlibras');
    if (!on) { if (host) host.hidden = true; return; }
    if (host) { host.hidden = false; return; }

    host = document.createElement('div');
    host.id = 'vlibras';
    host.className = 'enabled';
    host.setAttribute('vw', '');
    host.innerHTML = '<div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
    document.body.appendChild(host);

    const s = document.createElement('script');
    s.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    s.onload = () => {
      try { new window.VLibras.Widget('https://vlibras.gov.br/app'); vlibrasReady = true; }
      catch { toast('Não foi possível iniciar o tradutor de Libras.'); setA11y('libras', false); }
    };
    s.onerror = () => {
      host.remove();
      setA11y('libras', false);
      toast('Não foi possível carregar o tradutor de Libras. Verifique a conexão.');
    };
    document.head.appendChild(s);
  }

  function setA11y(key, on) {
    state.a11y[key] = on;
    $$(`[data-a11y="${key}"]`).forEach((b) => b.setAttribute('aria-pressed', String(on)));

    if (key === 'contrast') document.documentElement.classList.toggle('contrast', on);
    if (key === 'text')     document.documentElement.classList.toggle('large', on);
    if (key === 'libras')   toggleLibras(on);
    if (key === 'audio') {
      if (on) speak(`Áudio guia ativado. ${SPEECH.screen(state.screen)}`);
      else if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
  }

  /* =========================================================
     Ações (botões com data-action)
     ========================================================= */
  const actions = {
    start:   () => go('menu'),
    menu:    () => go('menu'),
    cart:    () => go('cart'),
    payment: () => go('payment'),

    customize() {
      state.draft = { id: state.productId, removed: new Set(), editKey: null };
      go('customize');
    },

    'add-direct'() {
      const p = byId(state.productId);
      addToCart(p.id, []);
      go('menu');
      toast(`${p.name} adicionado ao pedido`);
    },

    'confirm-custom'() {
      const d = state.draft;
      const p = byId(d.id);
      const removed = p.ingredients.filter((i) => d.removed.has(i));

      if (d.editKey) {
        const idx = state.cart.findIndex((l) => l.key === d.editKey);
        const old = state.cart[idx];
        const key = lineKey(d.id, removed);
        const dup = state.cart.find((l, i) => i !== idx && l.key === key);
        if (dup) { dup.qty += old.qty; state.cart.splice(idx, 1); }
        else state.cart[idx] = { ...old, key, removed };
        updateOrderbar();
        go('cart');
        toast('Personalização atualizada');
      } else {
        addToCart(d.id, removed);
        go('menu');
        toast(`${p.name} adicionado ao pedido`);
      }
      state.draft = null;
    },

    'cancel-custom'() {
      const editing = state.draft && state.draft.editKey;
      state.draft = null;
      go(editing ? 'cart' : 'detail');
    },

    edit(el) {
      const line = state.cart.find((l) => l.key === el.dataset.key);
      if (!line) return;
      state.productId = line.id;
      state.draft = { id: line.id, removed: new Set(line.removed), editKey: line.key };
      go('customize');
    },

    remove(el) {
      state.cart = state.cart.filter((l) => l.key !== el.dataset.key);
      updateOrderbar();
      renderCart();
      speak(state.cart.length ? 'Item removido.' : 'Item removido. Seu carrinho está vazio.');
    },

    qty(el) {
      const line = state.cart.find((l) => l.key === el.dataset.key);
      if (!line) return;
      line.qty = Math.max(1, line.qty + Number(el.dataset.delta));
      updateOrderbar();
      renderCart();
      const btn = $(`[data-action="qty"][data-key="${CSS.escape(line.key)}"][data-delta="${el.dataset.delta}"]`);
      if (btn && !btn.disabled) btn.focus({ preventScroll: true });
    },

    checkout: () => go('payment'),
    'pay-pix': () => go('pix'),
    'pay-card': () => go('card'),

    'pix-cancel'() {
      ask({
        title: 'Cancelar o pagamento?',
        text: 'O código PIX será descartado e você voltará às formas de pagamento. Seu pedido continua salvo.',
        ok: 'Cancelar PIX',
        cancel: 'Continuar',
        onOk: () => go('payment')
      });
    },
    'pix-simulate': finalizeOrder,

    'card-ok': finalizeOrder,
    'card-fail': () => setCardState('error'),
    'card-retry'() {
      setCardState('connecting');
      setTimeout(() => { if (state.screen === 'card') setCardState('waiting'); }, 1600);
    },

    'cancel-order'() {
      ask({
        title: 'Cancelar o pedido?',
        text: 'Todos os itens serão removidos e o totem volta para a tela inicial. Nenhuma cobrança foi feita.',
        ok: 'Cancelar pedido',
        cancel: 'Voltar',
        onOk: () => resetSession()
      });
    },

    reprint() {
      const n = String(state.lastSenha || '');
      toast(`Sua senha é ${n}. Se precisar, chame um atendente.`);
      speakForce(`Sua senha é ${n.split('').join(', ')}.`);
    },

    finish: () => resetSession(true)
  };

  /* fala mesmo com o áudio guia desligado (recurso de contingência do cupom) */
  function speakForce(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }

  /* =========================================================
     Eventos
     ========================================================= */
  document.addEventListener('click', (e) => {
    const t = e.target;

    const act = t.closest('[data-action]');
    if (act && actions[act.dataset.action]) { actions[act.dataset.action](act); return; }

    const prod = t.closest('[data-product]');
    if (prod) { state.productId = prod.dataset.product; go('detail'); return; }

    const cat = t.closest('[data-cat]');
    if (cat) { state.category = cat.dataset.cat; renderMenu(); return; }

    const mode = t.closest('[data-mode]');
    if (mode) { state.mode = mode.dataset.mode; renderCart(); $(`.mode[data-mode="${state.mode}"]`).focus({ preventScroll: true }); return; }

    const ing = t.closest('[data-ing]');
    if (ing && state.draft) {
      const p = byId(state.draft.id);
      const name = p.ingredients[Number(ing.dataset.ing)];
      const removed = !state.draft.removed.has(name);
      if (removed) state.draft.removed.add(name); else state.draft.removed.delete(name);
      ing.setAttribute('aria-checked', String(removed));
      $('.tag', ing).textContent = removed ? 'Retirado' : 'Manter';
      speak(`${name}: ${removed ? 'retirado' : 'mantido'}.`);
      return;
    }

    const a11y = t.closest('[data-a11y]');
    if (a11y) { setA11y(a11y.dataset.a11y, !state.a11y[a11y.dataset.a11y]); return; }

    if (t.closest('[data-dialog-close]')) closeDialogs();
  });

  $('#a11yOpen').addEventListener('click', () => dlgA11y.showModal());

  $('#confirmOk').addEventListener('click', () => { dlgConf.close(); if (confirmCb) confirmCb(); confirmCb = null; });
  $('#confirmCancel').addEventListener('click', () => { dlgConf.close(); confirmCb = null; });

  $('#idleContinue').addEventListener('click', () => { dlgIdle.close(); resetIdle(); });
  $('#idleEnd').addEventListener('click', () => { dlgIdle.close(); resetSession(true); });

  /* qualquer toque reinicia a contagem de inatividade */
  const touch = () => { if (!dlgIdle.open) resetIdle(); };
  document.addEventListener('pointerdown', touch, true);
  document.addEventListener('keydown', touch, true);

  /* áudio guia: lê o botão que recebe foco (teclado / botoeira do totem) */
  document.addEventListener('focusin', (e) => {
    if (!state.a11y.audio) return;
    const el = e.target.closest('button');
    if (!el || el === titleEl) return;
    const label = el.getAttribute('aria-label') || el.textContent.replace(/\s+/g, ' ').trim();
    speak(label);
  });

  /* =========================================================
     Início
     ========================================================= */
  if (nomeCliente) $('.screen[data-screen="welcome"]').dataset.title = `Bem-vindo, ${nomeCliente}!`;
  $('#heroArt').innerHTML = ART('combo');
  renderTabs();
  updateOrderbar();
  go('welcome');
  setInterval(tick, 1000);
})();
