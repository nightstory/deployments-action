export type JiraDeploymentState = 'unknown' | 'pending' | 'in_progress' | 'cancelled' | 'failed' | 'rolled_back' | 'successful'

export type JiraEnvironmentType = 'unmapped' | 'development' | 'testing' | 'staging' | 'production'

export interface JiraDeployment {
  readonly schemaVersion: string
  readonly deploymentSequenceNumber: number
  readonly updateSequenceNumber: number
  readonly displayName: string
  readonly url: string
  readonly description: string
  readonly lastUpdated: string
  readonly label: string
  readonly state: JiraDeploymentState
  readonly pipeline: {
    readonly id: string
    readonly displayName: string
    readonly url: string
  }
  readonly environment: {
    readonly id: string
    readonly displayName: string
    readonly type: JiraEnvironmentType
  }
  readonly associations: any[]
}

export interface JiraSubmitDeploymentsResponse {
  readonly rejectedDeployments?: any[]
}

export interface JiraAuthResponse {
  readonly access_token: string
}

export interface JiraTenantInfo {
  readonly cloudId: string
}