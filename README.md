# Respire — Respiração 4-7-8

Um web app simples e responsivo para praticar a técnica de respiração **4-7-8**, com um círculo que infla e desinfla acompanhando o ritmo e instruções dinâmicas em português.

É um **PWA**: dá pra instalar na tela de início do celular e usar offline, sem loja de aplicativos.

🌐 **Online:** https://respire.umdiabonito.com.br

## A técnica 4-7-8

1. **Inspire** pelo nariz por **4** segundos
2. **Segure** a respiração por **7** segundos
3. **Expire** pela boca, devagar, por **8** segundos

Repita o ciclo. É uma técnica popular para relaxar e ajudar no sono.

## Recursos

- 🫧 Círculo animado que infla (inspirar), mantém (segurar) e desinfla (expirar)
- ⏱️ Anel de progresso e contagem regressiva em cada fase
- 💬 Instruções dinâmicas ("Puxe o ar pelo nariz", "Solte o ar pela boca, devagar")
- 🔁 Metas de ciclos (1, 2, 4, 8 ou ∞)
- 🎨 5 temas de cor (Aurora, Pôr do sol, Menta, Rosé, Ouro)
- 🔊 Sinais sonoros suaves (opcional) e vibração no celular
- ⌨️ Atalhos: **Espaço** inicia/pausa, **R** reinicia
- 📱 Instalável (PWA) e funciona **offline**, em tela cheia, com ícone próprio
- 💡 Mantém a tela acesa durante a sessão (onde o navegador permite)
- ⏸️ Pausa sozinho se a tela apagar ou você trocar de aba — nunca "corre" fases atrasadas
- 💾 Lembra tema, meta de ciclos e preferência de som

## Como usar

Abra https://respire.umdiabonito.com.br e, se quiser, instale:

- **Android/Chrome**: toque em "Instalar no dispositivo" (ou menu ⋮ → *Instalar app*)
- **iPhone/iPad (Safari)**: botão Compartilhar → *Adicionar à Tela de Início*

Para rodar local, o `index.html` abre direto no navegador (sem servidor e sem build).
Só o modo offline precisa de HTTP, porque service worker não funciona em `file://`:

```bash
python3 -m http.server 8000   # depois abra http://localhost:8000
```

## Arquivos

- `index.html` — o app inteiro (HTML + CSS + JS)
- `sw.js` — service worker (cache offline e atualização automática)
- `manifest.webmanifest` — metadados de instalação do PWA
- `icons/`, `favicon.ico` — ícones, gerados por `tools/make-icons.py`
- `tools/test-app.js` — testes da lógica de tempo (relógio virtual, sem navegador)
- `deploy.sh` — publicação em produção

## Desenvolvimento

```bash
node tools/test-app.js index.html   # testa start/pausa/retomada/ciclos/atalhos
python3 tools/make-icons.py         # regenera os ícones
```

Ao mudar `index.html`, `sw.js` ou os ícones, suba o `CACHE_VERSION` no `sw.js`.

## Deploy

O site é hospedado em S3 + CloudFront. Para publicar uma alteração, basta rodar:

```bash
./deploy.sh
```

O script sobe os arquivos para o bucket S3 (com o `sw.js` e o HTML marcados como `no-cache`) e invalida o cache do CloudFront. Depois aguarde ~1-2 min. Quem já tem o app instalado recebe a versão nova sozinho na próxima abertura; no navegador, um **reload forçado** resolve na hora (o Safari/iPad costuma segurar a versão antiga).

## Tecnologia

HTML, CSS e JavaScript puro (vanilla). Sem dependências, sem build.

## Licença

MIT
