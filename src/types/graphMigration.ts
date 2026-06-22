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
