<script lang="ts">
  let { size = 20, color = "currentColor" }: { size?: number; color?: string } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 12a9 9 0 1 1-3-6.7" />
  <path d="M21 4v5h-5" />
</svg>