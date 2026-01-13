<script lang="ts">
  interface DataPoint {
    label: string;
    value: number;
  }

  let { data = [], height = 200 }: { data: DataPoint[]; height?: number } = $props();

  const padding = { top: 20, right: 20, bottom: 30, left: 60 };

  let width = $state(400);

  let chartWidth = $derived(width - padding.left - padding.right);
  let chartHeight = $derived(height - padding.top - padding.bottom);

  let minValue = $derived(Math.min(...data.map(d => d.value), 0));
  let maxValue = $derived(Math.max(...data.map(d => d.value)));
  let valueRange = $derived(maxValue - minValue || 1);

  function getX(index: number): number {
    if (data.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (data.length - 1)) * chartWidth;
  }

  function getY(value: number): number {
    return padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
  }

  let pathD = $derived.by(() => {
    if (data.length === 0) return "";
    return data.map((d, i) => {
      const x = getX(i);
      const y = getY(d.value);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  });

  let areaD = $derived.by(() => {
    if (data.length === 0) return "";
    const baseline = getY(minValue);
    const linePath = data.map((d, i) => {
      const x = getX(i);
      const y = getY(d.value);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
    return `${linePath} L ${getX(data.length - 1)} ${baseline} L ${getX(0)} ${baseline} Z`;
  });

  function formatValue(val: number): string {
    if (Math.abs(val) >= 1_000_000) return (val / 1_000_000).toFixed(1) + "M";
    if (Math.abs(val) >= 1_000) return (val / 1_000).toFixed(0) + "k";
    return val.toLocaleString();
  }

  // Y-axis ticks
  let yTicks = $derived.by(() => {
    const ticks = [];
    const step = valueRange / 4;
    for (let i = 0; i <= 4; i++) {
      ticks.push(minValue + step * i);
    }
    return ticks;
  });
</script>

<div class="line-chart" bind:clientWidth={width}>
  <svg {width} {height}>
    <defs>
      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#f7931a;stop-opacity:0.3" />
        <stop offset="100%" style="stop-color:#f7931a;stop-opacity:0.05" />
      </linearGradient>
    </defs>

    <!-- Y-axis grid lines and labels -->
    {#each yTicks as tick}
      <line
        x1={padding.left}
        y1={getY(tick)}
        x2={width - padding.right}
        y2={getY(tick)}
        stroke="#1a1a1a"
        stroke-dasharray="2,2"
      />
      <text
        x={padding.left - 8}
        y={getY(tick)}
        text-anchor="end"
        dominant-baseline="middle"
        fill="#555"
        font-size="10"
      >
        {formatValue(tick)}
      </text>
    {/each}

    <!-- Area fill -->
    {#if data.length > 0}
      <path d={areaD} fill="url(#areaGradient)" />
    {/if}

    <!-- Line -->
    {#if data.length > 0}
      <path d={pathD} fill="none" stroke="#f7931a" stroke-width="2" />
    {/if}

    <!-- Data points -->
    {#each data as point, i}
      <circle
        cx={getX(i)}
        cy={getY(point.value)}
        r="3"
        fill="#f7931a"
      />
    {/each}

    <!-- X-axis labels (show every nth label to avoid crowding) -->
    {#each data as point, i}
      {#if i % Math.ceil(data.length / 6) === 0 || i === data.length - 1}
        <text
          x={getX(i)}
          y={height - 8}
          text-anchor="middle"
          fill="#555"
          font-size="10"
        >
          {point.label}
        </text>
      {/if}
    {/each}
  </svg>
</div>

<style>
  .line-chart {
    width: 100%;
  }

  svg {
    display: block;
  }
</style>