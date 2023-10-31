import { ss } from '@/utils/storage'
import { getStorage, setStorage } from '@/api'

const LOCAL_NAME = 'chatStorage'

export function defaultState(): Chat.ChatState {
  const uuid = 1002
  return {
    active: uuid,
    usingContext: true,
    history: [{ uuid, title: 'New Chat', isEdit: false }],
    chat: [{ uuid, data: [] }],
  }
}

export function getLocalState(): Chat.ChatState {
  const localState = ss.get(LOCAL_NAME)
  return { ...defaultState(), ...localState }
}

export function setLocalState(state: Chat.ChatState) {
  ss.set(LOCAL_NAME, state)
}

export async function getRemoteState() {
  const resp = await getStorage(LOCAL_NAME)
  let remoteState: any = {}
  if (resp.status === 'Success')
    remoteState = resp.data

  return { ...defaultState(), ...remoteState }
}

export async function setRemoteState(state: Chat.ChatState) {
  return setStorage(LOCAL_NAME, state, null)
}
