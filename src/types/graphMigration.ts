export interface EntityBackfillSummary {
  processed: number;
  inserts: number;
  updates: number;
  reconciled: number;
  conflicts: number;
  unresolved: number;
}

export interface EntityBackfillGraphSnapshot {
  entity_count: number;
  binding_count: number;
  entities_checksum: string;
  bindings_checksum: string;
}

export interface EntityBackfillPhaseReport {
  entity_type: string;
  binding_column: string;
  source_count: number;
  source_checksum: string;
  mapped_checksum: string;
  summary: EntityBackfillSummary;
  samples: Record<string, unknown[]>;
}

export interface EntityBackfillDryRunReport {
  migration_version: string;
  mode: "dry_run";
  mutation_performed: false;
  mutation_detected: false;
  generated_at: string;
  sample_limit: number;
  report_checksum: string;
  status_mapping: Record<string, string>;
  summary: EntityBackfillSummary;
  prospective_writes: {
    entity_inserts: number;
    canonical_binding_inserts: number;
    entity_updates: number;
    total: number;
  };
  blocking_issue_count: number;
  orphan_bindings: Array<Record<string, unknown>>;
  graph_snapshot_before: EntityBackfillGraphSnapshot;
  graph_snapshot_after: EntityBackfillGraphSnapshot;
  graph_inventory: {
    unbound_entity_count: number;
  };
  phases: Record<string, EntityBackfillPhaseReport>;
}

export interface EntityBackfillDryRunResponse {
  success: boolean;
  ready_to_apply: boolean;
  report: EntityBackfillDryRunReport;
}

export interface EntityBackfillCapabilities {
  migration_version: string;
  apply_enabled: boolean;
  apply_confirmation: string;
  phases: string[];
  graph_reads_enabled: false;
  compatibility_writes_enabled: false;
}

export interface EntityBackfillRecoveryArtifact {
  schema_version: "4.0";
  sha256: string;
  location: string;
}

export interface EntityBackfillApplyRequest {
  confirmation: string;
  expected_report_checksum: string;
  recovery_artifact: EntityBackfillRecoveryArtifact;
}

export interface EntityBackfillRunDetail {
  run: Record<string, unknown>;
  checkpoints: Array<Record<string, unknown>>;
  issues: Array<Record<string, unknown>>;
}
