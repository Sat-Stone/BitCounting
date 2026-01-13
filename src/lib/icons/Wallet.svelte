<script lang="ts">
  let { size = 20, color = "currentColor" }: { size?: number; color?: string } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2" y="6" width="20" height="14" rx="2" />
  <path d="M2 10h20" />
  <circle cx="16" cy="14" r="1.5" fill={color} stroke="none" />
</svg>