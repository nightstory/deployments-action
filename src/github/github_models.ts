export type GithubDeploymentState = 'error' | 'failure' | 'inactive' | 'in_progress' | 'queued' | 'pending' | 'success'

export interface GithubDeployment {
  readonly id: number
}

export interface GithubCommit {
  readonly message: string
}