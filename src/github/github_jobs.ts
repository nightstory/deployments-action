import * as github from '@actions/github'
import {Context} from "@actions/github/lib/context"

export interface GitHubJob {
  readonly html_url: string | null
  readonly steps?: { conclusion: string | null }[]
}

export const getCurrentJob: (githubToken: string, context: Context) => Promise<GitHubJob> = async (githubToken: string, context: Context) => {
  const octokit = github.getOctokit(githubToken)

  const jobs = await octokit.rest.actions.listJobsForWorkflowRun({
      repo: context.repo.repo,
      owner: context.repo.owner,
      run_id: context.runId,
    }
  )
  const currentJob = jobs.data.jobs.filter(job => job.name === context.job)[0]

  return await octokit.rest.actions.getJobForWorkflowRun({
    repo: context.repo.repo,
    owner: context.repo.owner,
    job_id: currentJob.id,
  }).then(response => response.data)
}

export const isJobSuccessful = (job: GitHubJob) => {
  if (!job.steps) return false

  return job.steps.every(step => step.conclusion !== 'failure')
}