export type UserRole = 'professor' | 'responsavel';

export type User = {
  id: string;
  nome: string;
  email: string;
  senha: string;
  role: UserRole;
};

export type PublicUser = Omit<User, 'senha'>;
