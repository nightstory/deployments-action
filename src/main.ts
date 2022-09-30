import * as core from '@actions/core'
import * as github from '@actions/github'

import getOptions, {Options, validateOptions} from './options'
import {createGithubDeploymentStatus} from './github/github_deployments'
import {getCurrentJob} from './github/github_jobs'
import {createJiraDeployment} from './jira/jira_deployments'
import {extractMeaningfulStrings} from './github/github_events'
import {extractJiraTickets} from './jira/jira_tickets'

const main = async () => {
  const options: Options = getOptions()

  if (!validateOptions(options)) {
    process.exit(1)
  }

  const jobUrl = (await getCurrentJob(options.githubToken, github.context)).html_url!!
  const state = 'in_progress'

  const {meaningfulStrings, descriptions} = await extractMeaningfulStrings(options.githubToken, github.context)
  let jiraKeys = [...new Set(meaningfulStrings.map(i => extractJiraTickets(i)).flat())]

  const deploymentId = await createGithubDeploymentStatus(
    {
      context: github.context,
      environment: options.environment,
      githubToken: options.githubToken,
      requiredContexts: options.githubRequiredContexts,
      jobUrl: jobUrl,
      state: state,
      description: descriptions.join('\n'),
      debug: options.debug,
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
        jobUrl: jobUrl,
        state: state,
        issueKeys: jiraKeys,
        description: descriptions.join('\n'),
        debug: options.debug,
      }
    )
  } else {
    if (options.jiraFailNoTickets) {
      core.setFailed('No JIRA-IDs found')
      process.exit(1)
    } else {
      core.warning('No JIRA-IDs extracted, skipping jira deployment')
    }
  }
}

try {
  main()
} catch (error) {
  core.setFailed(`${error}`)
}