<script>
  import Header from './lib/Header.svelte';
  import Dashboard from './lib/Dashboard.svelte';
  import PlayerManager from './lib/PlayerManager.svelte';
  import TournamentManager from './lib/TournamentManager.svelte';
  import TournamentDetails from './lib/TournamentDetails.svelte';

  let activeTab = 'dashboard'; // 'dashboard', 'players', 'tournaments'
  let selectTournamentId = null;

  // Clear tournament selection if we manually switch tabs
  $: {
    if (activeTab !== 'tournaments') {
      selectTournamentId = null;
    }
  }
</script>

<div class="app-wrapper">
  <!-- Nav Header -->
  <Header bind:activeTab />

  <main class="app-container">
    {#if selectTournamentId}
      <TournamentDetails bind:selectTournamentId />
    {:else}
      {#if activeTab === 'dashboard'}
        <Dashboard bind:activeTab bind:selectTournamentId />
      {:else if activeTab === 'players'}
        <PlayerManager />
      {:else if activeTab === 'tournaments'}
        <TournamentManager bind:activeTab bind:selectTournamentId />
      {/if}
    {/if}
  </main>
</div>

<style>
  .app-wrapper {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  main {
    flex-grow: 1;
    animation: fadeIn 0.4s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
