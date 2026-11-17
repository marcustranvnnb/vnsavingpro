---
name: project-brain
description: >-
  Use this skill whenever the user asks to review, audit, give feedback, check the current status,
  explain the architecture, or update/sync the living knowledge base for VnSavingPro.
---

# VnSavingPro Living Brain Skill (`project-brain`)

This skill ensures that every project review, UX/financial feedback session, or architectural audit is grounded in the **latest live state** of the workspace and keeps `docs/knowledge-base/` continuously synchronized.

## Step 1: Run the Live Workspace Snapshot

Before giving feedback or reviewing the project, run the snapshot script to check which files in `src/` were recently modified and whether any files are newer than `docs/knowledge-base/INDEX.md`:

```powershell
powershell -ExecutionPolicy Bypass -File .\.agents\skills\project-brain\scripts\snapshot.ps1
```

## Step 2: Load the Relevant Knowledge Base Docs

1. Always read [INDEX.md](../../../docs/knowledge-base/INDEX.md) first.
2. Depending on the review angle, read:
   - **UI / Routing / State / Deployment review**: [ARCHITECTURE.md](../../../docs/knowledge-base/ARCHITECTURE.md)
   - **Financial math / Bank rates / Calculator review**: [DOMAIN_AND_FORMULAS.md](../../../docs/knowledge-base/DOMAIN_AND_FORMULAS.md)
   - **Code quality / Product feedback / Tech debt audit**: [REVIEW_CHECKLIST.md](../../../docs/knowledge-base/REVIEW_CHECKLIST.md)
   - **Recent changes & decisions**: [CHANGELOG_AND_DECISIONS.md](../../../docs/knowledge-base/CHANGELOG_AND_DECISIONS.md)

## Step 3: Reconcile Any Drift

If Step 1 (`snapshot.ps1`) reports any source files modified after `docs/knowledge-base/INDEX.md`:
1. Read those modified source files directly.
2. Update the relevant `docs/knowledge-base/*.md` files and `CHANGELOG_AND_DECISIONS.md` **before** or **while** delivering your review so the Living Brain is always 100% up to date.
