# Pasta: clients

## Estrutura atual (resumo)

- `clientList/index.tsx`
- `clientProfile/` (components/, components/Modals/, data/swimmingLevels.ts, index.tsx)
- `newClient/` (index.tsx, schemas/form.ts, schemas/initialValues.ts, schemas/validations.ts)

## Inconsistencias percebidas

- `clientProfile/data/swimmingLevels.ts` indica dados reutilizaveis dentro de pages.
- `newClient/schemas` nao segue o mesmo padrao de `validation.ts` usado em outras paginas.
- Pasta `Modals` usa nome com maiuscula; outros locais usam `components/` simples.
- `clientProfile` concentra muitos componentes grandes no mesmo nivel.
- `newClient/components/FormField` e um componente local duplicado.

## Padrao sugerido

- Padronizar `components/` e `modals/` (minusculo).
- Mover dados reutilizaveis para `src/constants/` ou `src/modules/clients`.
- Escolher padrao unico para validacao (`schemas/` ou `validation.ts`).
- `types.ts` na raiz das paginas quando houver view-models.
- Usar `src/components/FormField` no lugar de `newClient/components/FormField`.

## Arquivos longos (prioridade)

- `clients/clientProfile/data/swimmingLevels.ts` (~1030 linhas): mover para `src/constants/` ou `src/modules/clients/data`.
- `clients/clientProfile/components/ProfileInfoCard/index.tsx` (~449 linhas): quebrar em cards menores.
- `clients/clientProfile/components/Modals/EnrollmentsModal.tsx` (~330 linhas): mover logica para hook e separar tabela.
- `clients/clientProfile/components/MembershipStatusCard/index.tsx` (~286 linhas): extrair blocos de UI.
- `clients/clientProfile/components/Evaluations/index.tsx` (~270 linhas): separar lista e formulario.

## Reuso/centralizacao

- Labels e opcoes (ex.: niveis de natacao) devem ir para `src/constants/`.
- Transformacoes de dados devem ficar em `src/utils/` ou no modulo `clients`.

## Status (comentado)

- [ ] Avaliar reuso de `swimmingLevels` fora de clientProfile.
  - Comentario: mover para constante global se for usado em mais de um lugar.
- [ ] Definir padrao unico para schemas/validations.
  - Comentario: usar o mesmo formato em `newClient` e outros forms.
- [ ] Padronizar estrutura de modals.
  - Comentario: evitar nomes mistos (`Modals` vs `components`).
