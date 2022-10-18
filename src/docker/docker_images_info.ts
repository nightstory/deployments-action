import * as core from '@actions/core';
import {parseDockerImageInfo} from './docker_parser';

export const dockerPrintImagesInfo = async (tags: string[]) => {
  const alreadyPrintedAdditionalInfo = new Set<string>()

  for (let tag of tags) {
    const info = await parseDockerImageInfo(tag)
    let string = `Image`

    if (info && info.size && (!info.sha || !alreadyPrintedAdditionalInfo.has(info.sha))) {
      string += ` <${info.size}>`
    }

    string += ` ${tag}`

    if (info && info.sha && tag.indexOf(info.sha) === -1 && !alreadyPrintedAdditionalInfo.has(info.sha)) {
      string += ` (SHA:${info.sha})`
      alreadyPrintedAdditionalInfo.add(info.sha)
    }

    core.notice(string)
  }
}