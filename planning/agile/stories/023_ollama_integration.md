# Implement Ollama Provider

- **Status:** DONE
- **Points:** 3
- **Story ID:** 023
- **Type:** Feature

## Description
Implement the `OllamaProvider` class to communicate with a local Ollama instance.

## User Story
**As a** User,
**I want** to use local models,
**So that** I don't incur API costs.

## Acceptance Criteria
- [x] Add the ollama-js dependency
- [x] Do not hard code the Ollama API URL (or use the default of `http://localhost:11434`)
- [x] Connects to Ollama API URL.
- [x] Implements `chat` with streaming support.
- [x] Implements `listModels`.

## Testing
1. Mock Ollama API response.
2. Verify chat completion parsing.
3. Test the `listModels` method against the actual Ollama API
4. Test the `chat` method against the actual Ollama API

## Review Log
**1/10/26** - Accepted by Product Owner