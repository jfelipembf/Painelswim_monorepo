# Sistema de Status e Tradução

## Arquitetura

**Back-end (Banco de Dados):**
- Sempre em inglês: `active`, `waiting`, `pending`, `expired`, `cancelled`, `suspended`
- Consistência garantida em todo o sistema

**Front-end (UI):**
- Sempre em português: `ativo`, `em espera`, `pendente`, `expirado`, `cancelado`, `suspenso`
- Tradução automática via helpers

## Componentes

### 1. ContractStatusBadge
```javascript
import ContractStatusBadge from "components/Common/ContractStatusBadge"

<ContractStatusBadge status="active" /> // Mostra "ativo" com cor verde
```

### 2. StatusBadge (Genérico)
```javascript
import StatusBadge from "components/Common/StatusBadge"

// Contratos
<StatusBadge status="active" type="contract" />

// Matrículas  
<StatusBadge status="pending" type="enrollment" />

// Clientes
<StatusBadge status="inactive" type="client" />

// Vendas
<StatusBadge status="paid" type="sale" />
```

### 3. Hooks
```javascript
import { useStatusTranslation, useStatusColor } from "hooks/useStatusTranslation"

const translatedStatus = useStatusTranslation("active", "contract") // "ativo"
const color = useStatusColor("active") // "success"
```

## Funções de Tradução

### statusTranslator.js
```javascript
import { 
  getContractStatusPT, 
  getStatusColor,
  getEnrollmentStatusPT,
  getClientStatusPT,
  getSaleStatusPT
} from "helpers/statusTranslator"

// Tradução
const statusPT = getContractStatusPT("active") // "ativo"

// Cores
const color = getStatusColor("active") // "success"
```

## Regras de Uso

1. **Back-end**: Sempre salvar em inglês
2. **Front-end**: Sempre exibir em português usando os componentes
3. **Novos status**: Adicionar em `statusTranslator.js`
4. **Cores personalizadas**: Adicionar em `STATUS_COLORS`

## Exemplos de Implementação

### ✅ Correto
```javascript
// Salvar no banco
await createClientContract({ status: "active" })

// Exibir na UI
<ContractStatusBadge status={contract.status} />
```

### ❌ Incorreto
```javascript
// Não exibir diretamente
<Badge>{contract.status}</Badge> // Mostra "active"

// Não salvar em português
await createClientContract({ status: "ativo" }) // Inconsistente
```

## Cores Disponíveis

- `success` - Verde (ativo, pago)
- `warning` - Laranja (em espera, pendente)
- `danger` - Vermelho (expirado, cancelado)
- `secondary` - Cinza (inativo, suspenso)
- `info` - Azul (concluído)

## Manutenção

Para adicionar novo status:
1. Adicionar em `CONTRACT_STATUS` (statusTranslator.js)
2. Adicionar cor em `STATUS_COLORS`
3. Testar com `ContractStatusBadge`
