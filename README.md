# BuildMaster Elite Tático v24.29 — Regras Atualizáveis

Versão fiel ao projeto com a etapa **v24.29 — Regras atualizáveis sem refazer APK** concluída.

## O que entrou

- Nova aba **Regras online** no resultado da ficha.
- Pacote local de regras embutido no APK.
- Campo para colar uma **URL JSON pública** com regras novas.
- Botão **Atualizar regras** para baixar ajustes sem gerar APK novo.
- Botão **Restaurar pacote local**.
- Botão **Exportar modelo JSON**.
- As regras atualizáveis conseguem:
  - priorizar habilidades;
  - bloquear habilidades;
  - priorizar ímpetos;
  - bloquear ímpetos;
  - agir por posição, estilo de jogo e função real.
- As correções locais da v24.28 continuam funcionando.
- Mantém design premium, cofre avançado, escalação visual, exportação profissional e motor de time.

## Como usar

1. Gere uma ficha normalmente.
2. Abra a aba **Regras online**.
3. Use o pacote local ou cole uma URL JSON pública.
4. Toque em **Atualizar regras**.
5. O app passa a aplicar essas regras nas próximas fichas, sem precisar refazer APK.

## Exemplo de arquivo público

O projeto já inclui um modelo em:

```text
public/rules/buildmaster-rules-v24-29.json
```

Você pode hospedar esse JSON em qualquer lugar público e editar as regras depois.

## Limite importante

- Ajustes de habilidades, ímpetos e regras de função podem atualizar sem APK.
- Mudanças de tela, layout, botão novo ou código ainda precisam gerar APK novo.

## APK

Workflow:

```text
Gerar APK Android Fiel v24.29 Regras Atualizáveis
```

Use cache limpo no GitHub Actions se trocar de versão.
