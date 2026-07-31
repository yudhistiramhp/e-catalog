<script setup lang="ts">
import type { HTMLAttributes, Ref } from "vue"
import { defaultDocument, useEventListener, useMediaQuery } from "@vueuse/core"
import { TooltipProvider } from "reka-ui"
import { computed, ref } from "vue"
import { cn } from "@/lib/utils"
import { provideSidebarContext, SIDEBAR_COOKIE_MAX_AGE, SIDEBAR_COOKIE_NAME, SIDEBAR_KEYBOARD_SHORTCUT, SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON } from "./utils"

// ponytail: useState (survives navigation without re-init) replaces per-remount cookie reads.
// Each dashboard page mounts its own SidebarProvider; useState keeps the same ref across remounts
// so the sidebar stays in its last state (open or collapsed) when switching menus.
const SIDEBAR_MOBILE_COOKIE_NAME = "sidebar_mobile_state"

const props = withDefaults(defineProps<{
  defaultOpen?: boolean
  open?: boolean
  class?: HTMLAttributes["class"]
}>(), {
  defaultOpen: defaultDocument?.cookie.includes(`${SIDEBAR_COOKIE_NAME}=true`),
  open: undefined,
})

const emits = defineEmits<{
  "update:open": [open: boolean]
}>()

const isMobile = useMediaQuery("(max-width: 768px)")

// Single shared state across all SidebarProvider remounts.
const sharedOpen = useState<boolean>("sidebar-open", () => props.defaultOpen ?? false)
const sharedOpenMobile = useState<boolean>("sidebar-open-mobile", () =>
  defaultDocument?.cookie.includes(`${SIDEBAR_MOBILE_COOKIE_NAME}=true`) ?? false,
)

const open = ref(props.open !== undefined ? props.open : sharedOpen.value) as Ref<boolean>
const openMobile = ref(sharedOpenMobile.value)

// Sync local refs with shared state whenever it changes (e.g. set by another provider remount).
watch(sharedOpen, (v) => { if (props.open === undefined) open.value = v })
watch(sharedOpenMobile, (v) => { openMobile.value = v })
watch(open, (v) => { if (props.open === undefined) sharedOpen.value = v })

function setOpen(value: boolean) {
  open.value = value
  emits("update:open", value)
  // This sets the cookie to keep the sidebar state across full page reloads.
  if (defaultDocument) {
    defaultDocument.cookie = `${SIDEBAR_COOKIE_NAME}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
  }
}

function setOpenMobile(value: boolean) {
  openMobile.value = value
  sharedOpenMobile.value = value
  if (defaultDocument) {
    defaultDocument.cookie = `${SIDEBAR_MOBILE_COOKIE_NAME}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
  }
}

// Helper to toggle the sidebar.
function toggleSidebar() {
  return isMobile.value ? setOpenMobile(!openMobile.value) : setOpen(!open.value)
}

useEventListener("keydown", (event: KeyboardEvent) => {
  if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    toggleSidebar()
  }
})

// We add a state so that we can do data-state="expanded" or "collapsed".
// This makes it easier to style the sidebar with Tailwind classes.
const state = computed(() => open.value ? "expanded" : "collapsed")

provideSidebarContext({
  state,
  open,
  setOpen,
  isMobile,
  openMobile,
  setOpenMobile,
  toggleSidebar,
})
</script>

<template>
  <TooltipProvider :delay-duration="0">
    <div
      data-slot="sidebar-wrapper"
      :style="{
        '--sidebar-width': SIDEBAR_WIDTH,
        '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
      }"
      :class="cn('group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full', props.class)"
      v-bind="$attrs"
    >
      <slot />
    </div>
  </TooltipProvider>
</template>
