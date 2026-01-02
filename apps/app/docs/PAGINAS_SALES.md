# Pasta: sales

## Estrutura atual (resumo)

- `sales/purchase/` (components/, constants/, types.ts, utils/, hooks/, index.tsx)
- `sales/settleDebt/index.tsx`

## Inconsistencias percebidas

- `settleDebt` e camelCase; outras pastas usam kebab-case.
- `purchase/index.tsx` concentra logica de dados e UI no mesmo arquivo.

## Padrao sugerido

- Padronizar nomes internos em `purchase/` (`constants/`, `types.ts`, `utils/`).
- Usar kebab-case para rotas/pastas (`settle-debt`).
- Extrair fetch/memo para `hooks/` da pagina.

## Reuso/centralizacao

- Constantes de pagamento e labels devem ser compartilhadas com `financial`.
- Funcoes de moeda devem estar em `src/utils/`.

## Arquivos longos (prioridade)

- `sales/purchase/index.tsx` (~645 linhas): quebrar em hook + subcomponentes.
- `sales/settleDebt/index.tsx` (~249 linhas): separar tabela e resumo.
- `sales/purchase/components/PaymentSection.tsx` (~228 linhas): extrair form de metodo.
- `sales/purchase/components/EditPaymentDialog.tsx` (~219 linhas): separar campos por metodo.

## Status (comentado)

- [x] Padronizar nomes de arquivos no `purchase/`.
  - Comentario: renomeado para `constants/`, `types.ts`, `utils/`.
- [x] Extrair logica de `purchase/index.tsx`.
  - Comentario: criado `purchase/hooks/usePurchaseController.ts`.
- [ ] Decidir padrao de nome para `settleDebt`.
  - Comentario: seguir kebab-case.
