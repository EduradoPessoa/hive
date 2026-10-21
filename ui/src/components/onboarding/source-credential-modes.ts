import type { CredentialMode } from "./ModelSourceTiles";

/**
 * Which ways of authenticating each source can be offered in onboarding.
 *
 * "subscription" is a sign-in to the tool's own account (CLI login / OAuth);
 * "api" is a provider key. A source appears in the connect step's row only
 * under a mode it supports, so the row never offers a choice the next card
 * cannot honour.
 *
 * Adapters not listed here (plugins) are offered under both: they bring their
 * own credential handling, and hiding them would make them unreachable.
 */
const SOURCE_CREDENTIAL_MODES: Record<string, readonly CredentialMode[]> = {
  claude_local: ["subscription", "api"],
  codex_local: ["subscription", "api"],
  gemini_local: ["subscription", "api"],
  kimi_local: ["subscription", "api"],
  grok_local: ["subscription", "api"],
  cursor: ["subscription", "api"],
  // Keys only: a managed remote agent has no local account to sign in to, and
  // onboarding wires OpenCode to an OpenRouter key and Pi to a provider key.
  cursor_cloud: ["api"],
  opencode_local: ["api"],
  pi_local: ["api"],
  // Runs against its own local configuration; there is no key to collect here.
  hermes_local: ["subscription"],
};

export function sourceSupportsCredentialMode(adapterType: string, mode: CredentialMode): boolean {
  const modes = SOURCE_CREDENTIAL_MODES[adapterType];
  return modes ? modes.includes(mode) : true;
}
