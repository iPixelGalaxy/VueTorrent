<script setup lang="ts" generic="T">
import { useSorted } from '@vueuse/core'
import { useI18nUtils } from '@/composables'
import { comparators } from '@/helpers'

const props = defineProps<{
  title: string
  items: { title: string; value: T }[]
}>()

defineSlots<{
  'prepend-item'(): any
}>()

defineEmits<{
  disable: []
}>()

const modelValue = defineModel<T[]>({ required: true })

const orderedItems = useSorted(
  () => props.items,
  (a, b) => comparators.text.asc(a.title, b.title)
)

const { t } = useI18nUtils()

function getSelectionStyle(text: string) {
  return {
    fontSize: `${Math.max(11.5, Math.min(14, 320 / Math.max(text.length, 1)))}px`,
  }
}
</script>

<template>
  <v-list-item class="px-0 pb-3">
    <v-list-item-title class="px-0 ml-1 text-body-large">
      {{ title }}
    </v-list-item-title>
    <v-autocomplete
      v-model="modelValue"
      :items="orderedItems"
      :placeholder="t('navbar.side.filters.disabled')"
      bg-color="secondary"
      class="text-accent pt-1"
      density="compact"
      hide-details
      multiple
      variant="solo">
      <template #prepend-item>
        <v-list-item :title="t('common.disable')" @click="$emit('disable')" />
        <slot name="prepend-item"></slot>
        <v-divider />
      </template>
      <template #selection="{ item, index }">
        <span v-if="index === 0 && modelValue.length === 1" class="filter-selection text-accent" :style="getSelectionStyle(item.title)">{{ item.title }}</span>
        <span v-else-if="index === 0" class="filter-selection text-accent" :style="getSelectionStyle(t('navbar.side.filters.activeFilter', modelValue.length))">{{
          t('navbar.side.filters.activeFilter', modelValue.length)
        }}</span>
      </template>
    </v-autocomplete>
  </v-list-item>
</template>

<style scoped>
.filter-selection {
  display: block;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
}

:deep(.v-field__input),
:deep(.v-autocomplete__selection) {
  min-width: 0;
}

:deep(.v-autocomplete__selection) {
  max-width: 100%;
}
</style>
