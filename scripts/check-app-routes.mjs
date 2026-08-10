import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const fail = (message) => {
  console.error(`✗ ${message}`);
  process.exit(1);
};

const rootPage = read('src/app/page.tsx');
const privacyPage = read('src/app/privacidade/page.tsx');
const deletionPage = read('src/app/excluir-conta/page.tsx');

if (!rootPage.includes("@/components/AuthGate") || !rootPage.includes("@/components/CardVisionApp") || !rootPage.includes("@/components/AppShellSafetyBoundaryV3930")) {
  fail('A rota raiz src/app/page.tsx precisa importar AppShellSafetyBoundaryV3930, AuthGate e CardVisionApp.');
}
if (!rootPage.includes('<AppShellSafetyBoundaryV3930>') || !rootPage.includes('<AuthGate>') || !rootPage.includes('<CardVisionApp') || !rootPage.includes('</AppShellSafetyBoundaryV3930>')) {
  fail('A rota raiz precisa montar o aplicativo dentro de AppShellSafetyBoundaryV3930 e AuthGate.');
}
if (/PrivacyPolicyPage|Política de privacidade|public-policy-page/.test(rootPage)) {
  fail('A política de privacidade foi copiada para src/app/page.tsx. Ela deve permanecer apenas em src/app/privacidade/page.tsx.');
}
if (!/PrivacyPolicyPage|Política de privacidade/.test(privacyPage)) {
  fail('A rota src/app/privacidade/page.tsx não contém a política de privacidade.');
}
if (!/AccountDeletionPage|Solicitar exclusão da conta/.test(deletionPage)) {
  fail('A rota src/app/excluir-conta/page.tsx não contém o fluxo público de exclusão.');
}

console.log('Rotas críticas aprovadas: início autenticado, privacidade e exclusão separadas.');
