# Evidence Curation

An evidence point, or MIU, captures one interpretable claim from a source with
its value, unit, location, context, transform version, and curator metadata.

## Workflow

1. Select or create a source.
2. Choose the material and parameter.
3. Locate the supporting passage, figure, or table.
4. Record the raw value, unit, snippet, and locator.
5. Add context, confidence notes, and conflicts of interest.
6. Validate and save the evidence point.

The Curation Workbench provides PDF-assisted extraction and MIU editing.

## Data Integrity

- Do not invent precise values where a source is ambiguous.
- Preserve the verbatim supporting snippet within licensing limits.
- Keep raw values and units even when normalized values are available.
- Never delete unresolved migrated evidence; quarantine it with the original
  payload and a review reason.
- Source and material identifiers must reconcile before graph linkage.

## Related References

- [Source Management](../source/SOURCE_MANAGEMENT.md)
- [Knowledge Graph Migration](../roadmap/KNOWLEDGE_GRAPH_MIGRATION.md)
- [LLM MIU Extraction Prompts](./LLM_MIU_EXTRACTION_PROMPTS.md)
- [LLM Triage Prompt](./LLM_TRIAGE_PROMPT.md)
