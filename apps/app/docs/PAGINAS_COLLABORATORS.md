# Pasta: collaborators

## Estrutura atual (resumo)

- `collaboratorList/` (index.tsx, components/\*Cell, data/dataTableData.tsx)
- `collaboratorProfile/` (components/, index.tsx)
- `newCollaborator/index.tsx`

## Inconsistencias percebidas

- `data/dataTableData.tsx` aparece apenas em `collaboratorList`.
- `newCollaborator` e `collaboratorProfile` tem logicas de form sem padrao unico de `validation`.
- Falta `types.ts` para view-models dos formularios.

## Padrao sugerido

- Manter `components/` para cells e cards.
- Centralizar configuracoes de tabela em `constants/` (ou `tables/`).
- Definir padrao unico para validacao (ex.: `validation.ts`).
- Criar `types.ts` e `utils/` quando houver mapeamento de payload.

## Reuso/centralizacao

- Colunas de tabela e labels de status podem ir para `src/constants/`.
- Reaproveitar componentes do profile em `newCollaborator` quando fizer sentido.

## Arquivos longos (prioridade)

- `collaborators/newCollaborator/index.tsx` (~641 linhas): dividir em `components/` e `hooks/`.
- `collaborators/collaboratorProfile/components/BasicInfo/index.tsx` (~402 linhas): separar seções de formulario.
- `collaborators/collaboratorList/index.tsx` (~230 linhas): extrair tabela e filtros.

## Status (comentado)

- [ ] Mover `dataTableData.tsx` para `constants/` ou `tables/`.
  - Comentario: reduzir pasta `data/` somente para mocks.
- [ ] Definir padrao de validacao para forms.
  - Comentario: alinhar com clientes e admin.
