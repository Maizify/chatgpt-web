import { defineStore } from 'pinia'
import type { PromptStore } from './helper'
import { getLocalPromptList, getRemotePromptList, setLocalPromptList, setRemotePromptList } from './helper'

export const usePromptStore = defineStore('prompt-store', {
  state: (): PromptStore => getLocalPromptList(),

  actions: {
    updatePromptList(promptList: []) {
      this.$patch({ promptList })
      setLocalPromptList({ promptList })
      setRemotePromptList({ promptList })
    },
    getPromptList() {
      return this.$state
    },
    async loadRemoteState() {
      const state = await getRemotePromptList()
      if (state) {
        this.$patch(state)
        setLocalPromptList(state)
      }
    },
  },
})
