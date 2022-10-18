import * as exec from '@actions/exec';

export interface DockerImageInfo {
  readonly originalTag: string
  readonly image: string
  readonly tag: string | null
  readonly sha: string
  readonly size: string
}

// https://regex101.com/library/qZzD8w
const dockerTagRegexStr = /^(:(=[^:\/]{4,253})(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(?:\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))*(?::[0-9]{1,5})?\/)?(?<image>(?![._-])[a-z0-9._-]*(?::[0-9]{1,5})?(?<![._-])(?:\/(?![._-])[a-z0-9._-]*(?<![._-]))*)(?:(:(?![.-])(?<tag>[a-zA-Z0-9_.-]{1,128}))|@sha256:(?<sha>[0-9a-f]{64}))?$/;

export const parseDockerImageInfo = async (tag: string) => {
  const groups = tag.match(dockerTagRegexStr)?.groups
  if (!groups) return null

  return {
    originalTag: tag,
    image: (groups.image?.trim() ?? '').trim(),
    tag: (groups.tag?.trim() ?? '').trim(),
    sha: (groups.sha?.trim() ?? await getImageSha(tag)).trim(),
    size: (await getImageSize(tag)).trim(),
  } as DockerImageInfo
}

const getImageSha = async (image: string) => {
  try {
    const result = await exec.getExecOutput('docker', ['inspect', '--format=\'{{index .RepoDigests 0}}\'', image]);
    if (result.exitCode != 0) return ''
    return normalize(result.stdout).match(dockerTagRegexStr)?.groups?.sha ?? ''
  } catch (e) {
    return ''
  }
}

const getImageSize = async (image: string) => {
  try {
    const sizeBytes = await exec.getExecOutput('docker', ['inspect', '--format=\'{{ .Size }}\'', image]);
    if (sizeBytes.exitCode != 0) return ''
    const sizeFormatted = await exec.getExecOutput('numfmt', ['--to=si', normalize(sizeBytes.stdout)]);
    if (sizeFormatted.exitCode != 0) return ''

    return normalize(sizeFormatted.stdout ?? '')
  } catch (e) {
    return ''
  }
}

const normalize = (str: string) => str.replace(/['"‘`]/g, '').trim()