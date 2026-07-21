<script>
  export let activeTab;

  function resetData() {
    if (confirm('Are you sure you want to reset all data? This will restore mock players and remove custom tournaments.')) {
      localStorage.removeItem('chess_players');
      localStorage.removeItem('chess_tournaments');
      window.location.reload();
    }
  }
</script>

<header class="navbar-header">
  <div class="nav-brand">
    <span class="brand-icon">♟️</span>
    <span class="brand-text">ChessTourney</span>
  </div>

  <nav class="nav-links">
    <button 
      class="nav-tab" 
      class:active={activeTab === 'dashboard'} 
      on:click={() => activeTab = 'dashboard'}
    >
      Dashboard
    </button>
    <button 
      class="nav-tab" 
      class:active={activeTab === 'players'} 
      on:click={() => activeTab = 'players'}
    >
      Players
    </button>
    <button 
      class="nav-tab" 
      class:active={activeTab === 'tournaments'} 
      on:click={() => activeTab = 'tournaments'}
    >
      Tournaments
    </button>
  </nav>

  <button class="btn btn-secondary btn-sm reset-btn" on:click={resetData}>
    🔄 Reset Data
  </button>
</header>

<style>
  .navbar-header {
    background-color: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .nav-brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .brand-icon {
    font-size: 1.8rem;
    line-height: 1;
    filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.3));
  }

  .brand-text {
    font-size: 1.25rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    background: linear-gradient(135deg, #fff, var(--primary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .nav-links {
    display: flex;
    gap: 0.5rem;
  }

  .nav-tab {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 0.95rem;
    font-weight: 600;
    padding: 0.6rem 1.2rem;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .nav-tab:hover {
    color: var(--text-primary);
    background-color: rgba(255, 255, 255, 0.03);
  }

  .nav-tab.active {
    color: white;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2);
  }

  .reset-btn {
    border-color: rgba(239, 68, 68, 0.2) !important;
    color: rgba(252, 165, 165, 0.8) !important;
    background: rgba(239, 68, 68, 0.03) !important;
  }

  .reset-btn:hover {
    background: var(--error-glow) !important;
    border-color: rgba(239, 68, 68, 0.4) !important;
    color: #fca5a5 !important;
  }

  @media (max-width: 640px) {
    .navbar-header {
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
    }

    .reset-btn {
      width: 100%;
    }
  }
</style>
