import * as github from '@actions/github'
import {Context} from '@actions/github/lib/context'
import * as core from '@actions/core'
import {ENV_KEY_DEPLOYMENT_ID} from '../const'
import {GithubDeployment, GithubDeploymentState} from './github_models'

interface Options {
  readonly debug: boolean
  readonly description: string

  readonly githubToken: string
  readonly context: Context
  readonly environment: string
  readonly requiredContexts: string[]

  readonly state: GithubDeploymentState
  readonly jobUrl: string

  readonly deploymentId?: number
}

export const createGithubDeploymentStatus = async ({context: {repo, ref}, environment, ...options}: Options) => {
  const octokit = github.getOctokit(options.githubToken)

  let deploymentId = options.deploymentId

  if (!deploymentId) {
    const deploymentRequest = {
      owner: repo.owner,
      repo: repo.repo,
      ref: ref,
      description: options.description,
      required_contexts: options.requiredContexts,
      environment: environment,
    };
    const deployment: GithubDeployment = (await octokit.rest.repos.createDeployment(deploymentRequest)).data as GithubDeployment

    if (options.debug) {
      console.log(JSON.stringify({ 'platform': 'github', deploymentRequest, deployment }))
    }

    deploymentId = deployment.id
    core.exportVariable(ENV_KEY_DEPLOYMENT_ID, `${deploymentId}`)
  }

  const response = await octokit.rest.repos.createDeploymentStatus({
    owner: repo.owner,
    repo: repo.repo,
    // @ts-ignore
    environment: environment,
    auto_inactive: true,
    deployment_id: deploymentId,
    state: options.state,
    log_url: options.jobUrl,
    environment_url: `https://github.com/${repo.owner}/${repo.repo}/deployments/activity_log?environments_filter=${environment}`,
  })

  if (options.debug) {
    console.log(JSON.stringify({ 'platform': 'github', response }))
  }

  return deploymentId
}