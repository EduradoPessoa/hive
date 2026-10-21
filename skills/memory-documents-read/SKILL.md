---
name: memory-documents-read
description: >
  Consult the company's shared Memory knowledge base (read-only). Trigger before
  starting work on a task, to learn what the team already decided and
  documented about it, and whenever the task asks to look something up in
  Memory. This skill only reads; recording knowledge is done by the lead agent
  through the memory-documents skill.
---

# Memory Documents (read-only)

Memory is the company's shared knowledge base: Markdown documents organized in
folders, kept by the lead agent and by humans in the Memory page under Work.
You **read** it to work with the team's existing knowledge. You do not write to
it.

## Access

Use the injected env vars; never hard-code the API URL or paste the key anywhere.

```bash
PAPERCLIP_API_BASE="${PAPERCLIP_API_URL%/}"
PAPERCLIP_API_BASE="${PAPERCLIP_API_BASE%/api}"
MEM="$PAPERCLIP_API_BASE/api/companies/$PAPERCLIP_COMPANY_ID/memory-documents"

# Send the Authorization header ONLY when a key exists.
mem_curl() {
  if [ -n "${PAPERCLIP_API_KEY:-}" ]; then
    curl -sS -H "Authorization: Bearer $PAPERCLIP_API_KEY" "$@"
  else
    curl -sS "$@"
  fi
}
```

`PAPERCLIP_API_KEY` is absent in `local_trusted` mode. Sending the header with
an empty value produces `401 Empty bearer token`; that means the header was sent
empty, not that access is missing — use `mem_curl`, which covers both modes.

## Consult before you work

At the start of a task, before planning:

1. **List the documents** — titles and folders only, so it is cheap:
   ```bash
   mem_curl "$MEM"
   # {"documents":[{"id":"…","folderId":"…"|null,"title":"…","slug":"…",
   #   "createdAt":"…","updatedAt":"…"}],"allCount":N,"unfiledCount":N}
   ```
2. **Find the project's folder.** Project documentation lives in a folder named
   after the project; the "General" folder holds company-wide knowledge.
   ```bash
   mem_curl \
     "$PAPERCLIP_API_BASE/api/companies/$PAPERCLIP_COMPANY_ID/folders?kind=memory"
   ```
3. **Open what is relevant** — start with the project's overview document, then
   documents whose title is plainly related to the task. About five is usually
   enough. Only this call returns the body:
   ```bash
   mem_curl "$MEM/$DOCUMENT_ID"
   ```
4. **Follow `[[wikilinks]]`** inside them only when relevant. Resolve a link by
   its title; `{"document": null}` just means it does not exist yet:
   ```bash
   mem_curl "$MEM/resolve?target=Database%20decisions"
   ```

Each document starts with a `Criado em … · Atualizado em …` line. Prefer the
most recently updated information when two documents disagree.

## Use what you read

- Decisions recorded in Memory are the team's. Follow them; do not silently
  contradict them.
- If your work changes, contradicts, or adds durable knowledge — a new decision,
  a corrected fact, a reusable procedure — **report it in your task result** so
  the lead agent can record it, and name the Memory document it affects.
- Never create, edit, move, or delete Memory documents or folders. This skill
  does not cover writes, and writing outside the lead's curation is what turns
  the knowledge base into a pile of loose documents.
