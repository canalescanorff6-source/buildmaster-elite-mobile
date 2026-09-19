# R440 — Identidade Visual Forte da Edição

## Objetivo
Usar a arte completa da carta como evidência adicional para distinguir edições visualmente diferentes do mesmo jogador, sem substituir as identidades canônicas existentes e sem forçar uma escolha quando a evidência for fraca.

## Regras
- `sourceHash` exato e `card-r126-*` canônico continuam com precedência.
- A imagem é recortada pela área de arte detectada pelo leitor atual; o screenshot inteiro nunca vira identidade visual.
- A assinatura usa dHash 64-bit (`dhash64-v1`) e cinco microvariações de recorte para tolerar compressão, escala e pequenos deslocamentos.
- Resolução automática visual exige similaridade >= 90 e margem segura sobre a segunda candidata.
- Similaridade >= 82 com candidatas próximas permanece ambígua e exige escolha humana.
- Uma carta aprende a assinatura visual após resolução segura, OCR completo ou escolha manual; leituras de qualidade menor não substituem a principal.
- O Catálogo Mestre preserva variantes visuais anteriores para reconhecer a mesma arte após recompressão ou recorte ligeiramente diferente.
- O OCR continua fallback para carta nova/incompleta; R440 não inventa atributos, habilidades, nível ou edição.
