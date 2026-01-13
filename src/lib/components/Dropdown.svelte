<script lang="ts">
  import { tick } from "svelte";

  interface Option {
    value: number | null;
    label: string;
    type?: string;
  }

  let { 
    options, 
    value = $bindable(), 
    placeholder = "Select..." 
  }: { 
    options: Option[]; 
    value: number | null; 
    placeholder?: string;
  } = $props();

  let open = $state(false);
  let dropdownRef: HTMLDivElement;

  function getSelectedLabel(): string {
    const selected = options.find(o => o.value === value);
    return selected?.label || placeholder;
  }

  function select(option: Option) {
    value = option.value;
    open = false;
  }

  function handleClickOutside(event: MouseEvent) {
    if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
      open = false;
    }
  }

  $effect(() => {
    if (open) {
      document.addEventListener("click", handleClickOutside);
    } else {
      document.removeEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  });
</script>

<div class="dropdown" bind:this={dropdownRef}>
  <button class="dropdown-trigger" onclick={() => open = !open}>
    <span class="dropdown-value">{getSelectedLabel()}</span>
    <svg class="dropdown-arrow" class:open width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  </button>
  
  {#if open}
    <div class="dropdown-menu">
      {#each options as option}
        <button 
          class="dropdown-item" 
          class:selected={option.value === value}
          onclick={() => select(option)}
        >
          {#if option.type === "personal"}
            <span class="item-dot personal"></span>
          {:else if option.type === "family"}
            <span class="item-dot family"></span>
          {:else if option.type === "business"}
            <span class="item-dot business"></span>
          {:else}
            <span class="item-dot all"></span>
          {/if}
          {option.label}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .dropdown {
    position: relative;
  }

  .dropdown-trigger {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 1rem;
    background: #141414;
    border: 1px solid #252525;
    border-radius: 10px;
    color: #fff;
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    min-width: 180px;
  }

  .dropdown-trigger:hover {
    border-color: #333;
    background: #1a1a1a;
  }

  .dropdown-value {
    flex: 1;
    text-align: left;
  }

  .dropdown-arrow {
    color: #666;
    transition: transform 0.2s;
  }

  .dropdown-arrow.open {
    transform: rotate(180deg);
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    background: #141414;
    border: 1px solid #252525;
    border-radius: 10px;
    padding: 0.375rem;
    z-index: 100;
    animation: dropdownIn 0.15s ease;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  @keyframes dropdownIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    width: 100%;
    padding: 0.625rem 0.75rem;
    background: none;
    border: none;
    border-radius: 6px;
    color: #aaa;
    font-size: 0.875rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.1s;
  }

  .dropdown-item:hover {
    background: #1a1a1a;
    color: #fff;
  }

  .dropdown-item.selected {
    background: rgba(247, 147, 26, 0.1);
    color: #f7931a;
  }

  .item-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .item-dot.all {
    background: linear-gradient(135deg, #f7931a 50%, #4ade80 50%);
  }

  .item-dot.personal {
    background: #f7931a;
  }

  .item-dot.family {
    background: #4ade80;
  }

  .item-dot.business {
    background: #60a5fa;
  }
</style>