import {HttpClient} from '@actions/http-client'
import {BearerCredentialHandler} from '@actions/http-client/lib/auth'
import {getAccessToken, getCloudID} from './jira_auth'
import {Context} from '@actions/github/lib/context'
import {JiraDeployment, JiraDeploymentState, JiraSubmitDeploymentsResponse} from './jira_models'

export interface Options {
  readonly debug: boolean

  readonly clientId: string
  readonly clientSecret: string
  readonly domain: string

  readonly context: Context
  readonly deploymentId: number
  readonly environment: string
  readonly jobUrl: string
  readonly state: JiraDeploymentState

  readonly issueKeys: string[]
  readonly description: string
}

/**
 * @return true if success
 */
export const createJiraDeployment = async (options: Options) => {
  const httpUnauthorized = new HttpClient()
  const token = await getAccessToken(httpUnauthorized, options.clientId, options.clientSecret)
  const cloudId = await getCloudID(httpUnauthorized, options.domain)

  const http = new HttpClient('GitHub Actions', [new BearerCredentialHandler(token)])

  const deployment: JiraDeployment = mapDeployment(options)
  const properties = {
    repository: options.context.payload.repository!.full_name,
    workflow: options.context.workflow,
    environment: options.environment,
    id: deployment.deploymentSequenceNumber,
  }

  const response = await http.postJson<JiraSubmitDeploymentsResponse>(
    `https://api.atlassian.com/jira/deployments/0.1/cloud/${cloudId}/bulk`,
    {properties, deployments: [deployment]},
    {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
  )

  if (options.debug) {
    console.log(JSON.stringify({ 'platform': 'jira', deployment, response }))
  }

  return !(response.result?.rejectedDeployments && response.result.rejectedDeployments.length > 0)
}

const mapDeployment = ({context, deploymentId, environment, issueKeys, ...options}: Options) => {
  const guessTypes = types.filter(t => t.indexOf(environment) !== -1 || environment.indexOf(t) !== -1)
  const num = Number.parseInt(process.env['GITHUB_RUN_NUMBER']!)
  const uniqueId = `${context.payload.repository!.full_name}/${context.workflow}/#${num}`
  const envId = `${context.payload.repository!.full_name}/${environment}`.slice(0, 255)

  return ({
    schemaVersion: '1.0',
    deploymentSequenceNumber: num,
    updateSequenceNumber: new Date().getTime() / 1000,
    displayName: uniqueId.slice(0, 255),
    url: options.jobUrl,
    description: options.description.slice(0, 255),
    lastUpdated: new Date().toISOString(),
    label: context.repo.repo,
    state: options.state,
    pipeline: {
      id: `${envId}/${context.workflow}`,
      displayName: uniqueId.slice(0, 255),
      url: options.jobUrl,
    },
    environment: {
      id: envId,
      displayName: environment.slice(0, 255),
      type: guessTypes.length > 0 ? guessTypes[0] : 'unmapped',
    },
    associations: [{associationType: 'issueIdOrKeys', values: issueKeys}]
  } as JiraDeployment)
}

const types = ['unmapped', 'development', 'testing', 'staging', 'production']