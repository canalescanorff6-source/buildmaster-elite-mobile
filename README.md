# BuildMaster Elite Tático v34.00 — Studio Premium

Projeto móvel para leitura de cartas, geração de fichas orientadas à gameplay, habilidades adicionais, Ímpetos, formações e gestão do time.

## Interface atual

- menu lateral pela esquerda, corrigido para celulares;
- sete temas coordenados, sem efeito arco-íris;
- nova marca inspirada em ficha, habilidades e evolução;
- foto de perfil escolhida da galeria e persistente por conta;
- contraste protegido em textos, cartões, campos e botões;
- rolagem móvel, telas responsivas e tela cheia opcional no calibrador.

## Motores preservados

- Mega Calibração v32.00;
- fichas sem foco artificial em overall;
- OCR e calibrador eFHUB;
- cinco habilidades adicionais complementares;
- Ímpetos;
- técnicos, formações, Meu Time, Cofre e partidas;
- sessão persistente e atualização verificada.

## Verificação antes da publicação

```bash
npm run test:v3400
npm run typecheck:v3200
npm run release:preflight
npm run release:play-preflight
npm run quality:audit
```
