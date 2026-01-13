<script lang="ts">
  let { size = 20, color = "currentColor" }: { size?: number; color?: string } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M9 5v14" />
  <path d="M12 5v14" />
  <path d="M9 5h4.5a3 3 0 0 1 0 6H9" />
  <path d="M9 11h5a3.5 3.5 0 0 1 0 7H9" />
  <path d="M9 8h6" />
  <path d="M9 16h6" />
</svg>