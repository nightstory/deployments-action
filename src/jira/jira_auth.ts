import {HttpClient} from '@actions/http-client'
import {JiraAuthResponse, JiraTenantInfo} from "./jira_models"

export const getAccessToken = async (httpClient: HttpClient, clientId: string, clientSecret: string) => {
  const response = await httpClient.postJson<JiraAuthResponse>(
    'https://api.atlassian.com/oauth/token',
    {
      'audience': 'api.atlassian.com',
      'grant_type': 'client_credentials',
      'client_id': clientId,
      'client_secret': clientSecret,
    },
    {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    })

  return response.result!.access_token
}

export const getCloudID = async (httpClient: HttpClient, domain: string) => {
  const response = await httpClient.getJson<JiraTenantInfo>(`https://${domain}.atlassian.net/_edge/tenant_info`)
  return response.result!.cloudId
}