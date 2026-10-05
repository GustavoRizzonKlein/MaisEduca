import type { Href } from 'expo-router';

export const USER_ROLES = ['direcao', 'professor', 'professor_apoio', 'responsavel'] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Perfis que a Direção pode cadastrar e gerenciar. */
export const MANAGED_USER_ROLES = ['professor', 'professor_apoio', 'responsavel'] as const satisfies readonly UserRole[];

export type ManagedUserRole = (typeof MANAGED_USER_ROLES)[number];

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

export function isManagedUserRole(value: unknown): value is ManagedUserRole {
  return typeof value === 'string' && (MANAGED_USER_ROLES as readonly string[]).includes(value);
}

export function homeRouteForRole(role: UserRole): Href {
  switch (role) {
    case 'direcao':
      return '/direcao' as Href;
    case 'professor':
    case 'professor_apoio':
      return '/professor' as Href;
    case 'responsavel':
      return '/responsavel' as Href;
  }
}

/** Professor e Professor de Apoio: mesmas funcionalidades operacionais. */
export function canAccessProfessorArea(role: UserRole): boolean {
  return role === 'professor' || role === 'professor_apoio';
}

export function canEditAgenda(role: UserRole): boolean {
  return canAccessProfessorArea(role);
}

export function canApproveComunicados(role: UserRole): boolean {
  return role === 'direcao';
}

export function canManageProfessores(role: UserRole): boolean {
  return role === 'direcao';
}

export function canManageProfessorApoio(role: UserRole): boolean {
  return role === 'direcao';
}

export function canManageResponsaveis(role: UserRole): boolean {
  return role === 'direcao';
}

export function canManageTurmas(role: UserRole): boolean {
  return role === 'direcao';
}

export function canManageAlunos(role: UserRole): boolean {
  return role === 'direcao';
}

export function canAssociateResponsaveis(role: UserRole): boolean {
  return role === 'direcao';
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'direcao';
}

export function canViewAcompanhamento(role: UserRole): boolean {
  return role === 'direcao' || canAccessProfessorArea(role) || role === 'responsavel';
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case 'direcao':
      return 'Direção';
    case 'professor':
      return 'Professor';
    case 'professor_apoio':
      return 'Professor de Apoio';
    case 'responsavel':
      return 'Responsável';
  }
}
