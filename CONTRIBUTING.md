# Como contribuir

Obrigado por quereres ajudar! Este projeto tem três regras que não mudam:

1. **Sem anúncios, sem compras e sem dinheiro real.** As moedas ganham-se só a jogar.
2. **Sem recolha de dados.** Nada sai do telemóvel. A app não pede acesso à Internet.
3. **Sem truques para prender as pessoas.** Nada de contadores falsos, pressão para voltar ou notificações insistentes. Os lembretes estão desligados por omissão.

## Antes de enviar alterações

```sh
npm start        # testa no browser em http://localhost:8123
npm run check    # todos os níveis têm de continuar válidos e com solução
```

- O código é JavaScript simples (módulos ES), sem bundler. Mantém assim.
- Comentários e textos da interface em português de Portugal.
- Novos jogos vivem em `www/js/games/<nome>/` e reutilizam o que está em `www/js/core/`.
- Se mudares os plugins nativos em `tools/native-plugins.js`, corre `npm run build:plugins`.

## Ideias bem-vindas

- Novos jogos simples (2048, sudoku, paciência, palavras)
- Novos estilos de peças e níveis especiais desenhados à mão
- Traduções
- Melhorias de acessibilidade
