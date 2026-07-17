# BuildMaster Elite Tático v24.29 — Regras atualizáveis sem refazer APK

Esta versão adiciona uma camada de regras dinâmica para ajustar habilidades, ímpetos e bloqueios por função sem gerar um APK novo.

## Como funciona

1. O app mantém um pacote local embutido.
2. Você pode hospedar um JSON público com novas regras.
3. No app, abra a aba **Regras online**.
4. Cole a URL do JSON e toque em **Atualizar regras**.
5. O app salva o pacote no aparelho e aplica nas próximas fichas.

## O que pode atualizar

- Habilidades a priorizar.
- Habilidades a bloquear.
- Ímpetos a priorizar.
- Ímpetos a bloquear.
- Regras por posição, estilo de jogo e função real.

## Exemplo

```json
{
  "version": "minhas-regras-1",
  "updatedAt": "2026-07-12T00:00:00.000Z",
  "source": "Meu pacote online",
  "rules": [
    {
      "id": "ca-artilheiro",
      "title": "CA Artilheiro",
      "match": { "position": "CF", "playstyleIncludes": ["artilheiro"] },
      "promoteSkills": ["Chute de primeira", "Precisão à distância"],
      "blockSkills": ["Volta para marcar", "Interceptação"],
      "promoteImpetos": ["Chute", "Instinto artilheiro"],
      "note": "Foco total em finalização."
    }
  ]
}
```

## Observação

Mudanças de tela, layout e código ainda exigem APK novo. Mas ajustes de regra, habilidade e ímpeto podem ser feitos por JSON.
