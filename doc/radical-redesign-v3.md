# gallamaUI Radical Redesign v3

## Working Thesis

gallamaUI should become a **native Pi agent command centre**: a local-first interface for managing real agent work across coding, research, investment thinking, server automation, and future external channels like Discord.

This is not just a prettier chat UI. The goal is to make Pi sessions visible, searchable, branchable, resumable, and useful as long-running work objects.

> **Pi JSONL remains the source of truth. gallamaUI becomes the visual/control layer over it.**

---

## Core Direction

The redesign should embrace Pi's native session model instead of replacing it.

Pi already stores sessions as JSONL files with:

- session headers
- message entries
- `id` / `parentId` tree structure
- branches/forks
- labels
- session names
- compaction summaries
- custom entries
- model changes
- tool results

Therefore gallamaUI should not create its own database-first chat model. It should read, render, index, and eventually control Pi sessions directly or through `pi-runner`.

The key architecture:

```text
Pi JSONL sessions + filesystem artifacts
        = source of truth

sidecar projections / indexes
        = rebuildable search and UI acceleration

gallamaUI
        = browser/control cockpit

pi-runner
        = execution/runtime bridge

Discord / other channels
        = optional future remote control surfaces
```

---

## Current Priority Scope

The initial priority should be deliberately focused.

Top priorities:

1. **Pi session/thread browser**
2. **Rich chat timeline from Pi JSONL**
3. **Tree/fork view**
4. **Search across sessions/files**

Lower priority for now:

- dashboard/home screen
- approval inbox
- full coding IDE replacement
- investment-specific UI
- VSCode replacement
- Discord integration
- Astro/multimodal artifact apps
- database/RAG-first system

Those can come later. The v3 foundation should make the Pi session filesystem understandable and navigable.

---

## Main Product Metaphor

Think of gallamaUI as:

> **A file-system-native agent workbench for Pi sessions.**

Not:

- a generic chatbot
- a Discord clone
- a database-backed chat archive
- a full IDE
- a research-only app

The product should feel like a mixture of:

- Pi session browser
- git history viewer
- thread tree navigator
- rg-powered knowledge search
- artifact/workspace explorer

---

## Session = Thread

A Pi JSONL file maps naturally to a thread.

```text
thread = one Pi session JSONL file
```

A thread should expose:

- title/name from Pi `session_info` or first user message
- cwd/project path
- session file path
- timestamp and last activity
- active leaf/branch
- message count
- model/provider info
- tokens/cost if available
- labels/checkpoints
- auto summary
- related artifacts
- custom gallamaUI metadata

The session browser should be much better than a simple chronological chat list.

Useful filters:

- workspace/project path
- date
- text search
- tags
- session name
- file touched
- model/provider
- branch count
- artifact produced
- status if custom metadata exists

---

## Chat Timeline = Rendered Branch Path

A Pi session is not inherently linear. It is a tree.

The chat UI should render a **selected path from root to selected leaf**, not blindly render the whole JSONL as a flat log.

```text
session file = full tree
selected leaf = current branch
chat timeline = root → selected leaf
```

The timeline should understand Pi entry types:

- user messages
- assistant messages
- tool calls
- tool results
- bash execution
- custom messages
- compactions
- branch summaries
- model changes
- thinking level changes
- labels
- custom metadata entries

The timeline should feel agent-native, showing not only chat bubbles but also:

- commands run
- files read/edited
- tool outputs
- errors
- model switches
- compacted context
- branch points
- generated artifacts

---

## Tree/Fork View Is Central

The tree/fork view is one of the most important features.

Pi's `id` / `parentId` model should be visualized directly.

Example:

```text
Main idea: gallamaUI as Pi command centre
 ├─ Discord-first direction
 ├─ Pi JSONL as source of truth
 │   ├─ Filesystem-driven chat
 │   └─ Search and sidecar index
 └─ UX priorities
     ├─ Dashboard-heavy approach
     └─ Focused v3: sessions/chat/tree/search
```

The user should be able to:

- see all branches inside one session
- select a branch/leaf
- continue from a branch
- fork from any previous message
- compare branches conceptually
- identify abandoned branches
- rename or summarize branches
- promote a branch to a new session if needed

The tree should not show only raw IDs. It needs human-readable labels and summaries.

Without summaries, the tree is unusable:

```text
a1b2c3d4
f6g7h8i9
j0k1l2m3
```

With summaries, it becomes useful:

```text
Pi JSONL as source of truth
Filesystem search with rg
Custom entries for gallamaUI metadata
Cross-chat search and summaries
```

---

## Cross-Section Search Across Chats

A major desired UX:

> In one chat, ask the agent about another chat/session/thread.

Example:

```text
What did we decide in the Discord python project about threads?
```

or:

```text
Find every previous discussion where we talked about pi-runner and gallamaUI.
```

This requires two dimensions of navigation:

### 1. Tree View

Within one session:

```text
Show me the branches of this conversation.
```

### 2. Cross-Section View

Across many sessions:

```text
Show me all conversations where this concept appeared.
```

The user should be able to search across all Pi sessions and jump directly to:

- exact session
- exact branch
- exact message
- relevant artifact
- relevant sidecar summary

---

## Search Philosophy

Search should be filesystem-first.

The agent should be able to use normal tools like:

```bash
rg "discord thread" ~/.pi/agent/sessions
rg "pi-runner" ~/.gallama/index
rg "NVDA valuation" ~/workspaces/investment
```

This is powerful because it is:

- local-first
- transparent
- scriptable
- agent-friendly
- backup-friendly
- independent from gallamaUI runtime

However, raw Pi JSONL is not always pleasant to search because:

- content is JSON escaped
- branch structure is implicit
- tool outputs can be noisy
- message boundaries are not human-friendly
- there may be no summaries/titles

Therefore v3 should introduce rebuildable projection files.

---

## Rebuildable Sidecar Projection Index

Keep Pi JSONL as truth, but generate human/search-friendly projection files.

Possible structure:

```text
~/.gallama/index/
  sessions.jsonl
  sessions/
    <session-id>/
      meta.json
      transcript.md
      tree.md
      branches.jsonl
      summaries.md
      artifacts.md
```

These files are not authoritative. They are disposable.

If deleted, gallamaUI can rebuild them from:

```text
~/.pi/agent/sessions/**/*.jsonl
workspace artifacts
custom entries
```

This gives the best of both worlds:

```text
truth = Pi JSONL
search UX = plain-text projections
future advanced search = optional indexes
```

Later, Lucene, Meilisearch, embeddings, or RAG can be added as additional rebuildable indexes.

But the source of truth should remain files.

---

## Git's Role

Git can be useful, but it should not model chat forks.

Do not use git branches as the main representation of conversation branches. Pi already has a better native tree model using `id` and `parentId`.

Good use of git:

- version workspace notes
- version artifacts
- backup/sync sidecar summaries
- track generated markdown reports
- checkpoint important workspace state
- compare artifact changes over time

Bad use of git:

- using git commits for every chat message
- using git branches to represent Pi branches
- making git required for the core session model

Recommended model:

```text
Pi JSONL tree = conversation/fork source of truth
filesystem = artifacts, notes, summaries, projections
git = optional backup/versioning layer
```

---

## Custom Entries

Pi supports `custom` entries. These are ideal for gallamaUI metadata because they persist inside the session file but do not become normal LLM context.

Conceptually:

```json
{
  "type": "custom",
  "id": "...",
  "parentId": "...",
  "timestamp": "...",
  "customType": "gallamaui.thread",
  "data": {
    "tags": ["pi", "jsonl", "tree"],
    "status": "active"
  }
}
```

Useful custom entry types:

```text
gallamaui.workspace
gallamaui.thread
gallamaui.branch_summary
gallamaui.artifact
gallamaui.source
gallamaui.discord
gallamaui.ui_state
gallamaui.search_metadata
```

Potential uses:

- assign session to workspace
- set tags
- store status
- link artifacts
- store branch summaries
- map Discord thread IDs later
- mark pinned branches
- store UI-specific state

Important distinction:

```text
custom         = metadata, not LLM context
custom_message = context/message that may enter LLM context
```

For gallamaUI, use `custom` far more often than `custom_message`.

Initial safety recommendation:

- start with sidecar metadata/indexes first
- only write Pi `custom` entries once the format is stable
- keep all writes append-only
- never rewrite old JSONL lines casually

---

## Invisible Auto Summaries

Auto summaries are probably necessary for good UX.

The tree and session browser need names/summaries. Otherwise old sessions become impossible to navigate.

Types of summaries:

### Thread Summary

A summary of the whole session.

Used for session browser and search.

### Branch Summary

A summary of a specific branch/leaf.

Used for the tree view.

### Rolling Summary

Updated periodically or when a session becomes idle.

Used for fast resume.

### Search Metadata

Extracted topics/projects/entities/decisions.

Example:

```json
{
  "topics": ["gallamaUI", "Pi JSONL", "filesystem search", "fork tree"],
  "projects": ["pi-runner", "discord python"],
  "decisions": [
    "Pi JSONL should be the source of truth",
    "Discord should be a future channel, not the core system"
  ]
}
```

These summaries should be invisible by default.

Important rule:

> Summary for UI/search does not automatically mean summary injected into LLM context.

The user or agent can choose to import relevant summaries into a current chat when needed.

---

## Cross-Chat Question Flow

Desired future flow:

User asks inside current chat:

```text
What did we decide about Discord threads?
```

System/agent flow:

1. Search sidecar summaries and transcripts with `rg`.
2. Find candidate sessions/branches.
3. Read relevant snippets from JSONL/projections.
4. Answer with references.
5. Offer to import selected context into current session.

Example answer style:

```text
I found this in 3 previous sessions.

Main decision:
Discord should be a channel/remote control surface, not the source of truth.

Sources:
- gallamaUI brainstorm / Pi command centre branch
- discord python v3 planning notes
- pi-runner integration discussion
```

This allows the agent to reason across previous work without blindly loading everything into context.

---

## Discord Relationship

Discord should not be the primary architecture.

It can become a future remote interface for:

- notifications
- mobile access
- approvals
- lightweight commands
- async status updates
- mapping Discord threads to Pi sessions

But the source of truth should stay local:

```text
gallamaUI + Pi JSONL + filesystem
```

Future mapping:

```text
Discord thread/message
    ↔ gallamaUI thread/session
    ↔ Pi JSONL file/branch
```

Discord is a channel, not the core.

---

## Workspace Concept

Workspace is useful but not the initial center of gravity.

A workspace can be a grouping layer over sessions and artifacts.

Examples:

- gallamaUI development
- pi-runner integration
- local model setup
- investment research
- server automation

A workspace may contain or reference:

- Pi sessions
- project paths
- artifacts
- notes
- sidecar summaries
- search indexes
- optional git repo
- future Discord mapping

But v3 should not wait for a perfect workspace system. Session browsing, timeline rendering, tree view, and search are more important.

---

## Artifacts

Artifacts should remain normal files, not buried inside chat.

Examples:

- markdown research memo
- source summary
- generated report
- code patch
- diff
- screenshot
- CSV
- valuation notes
- architecture document

The Pi JSONL session can reference artifacts through custom entries or sidecar metadata.

Desired relationship:

```text
message/run created artifact
artifact links back to session + entry id
```

This makes work traceable without making JSONL store everything.

---

## Future Advanced Search / RAG

The filesystem-first model does not prevent advanced search.

Possible future layers:

1. `rg` over raw files and projections
2. structured metadata index
3. Lucene/Meilisearch full-text index
4. embedding index
5. hybrid RAG search

But every advanced index should be rebuildable.

Rule:

> If the search database is deleted, gallamaUI should rebuild it from Pi JSONL and filesystem artifacts.

---

## Practical v3 Product Shape

The first meaningful version can have four major views.

### 1. Session Browser

Browse all Pi sessions from `~/.pi/agent/sessions`.

Show:

- title
- cwd
- last updated
- summary
- branch count
- tags/status if available
- file path

### 2. Chat Timeline

Render selected branch path from root to leaf.

Show messages, tool results, bash outputs, model changes, labels, compactions, and custom metadata in a readable way.

### 3. Tree View

Visualize the full Pi session tree.

Allow selecting branch/leaf and seeing branch summaries.

This is a core differentiator.

### 4. Search View

Search across sessions, projections, and artifacts.

Start with `rg`-style exact text search.

Jump from search result to session/message/branch/artifact.

---

## Design Principles

1. **Native Pi first**
   - Do not replace Pi's session model.

2. **JSONL as source of truth**
   - Chat data comes from Pi files.

3. **Filesystem over database**
   - Files are portable, searchable, scriptable, and agent-friendly.

4. **Indexes are disposable**
   - Any DB/search index must be rebuildable.

5. **Tree, not flat chat**
   - Pi sessions are branching conversations.

6. **Search before RAG**
   - Start with simple, reliable filesystem search.

7. **Summaries improve navigation**
   - Auto summaries are needed for tree and cross-chat UX.

8. **Custom entries are extension points**
   - Use Pi-compatible metadata, cautiously and append-only.

9. **Discord is a future channel**
   - Not the source of truth.

10. **Do not build an IDE first**
   - VSCode/browser tools can handle coding UI for now.

---

## One-Sentence Vision

> gallamaUI v3 is a native Pi session command centre that turns JSONL agent logs into searchable, branchable, resumable work threads without abandoning the filesystem as the source of truth.
