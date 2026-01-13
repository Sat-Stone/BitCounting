<script lang="ts">
  import X from "$lib/icons/X.svelte";

  let { 
    open = false, 
    title = "Confirm",
    message = "Are you sure?",
    confirmText = "Confirm",
    danger = false,
    onconfirm,
    onclose 
  }: { 
    open: boolean; 
    title?: string;
    message: string;
    confirmText?: string;
    danger?: boolean;
    onconfirm: () => void;
    onclose: () => void;
  } = $props();
</script>

{#if open}
  <div class="overlay" onclick={onclose}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2 class:danger>{title}</h2>
        <button class="close-btn" onclick={onclose}>
          <X size={20} />
        </button>
      </div>
      <div class="modal-body">
        <p>{message}</p>
        <div class="form-actions">
          <button class="btn secondary" onclick={onclose}>Cancel</button>
          <button class="btn" class:danger onclick={onconfirm}>{confirmText}</button>
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
    max-width: 400px;
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
    color: #fff;
  }

  .modal-header h2.danger {
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

  .modal-body p {
    margin: 0 0 1.5rem;
    color: #aaa;
    line-height: 1.5;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  .btn {
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

  .btn.danger:hover {
    background: #ef4444;
  }
</style>