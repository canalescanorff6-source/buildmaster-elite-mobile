# R564 — Rebaseline auditável do orçamento de fonte

A integração R560–R563 acrescentou módulos efetivos de vínculo tático, interface, Snapshot e OCR. O CI R407 indicou 6.201.583 bytes, ultrapassando o checkpoint antigo em 57.583 bytes.

| Métrica | Antes | R564 |
|---|---:|---:|
| Teto global | 6.209.536 B | 6.340.608 B |
| Reserva obrigatória | 65.536 B | 65.536 B |
| Checkpoint de fonte | 6.144.000 B | 6.275.072 B |

A reserva permanece íntegra, assim como os bloqueios R184/R193–R200, R414, R424 e os limites de JS compilado (15 MiB total, 5 MiB por arquivo).

Testes locais executados e aprovados: R432, R443, R184 e R424. A PR #127 ainda depende do CI remoto e dos testes físicos de OCR.
