import * as github from '@actions/github'
import {Context} from "@actions/github/lib/context"
import {GithubCommit} from "./github_models";

export const extractMeaningfulStrings = async (githubToken: string, context: Context) => {
  const octokit = github.getOctokit(githubToken)
  const results: string[] = []

  switch (context.eventName) {
    case 'push': {
      const commits = [
        ...context.payload.commits,
        context.payload.head_commit,
      ]

      results.push(...commits.map(commit => commit.message))
      break
    }
    case 'pull_request': {
      const pr: any = context.payload.pull_request
      const prResults: string[] = extractPrMeaningfulStrings(pr)

      results.push(...prResults)
      break
    }
  }

  const commit = await octokit.rest.repos.getCommit(
    {repo: context.repo.repo, owner: context.repo.owner, ref: context.sha}
  )
  const commitPulls = await octokit.rest.repos.listPullRequestsAssociatedWithCommit(
    {repo: context.repo.repo, owner: context.repo.owner, commit_sha: context.sha}
  )

  const defaultResults: string[] = [
    context.ref ?? '',
    commit?.data?.commit?.message ?? '',
  ]

  commitPulls.data?.forEach((pr: any) => {
    defaultResults.push(...extractPrMeaningfulStrings(pr))
  })

  results.push(...defaultResults)

  return {
    meaningfulStrings: [...new Set(results)].filter(i => i.length > 0),
    descriptions: [ commit?.data?.commit?.message ?? '', ...(commitPulls.data?.map(pr => pr.title) ?? []) ].filter(i => i.length > 0),
  }
}

const extractPrMeaningfulStrings: (pr: { title?: string, body?: string, head?: { ref?: string } }) => string[] =
  (pr) => [
    pr?.title ?? '',
    pr?.body ?? '',
    pr?.head?.ref ?? '',
  ]