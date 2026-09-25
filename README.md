# Burguer Byte — acesso + loja + painel

Abra `index.html` no navegador (não precisa de servidor).

```
burguer-byte-v2/
├── index.html    Tela inicial: escolha "Quero comprar" ou "Sou administrador"
├── loja.html     Totem de autoatendimento (cliente)
├── admin.html    Painel do administrador (fechamento diário)
├── css/
│   ├── login.css   estilos da tela de acesso
│   ├── styles.css  estilos do totem
│   └── admin.css   estilos do painel
├── js/
│   ├── auth.js     sessão + proteção das páginas (Sessao)
│   ├── login.js    lógica da tela de acesso
│   ├── data.js     cardápio e ilustrações
│   ├── app.js      fluxo do totem
│   └── admin.js    painel (imprimir, exportar CSV, fechar caixa, sair)
└── assets/favicon.svg
```

## Fluxo
- **Quero comprar** → (nome opcional) → `loja.html` → pedido → "Finalizar e liberar totem" → volta ao `index.html`.
- **Sou administrador** → usuário e senha → `admin.html` → "Sair" → volta ao `index.html`.
- Abrir `admin.html` sem estar logado como administrador redireciona para o acesso.
- Voltar ao `index.html` sempre encerra a sessão.

## Acesso de demonstração
Usuário `admin` · senha `byte2026`  (definidos em `js/auth.js`, constante `ADMIN_DEMO`).

## Atenção — segurança
Não existe servidor, então o login é conferido no próprio navegador e a senha fica visível
no código. Serve para demonstrar o fluxo, **não protege dado nenhum**. Em produção:
valide usuário/senha em um backend (sessão ou token), remova `ADMIN_DEMO` e o aviso
"Acesso de demonstração" do `index.html`, e proteja também os dados do painel na API.
