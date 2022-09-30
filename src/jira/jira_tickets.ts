const jiraTicketRegex = /[A-Z]{2,}-\d+/gmi

export const extractJiraTickets: (string: string) => string[] = (string) => {
  const result = string.match(jiraTicketRegex)
  return result ? [...result] : []
}