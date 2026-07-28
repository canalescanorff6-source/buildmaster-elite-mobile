import Link from 'next/link';
import { PublicDeletionRequestForm } from '@/modules/publication/PublicDeletionRequestForm';

export default function AccountDeletionPage() {
  return <main className="public-policy-page">
    <article>
      <p className="kicker">Privacidade e controle</p>
      <h1>Solicitar exclusão da conta BuildMaster</h1>
      <p>Use o mesmo nome de usuário da conta. A solicitação entra em análise administrativa e não apaga dados de forma instantânea ou sem validação.</p>
      <h2>O que será analisado</h2>
      <p>Conta, licença, aparelhos vinculados, dados em nuvem, histórico comercial e conteúdos comunitários associados. Dados que precisem ser mantidos por obrigação legal ou prevenção de fraude poderão seguir retenção limitada e documentada.</p>
      <PublicDeletionRequestForm />
      <h2>Dentro do aplicativo</h2>
      <p>Também é possível abrir Ajustes → Planos e LGPD → Exclusão da conta. Esse caminho é recomendado quando você ainda consegue entrar na conta.</p>
      <p><Link href="/privacidade/">Ler a política de privacidade</Link></p>
      <p><Link href="/">Voltar ao BuildMaster</Link></p>
    </article>
  </main>;
}
