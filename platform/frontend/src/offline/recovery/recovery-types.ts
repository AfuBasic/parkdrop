export type HealthState = 
  | 'HEALTHY'
  | 'DEGRADED'
  | 'RECOVERY_REQUIRED'
  | 'REBUILDING'
  | 'BLOCKED';

export type StartupPhase =
  | 'AUTH_INIT'
  | 'DB_OPEN'
  | 'DB_MIGRATION'
  | 'LOCAL_HEALTH'
  | 'WORKSPACE_RESTORE'
  | 'SYNC_INIT'
  | 'READY';

export type ErrorCategory =
  | 'DB_OPEN_FAILED'
  | 'MIGRATION_FAILED'
  | 'CURSOR_INVALID'
  | 'MUTATION_INTEGRITY_FAILED'
  | 'STORAGE_QUOTA'
  | 'BOOTSTRAP_FAILED'
  | 'LOCAL_MEDIA_MISSING'
  | 'RECOVERY_INCOMPLETE';

export interface HealthCheckResult {
  state: HealthState;
  phase: StartupPhase;
  isHealthy: boolean;
  message?: string;
  errorCategory?: ErrorCategory;
  pendingMutationCount: number;
  quarantineCount: number;
  recoveredSyncingCount: number;
  timestamp: string;
}

export interface SanitizedDiagnosticReport {
  recoveryCode: string;
  appVersion: string;
  schemaVersion: number;
  browserEnvironment: string;
  healthState: HealthState;
  errorCategory?: ErrorCategory;
  pendingMutationCount: number;
  quarantineCount: number;
  hasOfflineLease: boolean;
  lastSuccessfulSyncAt: string | null;
  storageEstimateMb?: number;
  reportedAt: string;
}
