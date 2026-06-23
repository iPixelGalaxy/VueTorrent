import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'

const GRAPH_SIZE = 15
const GRAPH_INTERVAL_MS = 1000
const GRAPH_STALE_MS = 8000

function createTimeData(now = new Date().getTime()) {
  return Array.from({ length: GRAPH_SIZE }, (_, index) => now - (GRAPH_SIZE - index - 1) * GRAPH_INTERVAL_MS)
}

export const useNavbarStore = defineStore(
  'navbar',
  () => {
    const { mobile } = useDisplay({ mobileBreakpoint: 'md' })

    const isDrawerOpen = ref(!mobile.value)

    const _timeData = ref<number[]>(createTimeData())
    const _downloadData = ref<number[]>(new Array(GRAPH_SIZE).fill(0))
    const _uploadData = ref<number[]>(new Array(GRAPH_SIZE).fill(0))

    const downloadData = computed(() => _timeData.value.map((e, i) => [e, _downloadData.value[i]]))
    const uploadData = computed(() => _timeData.value.map((e, i) => [e, _uploadData.value[i]]))

    function pushTimeData(maxGapMs = GRAPH_STALE_MS) {
      const now = new Date().getTime()
      const previousTime = _timeData.value.at(-1)

      if (previousTime && now - previousTime > maxGapMs) {
        resetGraph(now)
      }

      _timeData.value.shift()
      _timeData.value.push(now)
    }

    function pushDownloadData(data?: number) {
      _downloadData.value.shift()
      _downloadData.value.push(data ?? 0)
    }

    function pushUploadData(data?: number) {
      _uploadData.value.shift()
      _uploadData.value.push(data ?? 0)
    }

    function resetGraph(now?: number) {
      _timeData.value = createTimeData(now)
      _downloadData.value = new Array(GRAPH_SIZE).fill(0)
      _uploadData.value = new Array(GRAPH_SIZE).fill(0)
    }

    return {
      isDrawerOpen,
      _timeData,
      _downloadData,
      _uploadData,
      downloadData,
      uploadData,
      pushTimeData,
      pushDownloadData,
      pushUploadData,
      resetGraph,
      $reset: () => {
        resetGraph()
      },
    }
  },
  {
    persistence: {
      enabled: true,
      storageItems: [{ storage: localStorage, includePaths: ['isDrawerOpen'] }],
    },
  }
)

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useNavbarStore, import.meta.hot))
}
