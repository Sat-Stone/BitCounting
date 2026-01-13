<script lang="ts">
  let { 
    data,
    size = 180
  }: { 
    data: { label: string; value: number; color: string }[];
    size?: number;
  } = $props();

  const total = $derived(data.reduce((sum, d) => sum + d.value, 0));
  
  const segments = $derived.by(() => {
    let currentAngle = 0;
    return data.map(item => {
      const angle = total > 0 ? (item.value / total) * 360 : 0;
      const segment = {
        ...item,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        percentage: total > 0 ? (item.value / total) * 100 : 0
      };
      currentAngle += angle;
      return segment;
    });
  });

  function describeArc(startAngle: number, endAngle: number, radius: number): string {
    const start = polarToCartesian(radius, endAngle);
    const end = polarToCartesian(radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", radius, radius,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  }

  function polarToCartesian(radius: number, angle: number) {
    const rad = (angle - 90) * Math.PI / 180;
    return {
      x: radius + (radius * Math.cos(rad)),
      y: radius + (radius * Math.sin(rad))
    };
  }
</script>

<div class="pie-chart">
  {#if data.length === 0 || total === 0}
    <div class="empty" style="width: {size}px; height: {size}px">No data</div>
  {:else}
    <svg width={size} height={size} viewBox="0 0 {size} {size}">
      {#each segments as segment}
        {#if segment.percentage > 0}
          <path
            d={describeArc(segment.startAngle, segment.endAngle, size / 2)}
            fill={segment.color}
          />
        {/if}
      {/each}
      <circle cx={size / 2} cy={size / 2} r={size / 4} fill="#111" />
    </svg>
  {/if}
  
  <div class="legend">
    {#each segments.filter(s => s.percentage > 0) as segment}
      <div class="legend-item">
        <span class="legend-dot" style="background: {segment.color}"></span>
        <span class="legend-label">{segment.label}</span>
        <span class="legend-value">{segment.percentage.toFixed(0)}%</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .pie-chart {
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #444;
    font-size: 0.875rem;
    border: 1px dashed #333;
    border-radius: 50%;
  }

  svg {
    flex-shrink: 0;
  }

  .legend {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
  }

  .legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .legend-label {
    color: #888;
    flex: 1;
  }

  .legend-value {
    color: #e0e0e0;
    font-weight: 500;
  }
</style>