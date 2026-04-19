export const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2
  }).format(Number(value ?? 0));

export const formatKind = (value: string) => (value === "INCOME" ? "Ingreso" : "Gasto");

export const formatNature = (value: string) => (value === "FIXED" ? "Fija" : "Variable");
