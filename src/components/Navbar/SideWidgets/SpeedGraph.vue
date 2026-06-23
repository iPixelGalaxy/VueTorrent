<script setup lang="ts">
import { ApexOptions } from 'apexcharts'
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { useTheme } from 'vuetify'
import { useI18nUtils } from '@/composables'
import { formatSpeed } from '@/helpers'
import dayjs from '@/plugins/dayjs'
import { useMaindataStore, useNavbarStore, useVueTorrentStore } from '@/stores'

const { t } = useI18nUtils()
const theme = useTheme()
const maindataStore = useMaindataStore()
const navbarStore = useNavbarStore()
const vuetorrentStore = useVueTorrentStore()

const uploadColor = theme.current.value.colors.upload as string
const downloadColor = theme.current.value.colors.download as string
const MIN_GRAPH_MAX = 1
type GraphPoint = [number, number | undefined]

function tooltipRow(color: string, name: string, value: number | undefined) {
  return `<div class="apexcharts-tooltip-series-group apexcharts-active" style="display:flex">
    <span class="apexcharts-tooltip-marker" style="background-color:${color}"></span>
    <div class="apexcharts-tooltip-text">
      <div class="apexcharts-tooltip-y-group">
        <span class="apexcharts-tooltip-text-y-label">${name}: </span>
        <span class="apexcharts-tooltip-text-y-value">${formatSpeed(value ?? 0, vuetorrentStore.useBitSpeed)}</span>
      </div>
    </div>
  </div>`
}

function getSeriesMax(series: GraphPoint[]) {
  return series.reduce((max, [, value]) => Math.max(max, value ?? 0), 0)
}

const downloadSpeedSerie = computed(() => navbarStore.downloadData.map(([x, y]) => [x, y] as GraphPoint))
const uploadSpeedSerie = computed(() => navbarStore.uploadData.map(([x, y]) => [x, y] as GraphPoint))
const downloadLimitSerie = computed(() => navbarStore.downloadData.map(([x]) => [x, maindataStore.serverState?.dl_rate_limit] as GraphPoint))
const uploadLimitSerie = computed(() => navbarStore.uploadData.map(([x]) => [x, maindataStore.serverState?.up_rate_limit] as GraphPoint))

const graphMax = computed(() => {
  const visibleSeries = [downloadSpeedSerie.value, uploadSpeedSerie.value]

  if (vuetorrentStore.displayGraphLimits) {
    if (maindataStore.serverState?.dl_rate_limit) visibleSeries.push(downloadLimitSerie.value)
    if (maindataStore.serverState?.up_rate_limit) visibleSeries.push(uploadLimitSerie.value)
  }

  return Math.max(MIN_GRAPH_MAX, ...visibleSeries.map(getSeriesMax)) * 1.15
})

const timeBounds = computed(() => ({
  min: navbarStore.downloadData[0]?.[0] ?? navbarStore.uploadData[0]?.[0],
  max: navbarStore.downloadData.at(-1)?.[0] ?? navbarStore.uploadData.at(-1)?.[0],
}))

const chartOptions = computed<ApexOptions>(() => ({
  chart: {
    parentHeightOffset: 0,
    redrawOnParentResize: false,
    toolbar: {
      show: false,
    },
    sparkline: {
      enabled: true,
    },
    animations: {
      enabled: false,
    },
  },
  xaxis: {
    min: timeBounds.value.min,
    max: timeBounds.value.max,
    type: 'datetime',
  },
  yaxis: {
    min: 0,
    max: graphMax.value,
  },
  colors: [uploadColor, downloadColor, uploadColor, downloadColor],
  stroke: {
    show: true,
    curve: 'smooth',
    lineCap: 'round',
    width: 3,
    dashArray: [0, 0, 20, 20],
  },
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'dark',
      type: 'vertical',
      shadeIntensity: 0.5,
      opacityFrom: [0.6, 0.6, 0, 0],
      opacityTo: [0.5, 0.5, 0, 0],
      stops: [0, 50, 100],
    },
  },
  dataLabels: {
    enabled: false,
  },
  markers: {
    size: 0,
    hover: {
      size: 0,
      sizeOffset: 0,
    },
  },
  tooltip: {
    fixed: {
      enabled: true,
      position: 'topLeft',
    },
    theme: 'dark',
    shared: true,
    custom: ({ dataPointIndex }) => {
      const time = navbarStore.downloadData[dataPointIndex]?.[0] ?? navbarStore.uploadData[dataPointIndex]?.[0]
      const rows = [
        tooltipRow(downloadColor, t('navbar.side.speed_graph.download_label'), navbarStore.downloadData[dataPointIndex]?.[1]),
        tooltipRow(uploadColor, t('navbar.side.speed_graph.upload_label'), navbarStore.uploadData[dataPointIndex]?.[1]),
      ]

      return `<div class="apexcharts-tooltip-title">${dayjs(time).format('HH:mm:ss')} (${dayjs(time).fromNow()})</div>${rows.join('')}`
    },
  },
}))

const series = computed(() => [
  {
    name: t('navbar.side.speed_graph.upload_label'),
    data: navbarStore.uploadData,
  },
  {
    name: t('navbar.side.speed_graph.download_label'),
    data: navbarStore.downloadData,
  },
  {
    name: t('navbar.side.speed_graph.upload_limit_label'),
    data: vuetorrentStore.displayGraphLimits && maindataStore.serverState?.up_rate_limit ? uploadLimitSerie.value : [],
  },
  {
    name: t('navbar.side.speed_graph.download_limit_label'),
    data: vuetorrentStore.displayGraphLimits && maindataStore.serverState?.dl_rate_limit ? downloadLimitSerie.value : [],
  },
])
</script>

<template>
  <div class="speed-graph">
    <VueApexCharts ref="chart" type="area" height="120" :options="chartOptions" :series="series" />
  </div>
</template>

<style scoped>
.speed-graph {
  width: 100%;
  height: 120px;
  min-width: 0;
  overflow: visible;
}

.speed-graph :deep(.apexcharts-marker),
.speed-graph :deep(.apexcharts-series-markers),
.speed-graph :deep(.apexcharts-point-annotations) {
  display: none;
}
</style>
