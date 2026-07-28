import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return <main className="public-policy-page">
    <article>
      <p className="kicker">BuildMaster Elite Tático</p>
      <h1>Política de privacidade</h1>
      <p>Versão 2026.07 · atualizada para o BuildMaster v31.74.</p>
      <h2>Dados utilizados</h2>
      <p>O aplicativo utiliza dados da conta, licença e aparelhos vinculados para autenticação e controle de acesso. Fichas, imagens, formações, treinos, partidas, diagnósticos e preferências podem permanecer no aparelho e, quando o usuário aciona recursos de nuvem, ser enviados ao Supabase.</p>
      <h2>Finalidades</h2>
      <p>Os dados são tratados para autenticação, proteção da licença, sincronização solicitada, backup, suporte, prevenção de abuso, comunidade privada, solicitações LGPD e funcionamento dos recursos táticos.</p>
      <h2>Serviços e bibliotecas</h2>
      <p>O aplicativo pode usar Supabase para contas e dados em nuvem, GitHub para o canal direto de atualização e, na distribuição Google Play, Play Integrity e Play In-App Updates. O OCR é processado localmente sempre que o fluxo configurado permitir.</p>
      <h2>Proteção e retenção</h2>
      <p>Backups exportados podem ser criptografados com senha. Tokens e credenciais não devem ser incluídos em diagnósticos ou pacotes comunitários. Dados do servidor são mantidos enquanto a conta ou obrigações administrativas exigirem, respeitando solicitações válidas de exclusão.</p>
      <h2>Direitos do usuário</h2>
      <p>Na área Planos e LGPD é possível registrar pedidos de acesso, correção, exportação e exclusão. Também existe uma página pública para solicitar exclusão após a desinstalação.</p>
      <p><Link href="/excluir-conta/">Solicitar exclusão da conta</Link></p>
      <h2>Contato</h2>
      <p>O endereço de suporte controlado pelo responsável deverá ser informado na ficha da Google Play e na implantação pública deste site antes da produção.</p>
      <p><Link href="/">Voltar ao BuildMaster</Link></p>
    </article>
  </main>;
}
