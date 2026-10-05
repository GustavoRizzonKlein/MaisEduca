import { Redirect } from 'expo-router';

/** Cadastro público removido — contas são criadas pela Direção. */
export default function CadastroScreen() {
  return <Redirect href="/login" />;
}
