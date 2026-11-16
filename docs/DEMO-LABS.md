# Public synthetic labs

Stable routes: `/demo/firewall/`, `/demo/ledger/`, `/demo/human-gate/`, `/demo/risk-engine/`, `/demo/secure-chat/`, `/demo/kernel/`.

All six are prerendered standalone documents, without the analytics layout, auth client, server product imports or persistence. CSP connect-src none blocks network connections from the lab. Inputs remain in memory and reset on navigation. No credentials or tenant identifiers are requested. This is deterministic educational logic, not production enforcement.

Contract: `scenario` is a product slug; `input` is a nonempty trimmed string, maximum 500 characters. `decide(scenario,input)` returns `{demo:true,scenario,input,decision,explanation}` or a readable validation error. Two presets per product exercise distinct decisions. Reset restores the first preset and clears output. No API endpoint is added or changed.
