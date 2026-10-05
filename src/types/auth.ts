import type { Href } from 'expo-router';

export const USER_ROLES = ['direcao', 'professor', 'professor_apoio', 'responsavel'] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Perfis oferecidos no cadastro público — `direcao` não é autoatribuível. */
export const PUBLIC_SIGNUP_ROLES = ['professor', 'professor_apoio', 'responsavel'] as const satisfies readonly UserRole[];

export type User = {
  id: string;
  nome: string;
  email: string;
  senha: string;
  role: UserRole;
};

export type PublicUser = Omit<User, 'senha'>;

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
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

export function canManageResponsaveis(role: UserRole): boolean {
  return role === 'direcao';
}

export function canAssociateResponsaveis(role: UserRole): boolean {
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
