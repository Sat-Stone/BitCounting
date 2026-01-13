<script lang="ts">
  import type { Snippet } from 'svelte';
  
  interface Props {
    title: string;
    open: boolean;
    onclose: () => void;
    children: Snippet;
  }
  
  let { title, open, onclose, children }: Props = $props();
  
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onclose();
    }
  }
  
  function handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onclose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div 
    class="modal-overlay" 
    onclick={handleOverlayClick}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2 id="modal-title">{title}</h2>
        <button class="close-btn" onclick={onclose} aria-label="Close modal">×</button>
      </div>
      <div class="modal-content">
        {@render children()}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 1rem;
  }
  
  .modal {
    background: var(--card-bg, #111);
    border: 1px solid var(--border-primary, #1a1a1a);
    border-radius: 12px;
    padding: 1.5rem;
    min-width: 400px;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
  }
  
  .modal-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary, #fff);
  }
  
  .close-btn {
    background: none;
    border: none;
    color: var(--text-muted, #666);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.15s;
  }
  
  .close-btn:hover {
    color: var(--text-primary, #e0e0e0);
    background: var(--bg-tertiary, #1a1a1a);
  }
  
  .modal-content {
    color: var(--text-primary, #e0e0e0);
  }
  
  @media (max-width: 480px) {
    .modal {
      min-width: 100%;
      margin: 0.5rem;
      padding: 1rem;
    }
  }
</style>