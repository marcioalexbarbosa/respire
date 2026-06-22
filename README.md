# Respire — Respiração 4-7-8

Um web app simples e responsivo para praticar a técnica de respiração **4-7-8**, com um círculo que infla e desinfla acompanhando o ritmo e instruções dinâmicas em português.

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
- 🔊 Sinais sonoros suaves (opcional) e vibração no celular
- ⌨️ Atalhos: **Espaço** inicia/pausa, **R** reinicia
- 📱 Totalmente responsivo, funciona em qualquer navegador sem instalação

## Como usar

Basta abrir o `index.html` no navegador. Não precisa de servidor nem build — é um único arquivo HTML autossuficiente.

```bash
xdg-open index.html
```

## Deploy

O site é hospedado em S3 + CloudFront. Para publicar uma alteração, basta rodar:

```bash
./deploy.sh
```

O script sobe o `index.html` para o bucket S3 e invalida o cache do CloudFront. Depois aguarde ~1-2 min e dê um **reload forçado** no navegador (o Safari/iPad costuma segurar a versão antiga em cache).

## Tecnologia

HTML, CSS e JavaScript puro (vanilla), em um só arquivo. Sem dependências.

## Licença

MIT
