/* =========================================================
   BURGUER_BYTE — fechamento diário
   Imprimir, exportar CSV e fechar o caixa (demonstração)
   ========================================================= */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);

  const toastEl = $('#toast');
  const dialog = $('#closeDialog');
  const form = $('#closeForm');
  const justify = $('#justify');
  const justifyError = $('#justifyError');
  const btnClose = $('#btnClose');
  let toastTimer = null;

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 3000);
  }

  /* ---------- sessão do administrador ---------- */
  const sessao = Sessao.get();
  if (sessao && sessao.usuario) $('#userName').textContent = sessao.usuario;

  $('#btnLogout').addEventListener('click', () => {
    Sessao.clear();
    location.href = 'index.html';
  });

  /* ---------- imprimir ---------- */
  $('#btnPrint').addEventListener('click', () => window.print());

  /* ---------- exportar relatório (CSV compatível com Excel pt-BR) ---------- */
  const csvCell = (v) => `"${String(v).replace(/"/g, '""').replace(/\s+/g, ' ').trim()}"`;

  $('#btnExport').addEventListener('click', () => {
    const rows = [];

    rows.push(['Burguer Byte — Fechamento diário']);
    rows.push(['Data', 'Segunda-feira, 21 de setembro']);
    document.querySelectorAll('.stat').forEach((s) => {
      rows.push([$('.stat__label', s).textContent, $('.stat__value', s).textContent]);
    });

    rows.push([]);
    rows.push(['Formas de pagamento']);
    rows.push(['Forma', 'Valor', 'Participação']);
    document.querySelectorAll('.legend li').forEach((li) => {
      rows.push([$('span', li).textContent, $('b', li).textContent, $('em', li).textContent]);
    });

    rows.push([]);
    rows.push(['Vendas recentes']);
    document.querySelectorAll('#salesTable tr').forEach((tr) => {
      rows.push([...tr.children].map((c) => c.textContent));
    });

    const csv = '\uFEFF' + rows.map((r) => r.map(csvCell).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fechamento-burguer-byte-2026-09-21.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Relatório exportado');
  });

  /* ---------- fechar o caixa ---------- */
  btnClose.addEventListener('click', () => {
    justify.value = '';
    justifyError.hidden = true;
    dialog.showModal();
    justify.focus();
  });

  $('#closeCancel').addEventListener('click', () => dialog.close());

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (justify.value.trim().length < 3) {
      justifyError.hidden = false;
      justify.focus();
      return;
    }
    dialog.close();

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');

    const card = $('#cashCard');
    card.classList.remove('stat--alert');
    card.classList.add('stat--closed');
    $('.stat__note', card).textContent = `Caixa fechado às ${hh}:${mm}`;

    btnClose.disabled = true;
    $('#btnCloseLabel').textContent = 'Caixa fechado';
    toast('Caixa fechado com sucesso');
  });

  justify.addEventListener('input', () => { justifyError.hidden = true; });
})();
