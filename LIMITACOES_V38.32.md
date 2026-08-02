# Limitações conhecidas da entrega v38.32

- O código TypeScript está em 99,8% do orçamento atual. A próxima evolução deve modularizar arquivos grandes antes de adicionar novos blocos extensos.
- `src/components/CardVisionApp.tsx` e `src/lib/analyzer.ts` continuam grandes; não foram reescritos para evitar regressões.
- A análise de comandos nunca afirma um botão sem evidência; nesses casos usa a classificação de inferência tática.
- Os clipes automáticos dependem dos recursos de mídia disponíveis no aparelho. A interface oferece quadro-chave, velocidade e anotações, mas a geração física do recorte deve ser validada no Android final.
- PDF usa o fluxo de impressão/exportação suportado pelo ambiente do app.
- Testes que exigem Supabase real, aparelho Android, chave de assinatura e GitHub Releases só podem ser concluídos após publicação.
