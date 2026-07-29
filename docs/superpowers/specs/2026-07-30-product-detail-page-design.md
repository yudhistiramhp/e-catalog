# Product Detail Page — Design

**Date:** 2026-07-30
**Topic:** Dynamic product detail page using real product data, displaying per-variant photos and colors.
**Status:** Approved (pending implementation)

## Problem

`app/pages/products/[id].vue` renders a hardcoded dummy `products` array. It ignores real data in
Firestore (`Produk` with nested `jenis[].colors[]`, each color carrying `imageUrl`, `hex`, `name`).
Catalog cards open a modal with a "Lihat Detail Lengkap" link to `/products/:id`, but the destination
shows nothing real. Goal: make the detail page show the actual product, including a photo for every
variant/color.

## Scope

- `app/composables/useProduk.ts` — add a single-document realtime subscription.
- `app/pages/products/[id].vue` — replace dummy data with real subscription + variant gallery.
- `app/pages/catalog.vue` — no change. Modal stays; existing detail link works as-is.

Out of scope: related-products section (requires a new query/rule), new product fields
(`material`, `size`, `pembuatan`) that do not exist in the model, image upload, cart.

## Data model (existing, unchanged)

```ts
// app/types/produk.ts
interface ProdukJenis {
  id: string
  title: string
  colors: { name: string; hex: string; imageUrl: string }[]
}

interface Produk {
  id: string
  name: string
  categoryId: string
  categoryName: string
  price: number
  description: string
  jenis: ProdukJenis[]
  stock: number
  createdAt: number
  updatedAt: number
}
```

## Design

### 1. `useProduk`: add `subscribeOne`

New method alongside the existing `subscribe`. Reads a single document via realtime
`onSnapshot(doc(...))`.

```ts
const subscribeOne = (
  id: string,
  onData: (item: Produk | null) => void,
  onError: (err: Error) => void,
) =>
  onSnapshot(doc(fs, 'produk', id),
    (snap) => onData(snap.exists() ? ({ id: snap.id, ...snap.data() } as Produk) : null),
    onError,
  )
```

- Returns the unsubscribe function (consistent with `subscribe`).
- Emits `null` when the document does not exist (drives the "not found" state).
- Added to the returned object: `{ subscribe, subscribeOne, add, update, remove }`.

Why not reuse `subscribe()` + `.find(id)`: that downloads the whole collection to view one item.
Why not `getDoc()` one-shot: not realtime, and we already subscribe everywhere else — consistency.

### 2. `[id].vue`: real data + gallery

Remove all dummy content: the `products` array, `material`, `size`, `pattern`, the SVG pattern
fallback as the *primary* image, and the related-products section.

State:

```ts
const route = useRoute()
const id = computed(() => String(route.params.id))
const produkService = useProduk()

const product = ref<Produk | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const selectedImage = ref<string>('')
```

Lifecycle:

```ts
onMounted(() => {
  const unsub = produkService.subscribeOne(
    id.value,
    (item) => {
      product.value = item
      // First valid imageUrl across jenis/colors; '' if none
      selectedImage.value = item?.jenis?.flatMap(j => j.colors).find(c => c.imageUrl)?.imageUrl ?? ''
      loading.value = false
    },
    (err) => { error.value = 'Gagal memuat produk.'; loading.value = false },
  )
  onUnmounted(unsub)
})
```

`useHead` title/description become reactive on `product.value`.

### 3. Gallery UI — "galeri + filter jenis"

Layout keeps the existing two-column grid shell (`lg:grid-cols-[1.1fr_.9fr]`).

Left column (gallery):

- Large image showing `selectedImage`, or SVG pattern fallback (uses first color `hex`) when no
  image is selected/available.
- Thumbnails grouped by `jenis.title`. Each thumbnail represents a color that has an `imageUrl`.
  Clicking sets `selectedImage` to that color's `imageUrl`.
- Each thumbnail is labeled with its `color.name` and a `hex` swatch, so the variant/color identity
  is visible alongside the photo.

```html
<!-- pseudo -->
<div v-for="jenis in product.jenis" :key="jenis.id">
  <h4>{{ jenis.title }}</h4>
  <div class="flex gap-3">
    <button v-for="color in jenis.colors.filter(c => c.imageUrl)"
            @click="selectedImage = color.imageUrl">
      <img :src="color.imageUrl" :alt="color.name" />
      <span :style="{ backgroundColor: color.hex }" /> {{ color.name }}
    </button>
  </div>
</div>
```

Colors without `imageUrl`: still rendered as a name + hex swatch (non-interactive), so the user
sees that color exists even if no photo is attached.

Right column (details): real fields only.

- Category (`product.categoryName`).
- Variant count (`product.jenis?.length`).
- Stock (`stock > 0 ? 'Tersedia' : 'Habis'`).
- Description.
- Price.
- WhatsApp CTA + "Lihat Semua Produk" link (unchanged).
- Removed: `material`, `size`, `pembuatan`, `pemesanan` — not in the data model.

### 4. Page states

- `loading` — "Memuat produk..." centered.
- `error` — error message + back link.
- `!product` — "Produk tidak ditemukan." + back link (existing fallback section, reused).
- `product` — full layout.

### 5. Verification

- Project type-check / build (`nuxt typecheck` / `vue-tsc`, or `npm run build`) must pass.
- One manual check: open `/products/<existing-id>` in dev, confirm gallery swaps the large image on
  thumbnail click, fallback shows when no `imageUrl`, and a missing id shows "tidak ditemukan".

## Non-goals / deferred

- Related products: needs a query/rule not yet defined. Add when a recommendation source exists.
- New detail fields (`material`, `size`): add to the `Produk` model and admin form first.
- Cart / order flow: out of scope.
