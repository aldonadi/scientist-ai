# Implement Role Prompt Construction

- **Status:** READY
- **Points:** 5
- **Story ID:** 026
- **Type:** Feature

## Description
Implement logic to build the context window for a Role, including System Prompt, History, and filtered Environment variables.

## User Story
**As a** System,
**I want** to construct accurate prompts,
**So that** the LLM has the necessary context.

## Acceptance Criteria
- [ ] Injects System Prompt.
- [ ] Injects Whitelisted Variables (JSON).
- [ ] Formats conversation history.

## Testing
1. Unit test with dummy environment and key whitelist.

## Review Log
