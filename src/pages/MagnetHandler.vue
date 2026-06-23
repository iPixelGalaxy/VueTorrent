<script setup lang="ts">
import { onBeforeMount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { extractMagnetLink, openMagnetDialog, savePendingMagnet } from '@/composables/MagnetLaunch'
import { useAppStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

onBeforeMount(async () => {
  const magnetLink = extractMagnetLink(route.params.url as string)
  if (magnetLink) {
    if (appStore.isAuthenticated) {
      await openMagnetDialog(magnetLink)
    } else {
      savePendingMagnet(magnetLink)
    }
  }
  await router.push({ name: 'dashboard' })
})
</script>
