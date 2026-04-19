import { Budget, Category, Consumption, Report } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

type SafeRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

const request = async <T>(path: string, options: SafeRequestOptions = {}): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({ message: "Error inesperado." }))) as {
      message?: string;
    };

    throw new Error(errorBody.message ?? "Error inesperado.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export const api = {
  getCategories: () => request<Category[]>("/categories"),
  createCategory: (payload: Partial<Category>) =>
    request<Category>("/categories", { method: "POST", body: payload }),
  updateCategory: (id: string, payload: Partial<Category>) =>
    request<Category>(`/categories/${id}`, { method: "PUT", body: payload }),
  deleteCategory: (id: string) => request<void>(`/categories/${id}`, { method: "DELETE" }),

  getBudgets: (year: number) => request<Budget[]>(`/budgets?year=${year}`),
  saveBudget: (payload: { year: number; categoryId: string; plannedAmount: number }) =>
    request<Budget>("/budgets", { method: "POST", body: payload }),
  deleteBudget: (id: string) => request<void>(`/budgets/${id}`, { method: "DELETE" }),

  getConsumptions: (year: number) => request<Consumption[]>(`/consumptions?year=${year}`),
  saveConsumption: (payload: { year: number; month: number; categoryId: string; actualAmount: number }) =>
    request<Consumption>("/consumptions", { method: "POST", body: payload }),
  deleteConsumption: (id: string) => request<void>(`/consumptions/${id}`, { method: "DELETE" }),

  getYears: () => request<number[]>("/reports/years"),
  getAnnualReport: (year: number) => request<Report>(`/reports/annual?year=${year}`)
};
