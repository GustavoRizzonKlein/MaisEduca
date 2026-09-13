import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PublicUser, User, UserRole } from '@/types/auth';

const USERS_KEY = '@maiseduca/users';
const SESSION_KEY = '@maiseduca/session';

const defaultUsers: User[] = [
  {
    id: 'user-professor',
    nome: 'Professora Ana',
    email: 'professor@maiseduca.com',
    senha: '123456',
    role: 'professor',
  },
  {
    id: 'user-responsavel',
    nome: 'Responsável de João',
    email: 'responsavel@maiseduca.com',
    senha: '123456',
    role: 'responsavel',
  },
];

async function readUsers(): Promise<User[]> {
  const storedUsers = await AsyncStorage.getItem(USERS_KEY);
  if (!storedUsers) {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }

  const parsedUsers: unknown = JSON.parse(storedUsers);
  if (!Array.isArray(parsedUsers)) {
    throw new Error('Os usuários armazenados estão em um formato inválido.');
  }

  return parsedUsers as User[];
}

function toPublicUser(user: User): PublicUser {
  const { senha: _senha, ...publicUser } = user;
  return publicUser;
}

export async function getSession(): Promise<PublicUser | null> {
  const session = await AsyncStorage.getItem(SESSION_KEY);
  if (!session) return null;

  const parsedSession: unknown = JSON.parse(session);
  if (!parsedSession || typeof parsedSession !== 'object' || !('id' in parsedSession)) {
    throw new Error('A sessão armazenada está em um formato inválido.');
  }

  return parsedSession as PublicUser;
}

export async function signIn(email: string, senha: string): Promise<PublicUser> {
  const users = await readUsers();
  const user = users.find(
    (candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase() && candidate.senha === senha,
  );

  if (!user) {
    throw new Error('E-mail ou senha incorretos.');
  }

  const publicUser = toPublicUser(user);
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(publicUser));
  return publicUser;
}

export async function signUp(
  nome: string,
  email: string,
  senha: string,
  role: UserRole,
): Promise<PublicUser> {
  const users = await readUsers();
  const normalizedEmail = email.trim().toLowerCase();

  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    throw new Error('Já existe uma conta cadastrada com este e-mail.');
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    nome: nome.trim(),
    email: normalizedEmail,
    senha,
    role,
  };

  await AsyncStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
  const publicUser = toPublicUser(newUser);
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(publicUser));
  return publicUser;
}

export async function signOut(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}
