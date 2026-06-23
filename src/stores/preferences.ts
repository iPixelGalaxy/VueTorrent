import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'
import qbit from '@/services/qbit'
import AppPreferences from '@/types/qbit/models/AppPreferences'
import { AppPreferencesPayload } from '@/types/qbit/payloads'

export const usePreferenceStore = defineStore(
  'preferences',
  () => {
    const preferences = ref<AppPreferences>()
    let fetchPromise: Promise<void> | undefined

    async function fetchPreferences() {
      if (!fetchPromise) {
        fetchPromise = qbit
          .getPreferences()
          .then(value => {
            preferences.value = value
          })
          .finally(() => {
            fetchPromise = undefined
          })
      }

      await fetchPromise
    }

    async function ensurePreferences() {
      if (!preferences.value) {
        await fetchPreferences()
      }
    }

    async function setPreferences(newPref?: AppPreferencesPayload) {
      await qbit.setPreferences(newPref ?? preferences.value!)
    }

    return {
      preferences,
      fetchPreferences,
      ensurePreferences,
      setPreferences,
      $reset: async () => {
        await fetchPreferences()
      },
    }
  },
  {
    persistence: {
      enabled: true,
      storageItems: [{ storage: sessionStorage }],
    },
  }
)

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePreferenceStore, import.meta.hot))
}
