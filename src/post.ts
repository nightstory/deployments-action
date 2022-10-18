import * as core from '@actions/core'
import * as github from '@actions/github'

import getOptions, {Options, validateOptions} from './options'
import {createGithubDeploymentStatus} from './github/github_deployments'
import {ENV_KEY_DEPLOYMENT_ID} from './const'
import {getCurrentJob, isJobSuccessful} from './github/github_jobs'
import {createJiraDeployment} from './jira/jira_deployments'
import {extractMeaningfulStrings} from './github/github_events'
import {extractJiraTickets} from './jira/jira_tickets'
import {dockerPrintImagesInfo} from './docker/docker_images_info';
import * as util from 'util';

const main = async () => {
  const options: Options = getOptions()

  if (!validateOptions(options)) {
    process.exit(1)
  }

  const deploymentId = Number.parseInt(process.env[ENV_KEY_DEPLOYMENT_ID]!!)
  const job = await getCurrentJob(options.githubToken, github.context)
  const isSuccess = isJobSuccessful(job)

  const {meaningfulStrings, descriptions} = await extractMeaningfulStrings(options.githubToken, github.context)
  let jiraKeys = [...new Set(meaningfulStrings.map(i => extractJiraTickets(i)).flat())]

  await createGithubDeploymentStatus(
    {
      context: github.context,
      deploymentId: deploymentId,
      environment: options.environment,
      githubToken: options.githubToken,
      requiredContexts: options.githubRequiredContexts,
      jobUrl: job.html_url!!,
      state: isSuccess ? 'success' : 'failure',
      debug: options.debug,
      description: descriptions.join('\n'),
    }
  )

  if (options.jiraProjects.length > 0) {
    jiraKeys = jiraKeys.filter(jiraKey => options.jiraProjects.some(proj => jiraKey.toLowerCase().indexOf(`${proj}-`.toLowerCase()) !== -1))
  }

  if (jiraKeys.length > 0) {
    await createJiraDeployment(
      {
        clientId: options.jiraClientId,
        clientSecret: options.jiraClientSecret,
        context: github.context,
        deploymentId: deploymentId,
        domain: options.jiraDomain,
        environment: options.environment,
        jobUrl: job.html_url!!,
        state: isSuccess ? 'successful' : 'failed',
        issueKeys: jiraKeys,
        description: descriptions.join('\n'),
        debug: options.debug,
      }
    )
  } else {
    if (options.jiraFailNoTickets) {
      core.setFailed('No JIRA-IDs found')
      process.exit(1)
    }
  }

  if (options.dockerTags.length > 0) {
    try {
      await dockerPrintImagesInfo(options.dockerTags)
    } catch (e) {
      core.setFailed(util.types.isNativeError(e) ? e : `${e}`)
    }
  }
}

try {
  main()
} catch (error) {
  core.setFailed(`${error}`)
}