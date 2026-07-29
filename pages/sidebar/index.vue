<script lang="ts">
export const iframeHeight = "800px"
export const description = "A sidebar with a header and a search form."
</script>

<script setup lang="ts">
import AppSidebar from '../../app/components/AppSidebar.vue'
import SiteHeader from '../../app/components/SiteHeader.vue'
import {
  SidebarInset,
  SidebarProvider,
} from '../../app/components/ui/sidebar'
</script>

<template>
  <div class="min-h-svh bg-cream [--header-height:calc(--spacing(14))]">
    <SidebarProvider class="flex min-h-svh flex-col bg-cream">
      <SiteHeader class="shrink-0 bg-cream" />
      <div class="flex min-h-0 flex-1">
        <AppSidebar class="bg-brown-950" />
        <SidebarInset class="min-h-0 bg-cream">
          <div class="flex min-h-0 flex-1 flex-col gap-4 bg-cream p-4">
            <div class="grid auto-rows-min gap-4 md:grid-cols-3">
              <div class="aspect-video rounded-xl bg-gray-light" />
              <div class="aspect-video rounded-xl bg-gray-light" />
              <div class="aspect-video rounded-xl bg-gray-light" />
            </div>
            <div class="min-h-[60vh] flex-1 rounded-xl bg-gray-light" />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  </div>
</template>
