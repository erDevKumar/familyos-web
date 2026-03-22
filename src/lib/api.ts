import { clearToken, getToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

/** Thrown when the API returns a non-2xx response; message parses RFC 7807 `detail` when present. */
export class ApiError extends Error {
  constructor(
    status: number,
    message: string,
    public readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
  status: number;
}

function parseErrorPayload(text: string): {
  message: string;
  fieldErrors?: Record<string, string>;
} {
  const trimmed = text.trim();
  if (!trimmed) {
    return { message: "Request failed" };
  }
  try {
    const j = JSON.parse(trimmed) as Record<string, unknown>;
    const detail = typeof j.detail === "string" ? j.detail : null;
    const legacyMessage = typeof j.message === "string" ? j.message : null;
    const message = detail ?? legacyMessage ?? trimmed;
    const errors = j.errors;
    const fieldErrors =
      errors != null && typeof errors === "object" && !Array.isArray(errors)
        ? (errors as Record<string, string>)
        : undefined;
    return { message, fieldErrors };
  } catch {
    return { message: trimmed };
  }
}

async function request<T>(
  path: string,
  opts: RequestInit = {},
): Promise<T> {
  const headers = new Headers(opts.headers);
  headers.set("Accept", "application/json");
  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (opts.body && !(opts.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event("familyos:auth"));
  }
  if (!res.ok) {
    const text = await res.text();
    const { message, fieldErrors } = parseErrorPayload(text);
    throw new ApiError(
      res.status,
      message || res.statusText,
      fieldErrors,
    );
  }
  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

export type UserDto = {
  id: string;
  email: string;
  displayName: string;
};

export type AuthResponse = {
  token: string;
  user: UserDto;
};

export type FieldDefinition = {
  id: string;
  fieldKey: string;
  label: string;
  fieldType: string;
  required: boolean;
  sensitive: boolean;
  groupName: string | null;
  sortOrder: number;
  dropdownValues: string | null;
};

export type DocumentType = {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  fields: FieldDefinition[];
};

export type FamilySummary = {
  id: string;
  name: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
};

export type FamilyMember = {
  id: string;
  displayName: string;
  relationship: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  linkedUserId: string | null;
};

export type DocumentDto = {
  id: string;
  documentTypeCode: string;
  documentTypeName: string;
  status: string;
  fields: Record<string, string | null | undefined>;
  memberIds: string[];
};

export type DashboardDto = {
  items: PriorityItem[];
  documentCount: number;
};

export type PriorityItem = {
  band: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  dueDate: string;
  documentId: string;
  documentTypeCode: string;
  fieldKey: string | null;
};

export type CalendarEvent = {
  date: string;
  title: string;
  kind: string;
  documentId: string | null;
  fieldKey: string | null;
};

export const api = {
  health: () => request<{ status: string; service: string }>("/api/v1/health"),

  register: (body: {
    email: string;
    password: string;
    displayName: string;
  }) =>
    request<AuthResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  me: () => request<UserDto>("/api/v1/me"),

  documentTypes: (includeInactive = false) =>
    request<DocumentType[]>(
      `/api/v1/document-types?includeInactive=${includeInactive}`,
    ),

  families: () => request<FamilySummary[]>("/api/v1/families"),

  createFamily: (name: string) =>
    request<FamilySummary>("/api/v1/families", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  members: (familyId: string) =>
    request<FamilyMember[]>(`/api/v1/families/${familyId}/members`),

  addMember: (
    familyId: string,
    body: {
      displayName: string;
      relationship?: string | null;
      contactEmail?: string | null;
      contactPhone?: string | null;
    },
  ) =>
    request<FamilyMember>(`/api/v1/families/${familyId}/members`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  documents: (familyId: string, type?: string) => {
    const q = type ? `?type=${encodeURIComponent(type)}` : "";
    return request<DocumentDto[]>(`/api/v1/families/${familyId}/documents${q}`);
  },

  document: (familyId: string, documentId: string) =>
    request<DocumentDto>(
      `/api/v1/families/${familyId}/documents/${documentId}`,
    ),

  createDocument: (
    familyId: string,
    body: {
      documentTypeId: string;
      fieldValues: Record<string, unknown>;
      memberIds: string[];
    },
  ) =>
    request<DocumentDto>(`/api/v1/families/${familyId}/documents`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateDocument: (
    familyId: string,
    documentId: string,
    body: {
      fieldValues?: Record<string, unknown>;
      memberIds?: string[];
      status?: string | null;
    },
  ) =>
    request<DocumentDto>(
      `/api/v1/families/${familyId}/documents/${documentId}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
    ),

  deleteDocument: (familyId: string, documentId: string) =>
    request<void>(`/api/v1/families/${familyId}/documents/${documentId}`, {
      method: "DELETE",
    }),

  dashboard: (familyId: string) =>
    request<DashboardDto>(`/api/v1/families/${familyId}/dashboard`),

  calendar: (familyId: string, from: string, to: string) =>
    request<CalendarEvent[]>(
      `/api/v1/families/${familyId}/calendar/events?from=${from}&to=${to}`,
    ),
};
