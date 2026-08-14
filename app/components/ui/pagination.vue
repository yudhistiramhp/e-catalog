<script setup lang="ts">
const props = defineProps<{
  total: number
  perPage?: number
  modelValue: number
}>()

const emit = defineEmits<{
  'update:modelValue': [page: number]
}>()

const perPage = computed(() => props.perPage ?? 10)
const totalPages = computed(() => Math.max(1, Math.ceil(props.total / perPage.value)))

const pages = computed(() => {
  const tp = totalPages.value
  const current = props.modelValue
  if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1)
  const pts: (number | '…')[] = [1]
  if (current > 3) pts.push('…')
  for (let i = Math.max(2, current - 1); i <= Math.min(tp - 1, current + 1); i++) pts.push(i)
  if (current < tp - 2) pts.push('…')
  pts.push(tp)
  return pts
})

const go = (p: number | '…') => { if (typeof p === 'number' && p !== props.modelValue) emit('update:modelValue', p) }
</script>

<template>
  <nav v-if="totalPages > 1" class="flex items-center justify-center gap-1 py-6" aria-label="Navigasi halaman">
    <button
      class="flex size-8 items-center justify-center border border-gray-200 text-xs text-brown-700 transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="modelValue <= 1"
      aria-label="Halaman sebelumnya"
      @click="go(modelValue - 1)"
    >
      ‹
    </button>
    <button
      v-for="(p, i) in pages"
      :key="i"
      class="flex size-8 items-center justify-center border text-xs transition-colors"
      :class="p === modelValue
        ? 'border-gold bg-gold text-brown-950 font-medium'
        : p === '…' ? 'border-transparent text-brown-400 cursor-default' : 'border-gray-200 text-brown-700 hover:border-gold hover:text-gold'"
      :aria-current="p === modelValue ? 'page' : undefined"
      :aria-label="p === '…' ? 'Ellipsis' : `Halaman ${p}`"
      :disabled="p === '…'"
      @click="go(p)"
    >
      {{ p }}
    </button>
    <button
      class="flex size-8 items-center justify-center border border-gray-200 text-xs text-brown-700 transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="modelValue >= totalPages"
      aria-label="Halaman selanjutnya"
      @click="go(modelValue + 1)"
    >
      ›
    </button>
  </nav>
</template>