# R386–R396 candidate chain

This directory intentionally sits outside `src/`.

The R386–R396 vault hardening chain is preserved here as candidate-only code while
the canonical runtime integration is reconciled. Keeping these modules outside
`src/` prevents unintegrated candidate code from consuming the production source
budget or being treated as active runtime authority.

Do not import this directory from production `src/` until the canonical integration
contract is applied and the historical regression chain is revalidated.
