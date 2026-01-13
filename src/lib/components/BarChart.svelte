<script lang="ts">
  let { 
    data, 
    height = 200 
  }: { 
    data: { label: string; value: number; color?: string }[];
    height?: number;
  } = $props();

  const maxValue = $derived(Math.max(...data.map(d => d.value), 1));
  const barWidth = $derived(data.length > 0 ? Math.min(40, (100 / data.length) - 2) : 40);
</script>

<div class="chart" style="height: {height}px">
  {#if data.length === 0}
    <div class="empty">No data</div>
  {:else}
    <div class="bars">
      {#each data as item, i}
        <div class="bar-container" style="width: {barWidth}%">
          <div class="bar-wrapper">
            <div 
              class="bar" 
              style="height: {(item.value / maxValue) * 100}%; background: {item.color || '#f7931a'}"
            ></div>
          </div>
          <span class="bar-label">{item.label}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .chart {
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #444;
    font-size: 0.875rem;
  }

  .bars {
    flex: 1;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 4px;
    padding-bottom: 1.5rem;
  }

  .bar-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
  }

  .bar-wrapper {
    flex: 1;
    width: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  .bar {
    width: 80%;
    border-radius: 4px 4px 0 0;
    min-height: 4px;
    transition: height 0.3s ease;
  }

  .bar-label {
    font-size: 0.6875rem;
    color: #666;
    margin-top: 0.5rem;
    text-align: center;
    white-space: nowrap;
  }
</style>