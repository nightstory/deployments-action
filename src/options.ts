import * as core from '@actions/core'

export interface Options {
  readonly debug: boolean
  readonly environment: string

  readonly githubToken: string
  readonly githubRequiredContexts: string[]

  readonly jiraDomain: string
  readonly jiraClientId: string
  readonly jiraClientSecret: string
  readonly jiraProjects: string[]
  readonly jiraFailNoTickets: boolean

  readonly dockerTags: string[]
}

const findOption: (inputKey: string, envKey: string) => (string | null) =
  (inputKey, envKey) => {
    const input = core.getInput(inputKey)

    if (input.length === 0) {
      return process.env[envKey] ?? null
    } else {
      return input
    }
  }

const requireOption: (inputKey: string, envKey: string) => string =
  (inputKey, envKey) => {
    const result = findOption(inputKey, envKey)
    if (!result) {
      core.setFailed(`input ${inputKey} (or env ${envKey}) is required but was missing`)
      process.exit(1)
    }
    return result!
  }

const getFlag: (inputKey: string, envKey: string, def: boolean) => boolean =
  (inputKey, envKey, def) => {
    const result = findOption(inputKey, envKey)
    return result ? result === 'true' : def
  }

const getOptions: () => Options = () => ({
  debug: getFlag('debug', 'DA_DEBUG', false),
  environment: findOption('environment', 'DA_ENVIRONMENT') ?? 'dev',
  githubToken: requireOption('github_token', 'DA_GITHUB_TOKEN'),
  githubRequiredContexts: parseArray(findOption('github_required_contexts', 'DA_GITHUB_REQUIRED_CONTEXTS')),
  jiraDomain: requireOption('jira_domain', 'DA_JIRA_DOMAIN'),
  jiraClientId: requireOption('jira_client_id', 'DA_JIRA_CLIENT_ID'),
  jiraClientSecret: requireOption('jira_client_secret', 'DA_JIRA_CLIENT_SECRET'),
  jiraProjects: parseArray(findOption('jira_projects', 'DA_JIRA_PROJECTS')),
  jiraFailNoTickets: getFlag('jira_fail_no_tickets', 'DA_JIRA_FAIL_NO_TICKETS', false),
  dockerTags: parseArray(findOption('docker_tags', 'DA_DOCKER_TAGS')),
})

const parseArray: (input: (string | null)) => (string[]) = (input) => {
  if (!input || input.length === 0) return []

  return input.split('\n')
    .map(line => line.split(','))
    .flat()
    .map(i => i.trim())
    .filter(i => i.length > 0)
}


export const validateOptions: (options: Options) => boolean =
  (o) => {
    let result = true

    if ([o.githubToken, o.environment, o.jiraDomain, o.jiraClientId, o.jiraClientSecret].some(v => v.length === 0)) {
      core.setFailed(`github and jira credentials must not be empty`)
      result = false
    }

    return result
  }

export default getOptions