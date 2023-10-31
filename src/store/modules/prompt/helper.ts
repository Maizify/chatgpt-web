import { ss } from '@/utils/storage'
import { getStorage, setStorage } from '@/api'

const LOCAL_NAME = 'promptStore'

export type PromptList = []

export interface PromptStore {
  promptList: PromptList
}

export function getLocalPromptList(): PromptStore {
  const promptStore: PromptStore | undefined = ss.get(LOCAL_NAME)
  return promptStore ?? { promptList: [] }
}

export function setLocalPromptList(promptStore: PromptStore): void {
  ss.set(LOCAL_NAME, promptStore)
}

export async function getRemotePromptList() {
  const resp = await getStorage(LOCAL_NAME)
  let promptStore: any = {}
  if (resp.status === 'Success')
    promptStore = resp.data
  return promptStore ?? { promptList: [] }
}

export async function setRemotePromptList(promptStore: PromptStore) {
  return setStorage(LOCAL_NAME, promptStore, null)
}
