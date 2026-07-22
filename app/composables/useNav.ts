export const useNav = () => {
  const isScrolled = ref(false)
  const isOpen = ref(false)

  onMounted(() => {
    const onScroll = () => { isScrolled.value = window.scrollY > 10 }
    window.addEventListener('scroll', onScroll, { passive: true })
    onUnmounted(() => window.removeEventListener('scroll', onScroll))
  })

  return { isScrolled, isOpen }
}