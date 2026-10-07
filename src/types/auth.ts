import type { Href } from 'expo-router';

export const USER_ROLES = ['direcao', 'professor', 'apoio', 'responsavel'] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Perfis que a Direção pode cadastrar e gerenciar. */
export const MANAGED_USER_ROLES = ['professor', 'apoio', 'responsavel'] as const satisfies readonly UserRole[];

export type ManagedUserRole = (typeof MANAGED_USER_ROLES)[number];

export type Permission =
  | 'access:direcao'
  | 'access:professor'
  | 'access:responsavel'
  | 'agenda:view'
  | 'agenda:edit'
  | 'acompanhamento:view'
  | 'comunicados:approve'
  | 'users:manage'
  | 'professores:manage'
  | 'apoio:manage'
  | 'responsaveis:manage'
  | 'responsaveis:associate'
  | 'turmas:manage'
  | 'alunos:manage';

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  direcao: [
    'access:direcao',
    'agenda:view',
    'agenda:edit',
    'acompanhamento:view',
    'comunicados:approve',
    'users:manage',
    'professores:manage',
    'apoio:manage',
    'responsaveis:manage',
    'responsaveis:associate',
    'turmas:manage',
    'alunos:manage',
  ],
  professor: ['access:professor', 'agenda:view', 'agenda:edit', 'acompanhamento:view'],
  apoio: ['access:professor', 'agenda:view', 'agenda:edit', 'acompanhamento:view'],
  responsavel: ['access:responsavel', 'agenda:view', 'acompanhamento:view'],
};

export type User = {
  id: string;
  nome: string;
  email: string;
  senha: string;
  role: UserRole;
};

export type PublicUser = Omit<User, 'senha'>;

export type ManagedProfile = {
  id: string;
  nome: string;
  email: string;
  role: ManagedUserRole;
  created_at?: string;
  updated_at?: string;
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}

export function normalizeUserRole(value: unknown): UserRole | null {
  if (value === 'professor_apoio') return 'apoio';
  return isUserRole(value) ? value : null;
}

export function isManagedUserRole(value: unknown): value is ManagedUserRole {
  return typeof value === 'string' && (MANAGED_USER_ROLES as readonly string[]).includes(value);
}

export function hasRole(role: UserRole | null | undefined, requiredRole: UserRole): boolean {
  return role === requiredRole;
}

export function hasAnyRole(role: UserRole | null | undefined, requiredRoles: readonly UserRole[]): boolean {
  return role !== null && role !== undefined && requiredRoles.includes(role);
}

export function can(role: UserRole | null | undefined, permission: Permission): boolean {
  return isUserRole(role) && ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Todos os perfis compartilham a mesma área com abas (`/inicio`); o conteúdo,
 * as ações e as abas visíveis mudam conforme as permissões do perfil.
 */
export function homeRouteForRole(_role: UserRole): Href {
  return '/inicio';
}

/** Professor e Professor de Apoio: mesmas funcionalidades operacionais. */
export function canAccessProfessorArea(role: UserRole): boolean {
  return can(role, 'access:professor');
}

export function canEditAgenda(role: UserRole): boolean {
  return can(role, 'agenda:edit');
}

export function canApproveComunicados(role: UserRole): boolean {
  return can(role, 'comunicados:approve');
}

export function canManageProfessores(role: UserRole): boolean {
  return can(role, 'professores:manage');
}

export function canManageProfessorApoio(role: UserRole): boolean {
  return can(role, 'apoio:manage');
}

export function canManageResponsaveis(role: UserRole): boolean {
  return can(role, 'responsaveis:manage');
}

export function canManageTurmas(role: UserRole): boolean {
  return can(role, 'turmas:manage');
}

export function canManageAlunos(role: UserRole): boolean {
  return can(role, 'alunos:manage');
}

export function canAssociateResponsaveis(role: UserRole): boolean {
  return can(role, 'responsaveis:associate');
}

export function canManageUsers(role: UserRole): boolean {
  return can(role, 'users:manage');
}

export function canViewAcompanhamento(role: UserRole): boolean {
  return can(role, 'acompanhamento:view');
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case 'direcao':
      return 'Direção';
    case 'professor':
      return 'Professor';
    case 'apoio':
      return 'Professor de Apoio';
    case 'responsavel':
      return 'Responsável';
  }
}
