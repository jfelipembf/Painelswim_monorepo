/**
 * Aplica máscara de data no formato DD-MM-AAAA durante a digitação
 */
export const applyDateMask = (value: string): string => {
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, "");

  // Limita a 8 dígitos (DDMMAAAA)
  const limited = numbers.slice(0, 8);

  // Aplica a máscara DD-MM-AAAA
  if (limited.length <= 2) {
    return limited;
  } else if (limited.length <= 4) {
    return `${limited.slice(0, 2)}-${limited.slice(2)}`;
  } else {
    return `${limited.slice(0, 2)}-${limited.slice(2, 4)}-${limited.slice(4, 8)}`;
  }
};

/**
 * Converte data do formato DD-MM-AAAA para YYYY-MM-DD (ISO)
 */
export const formatDateToISO = (date: string): string => {
  if (!date) return "";

  // Remove caracteres não numéricos
  const numbers = date.replace(/\D/g, "");

  // Verifica se tem 8 dígitos
  if (numbers.length !== 8) return date;

  const day = numbers.slice(0, 2);
  const month = numbers.slice(2, 4);
  const year = numbers.slice(4, 8);

  return `${year}-${month}-${day}`;
};

/**
 * Converte data do formato YYYY-MM-DD para DD-MM-AAAA
 */
export const formatDateFromISO = (date: string): string => {
  if (!date) return "";

  // Verifica se já está no formato DD-MM-AAAA
  if (date.includes("-") && date.split("-")[0].length === 2) {
    return date;
  }

  // Verifica se está no formato YYYY-MM-DD
  const isoMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}-${month}-${year}`;
  }

  return date;
};

/**
 * Valida se uma data no formato DD-MM-AAAA é válida
 */
export const isValidDate = (date: string): boolean => {
  if (!date) return false;

  // Remove caracteres não numéricos
  const numbers = date.replace(/\D/g, "");
  if (numbers.length !== 8) return false;

  const day = parseInt(numbers.slice(0, 2), 10);
  const month = parseInt(numbers.slice(2, 4), 10);
  const year = parseInt(numbers.slice(4, 8), 10);

  // Validação básica
  if (day < 1 || day > 31) return false;
  if (month < 1 || month > 12) return false;
  if (year < 1900 || year > 2100) return false;

  // Cria objeto Date para validação
  const testDate = new Date(year, month - 1, day);

  // Verifica se a data é válida (ex: 31/02 não é válido)
  return (
    testDate.getDate() === day &&
    testDate.getMonth() === month - 1 &&
    testDate.getFullYear() === year
  );
};
