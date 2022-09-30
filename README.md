# GitHub + Jira deployments via GitHub Actions

This action allows to create a deployment from a GitHub workflow job run.<br/>
Then, this deployment is submitted to GitHub Deployments and Jira Deployments at the same time.<br/>
The result (success or failure) is calculated in post-action (it runs even if the other steps fail).

## Inputs
- `github_token`
    - Environment alternative: `DA_GITHUB_TOKEN`
    - required: `true`
    - This token must have access to GitHub APIs: commits, PRs, deployments.
- `environment`
    - Environment alternative: `DA_ENVIRONMENT`
    - required: `false`, default: `dev`
    - Any string. The common ones: `dev` / `development`, `prod` / `production`, `staging`.
- `github_required_contexts` (CSV)
    - Environment alternative: `DA_GITHUB_REQUIRED_CONTEXTS`
    - required: `false`, default: `[]` (ignored)
    - [Read docs](https://docs.github.com/en/rest/deployments/deployments#create-a-deployment)
- `jira_domain`
    - Environment alternative: `DA_JIRA_DOMAIN`
    - `https://{jira_domain}.atlassian.net`
- `jira_client_id`
    - Environment alternative: `DA_JIRA_CLIENT_ID`
    - required: `true`
    - [More info](https://developer.atlassian.com/cloud/jira/software/integrate-jsw-cloud-with-onpremises-tools/)
- `jira_client_secret`
    - Environment alternative: `DA_JIRA_CLIENT_SECRET`
    - required: `true`
    - [More info](https://developer.atlassian.com/cloud/jira/software/integrate-jsw-cloud-with-onpremises-tools/)
- `jira_projects` (CSV)
    - Environment alternative: `DA_JIRA_PROJECTS`
    - required: `false`, default: any project (by regex)
    - If specified, only tickets from these projects are extracted.
- `jira_fail_no_tickets`
    - Environment alternative: `DA_JIRA_FAIL_NO_TICKETS`
    - required: `false`, default: `false`
    - Set to true to fail the workflow if no JIRA IDs extracted. Uses `jira_projects`, if specified.

## Example usage

Example of your issue: `https://foobar.atlassian.net/browse/KEKW-15`

With environment variables:
```yaml
name: 'deploy'

on: push

env:
  DA_GITHUB_TOKEN: ${{ secrets.YOUR_PAT }}
  DA_ENVIRONMENT: production
  DA_JIRA_DOMAIN: foobar
  DA_JIRA_CLIENT_ID: ${{ secrets.JIRA_CLIENT_ID }}
  DA_JIRA_CLIENT_SECRET: ${{ secrets.JIRA_CLIENT_SECRET }}
  DA_JIRA_PROJECTS: KEKW
  DA_JIRA_FAIL_NO_TICKETS: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: nightstory/deployments-action@v1

      - run: ./deploy_script.sh
```

Without environment variables:
```yaml
name: 'deploy'

on: push

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: nightstory/deployments-action@v1
        with:
          github_token: ${{ secrets.YOUR_PAT }}
          environment: production
          jira_domain: foobar
          jira_client_id: ${{ secrets.JIRA_CLIENT_ID }}
          jira_client_secret: ${{ secrets.JIRA_CLIENT_SECRET }}
          jira_projects: KEKW
          jira_fail_no_tickets: true

      - run: ./deploy_script.sh
```

## License
Licensed under MIT license.<br/>
Please also see [licenses.txt](lib_main/licenses.txt)