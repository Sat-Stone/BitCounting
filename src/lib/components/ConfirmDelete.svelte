<script lang="ts">
  import X from "$lib/icons/X.svelte";

  let { 
    open = false, 
    name,
    onconfirm,
    onclose 
  }: { 
    open: boolean; 
    name: string;
    onconfirm: () => void;
    onclose: () => void;
  } = $props();

  let inputValue = $state("");

  const expectedValue = $derived(`delete ${name}`);
  const isValid = $derived(inputValue.toLowerCase() === expectedValue.toLowerCase());

  function handleConfirm() {
    if (isValid) {
      inputValue = "";
      onconfirm();
    }
  }

  function handleClose() {
    inputValue = "";
    onclose();
  }
</script>

{#if open}
  <div class="overlay" onclick={handleClose}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2>Delete Wallet</h2>
        <button class="close-btn" onclick={handleClose}>
          <X size={20} />
        </button>
      </div>
      <div class="modal-body">
        <p class="warning">This action cannot be undone. All transaction data for this wallet will be permanently deleted.</p>
        
        <div class="confirm-input">
          <label>Type <span class="confirm-text">delete {name}</span> to confirm:</label>
          <input 
            type="text" 
            bind:value={inputValue} 
            placeholder="delete {name}"
            onkeydown={(e) => e.key === "Enter" && handleConfirm()}
          />
        </div>

        <div class="form-actions">
          <button class="btn secondary" onclick={handleClose}>Cancel</button>
          <button class="btn danger" onclick={handleConfirm} disabled={!isValid}>
            Delete Wallet
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    animation: fadeIn 0.15s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal {
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 12px;
    width: 90%;
    max-width: 420px;
    animation: slideUp 0.2s ease;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #2a2a2a;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #f87171;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: #666;
    cursor: pointer;
    transition: all 0.15s;
  }

  .close-btn:hover {
    background: #252525;
    color: #fff;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .warning {
    margin: 0 0 1.25rem;
    padding: 0.875rem;
    background: rgba(248, 113, 113, 0.1);
    border: 1px solid rgba(248, 113, 113, 0.2);
    border-radius: 8px;
    font-size: 0.875rem;
    color: #f87171;
    line-height: 1.5;
  }

  .confirm-input {
    margin-bottom: 1.5rem;
  }

  .confirm-input label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    color: #888;
  }

  .confirm-text {
    color: #fff;
    font-family: "SF Mono", Monaco, monospace;
    background: #252525;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
  }

  .confirm-input input {
    width: 100%;
    background: #111;
    border: 1px solid #252525;
    border-radius: 8px;
    padding: 0.75rem;
    color: #e0e0e0;
    font-size: 0.9375rem;
    box-sizing: border-box;
  }

  .confirm-input input:focus {
    outline: none;
    border-color: #f87171;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  .btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.125rem;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn.secondary {
    background: #252525;
    color: #e0e0e0;
  }

  .btn.secondary:hover {
    background: #333;
  }

  .btn.danger {
    background: #dc2626;
    color: #fff;
  }

  .btn.danger:hover:not(:disabled) {
    background: #ef4444;
  }

  .btn.danger:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>