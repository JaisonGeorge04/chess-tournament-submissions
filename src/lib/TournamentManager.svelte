<script>
  import { tournaments, tournamentActions, players } from './store.js';

  export let activeTab = 'tournaments';
  export let selectTournamentId = null;

  let newTournamentName = '';
  let showCreateModal = false;
  let showRegisterModal = false;
  let activeTournamentForRegister = null;

  // Error state
  let errorMsg = '';

  function openCreateModal() {
    newTournamentName = '';
    errorMsg = '';
    showCreateModal = true;
  }

  function handleCreateTournament() {
    if (!newTournamentName.trim()) {
      errorMsg = 'Tournament name is required';
      return;
    }
    tournamentActions.create(newTournamentName);
    showCreateModal = false;
  }

  function handleDeleteTournament(id, name) {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      tournamentActions.delete(id);
      if (selectTournamentId === id) {
        selectTournamentId = null;
      }
    }
  }

  function openRegisterModal(tournament) {
    activeTournamentForRegister = tournament;
    showRegisterModal = true;
  }

  function toggleRegistration(playerId) {
    if (!activeTournamentForRegister) return;
    
    const isRegistered = activeTournamentForRegister.playerIds.includes(playerId);
    if (isRegistered) {
      tournamentActions.unregisterPlayer(activeTournamentForRegister.id, playerId);
      // Update local copy of tournament references so UI renders immediately
      activeTournamentForRegister.playerIds = activeTournamentForRegister.playerIds.filter(id => id !== playerId);
    } else {
      tournamentActions.registerPlayer(activeTournamentForRegister.id, playerId);
      // Update local copy
      activeTournamentForRegister.playerIds = [...activeTournamentForRegister.playerIds, playerId];
    }
    // Update reference to trigger reactivity
    activeTournamentForRegister = { ...activeTournamentForRegister };
  }

  function handleStartTournament(tournament) {
    if (tournament.playerIds.length < 2) {
      alert('You need at least 2 players to start a tournament.');
      return;
    }
    
    if (confirm(`Start the tournament with ${tournament.playerIds.length} players? This will lock registrations and generate the first round matchups.`)) {
      tournamentActions.startTournament(tournament.id, $players);
      // Open the details page immediately
      selectTournamentId = tournament.id;
    }
  }

  function viewTournamentDetails(id) {
    selectTournamentId = id;
  }

  $: getPlayerName = (id) => {
    const p = $players.find(x => x.id === id);
    return p ? p.name : 'Unknown';
  };
</script>

<div class="tournament-manager">
  <!-- Toolbar Card -->
  <div class="card toolbar-card">
    <div class="toolbar-content">
      <h2>Tournaments list ({$tournaments.length})</h2>
      <button class="btn btn-primary" on:click={openCreateModal} style="margin-left: auto;">
        <span>+</span> Create Tournament
      </button>
    </div>
  </div>

  <!-- Tournaments Grid -->
  {#if $tournaments.length === 0}
    <div class="card empty-card">
      <div class="empty-state">
        <p>No tournaments created yet. Click the button above to create one!</p>
      </div>
    </div>
  {:else}
    <div class="grid-cols-3 gap-md">
      {#each $tournaments as tournament}
        <div class="card tournament-card">
          <div class="flex-row card-header">
            <h3>{tournament.name}</h3>
            <div>
              {#if tournament.status === 'registration'}
                <span class="badge badge-primary">Registering</span>
              {:else if tournament.status === 'active'}
                <span class="badge badge-warning">Active</span>
              {:else}
                <span class="badge badge-success">Completed</span>
              {/if}
            </div>
          </div>

          <div class="tournament-body">
            <div class="meta-row">
              <span class="meta-label">Participants:</span>
              <span class="meta-val">{tournament.playerIds.length} players</span>
            </div>
            
            {#if tournament.status === 'registration'}
              <div class="player-pill-container">
                {#if tournament.playerIds.length === 0}
                  <span class="placeholder-text">No players registered</span>
                {:else}
                  {#each tournament.playerIds.slice(0, 5) as pId}
                    <span class="player-pill">{getPlayerName(pId)}</span>
                  {/each}
                  {#if tournament.playerIds.length > 5}
                    <span class="player-pill-more">+{tournament.playerIds.length - 5} more</span>
                  {/if}
                {/if}
              </div>
            {:else if tournament.status === 'active'}
              <div class="round-status">
                <span>Current round: </span>
                <span class="badge badge-warning">Round {tournament.currentRoundIndex + 1}</span>
              </div>
            {:else if tournament.status === 'completed' && tournament.standings}
              <div class="podium-overview">
                <div class="winner-row">👑 1st: {getPlayerName(tournament.standings.first)}</div>
                {#if tournament.standings.second}
                  <div class="winner-row">🥈 2nd: {getPlayerName(tournament.standings.second)}</div>
                {/if}
                {#if tournament.standings.third}
                  <div class="winner-row">🥉 3rd: {getPlayerName(tournament.standings.third)}</div>
                {/if}
              </div>
            {/if}
          </div>

          <div class="flex-row tournament-actions">
            {#if tournament.status === 'registration'}
              <button class="btn btn-secondary btn-sm" on:click={() => openRegisterModal(tournament)}>
                Manage Players
              </button>
              <button 
                class="btn btn-success btn-sm"
                class:btn-disabled={tournament.playerIds.length < 2}
                on:click={() => handleStartTournament(tournament)}
              >
                Start
              </button>
            {:else}
              <button class="btn btn-primary btn-sm" on:click={() => viewTournamentDetails(tournament.id)}>
                View Tournament
              </button>
            {/if}
            
            <button class="btn btn-danger btn-sm icon-btn" on:click={() => handleDeleteTournament(tournament.id, tournament.name)}>
              🗑️
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Create Modal -->
  {#if showCreateModal}
    <div class="modal-overlay" on:click|self={() => showCreateModal = false}>
      <div class="modal-content">
        <h2>Create Tournament</h2>
        <form on:submit|preventDefault={handleCreateTournament} class="create-form">
          <div class="form-group">
            <label for="t-name">Tournament Name</label>
            <input 
              type="text" 
              id="t-name" 
              bind:value={newTournamentName}
              placeholder="e.g. Summer Classic 2026"
            />
            {#if errorMsg}
              <span class="error-text">{errorMsg}</span>
            {/if}
          </div>
          
          <div class="flex-row modal-actions" style="margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" on:click={() => showCreateModal = false}>
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              Create Tournament
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Register Modal -->
  {#if showRegisterModal && activeTournamentForRegister}
    <div class="modal-overlay" on:click|self={() => showRegisterModal = false}>
      <div class="modal-content register-modal-content">
        <h2>Manage Tournament Registration</h2>
        <p class="modal-sub">Register players for <strong>{activeTournamentForRegister.name}</strong></p>

        <div class="player-selection-list">
          {#if $players.length === 0}
            <div class="empty-state">
              <p>No players exist. Create players in the "Players" tab first.</p>
            </div>
          {:else}
            {#each $players as player}
              {@const isRegistered = activeTournamentForRegister.playerIds.includes(player.id)}
              <div class="player-select-item" class:selected={isRegistered} on:click={() => toggleRegistration(player.id)}>
                <div class="player-select-info">
                  <span class="select-name">{player.name}</span>
                  <span class="select-rating">Rating: {player.rating}</span>
                </div>
                <div class="checkbox-container">
                  {#if isRegistered}
                    <span class="check-icon">✓</span>
                  {:else}
                    <span class="plus-icon">+</span>
                  {/if}
                </div>
              </div>
            {/each}
          {/if}
        </div>

        <div class="flex-row modal-actions" style="margin-top: 1.5rem;">
          <span class="registration-counter">{activeTournamentForRegister.playerIds.length} players registered</span>
          <button type="button" class="btn btn-primary" on:click={() => showRegisterModal = false}>
            Done
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .tournament-manager {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .toolbar-content {
    display: flex;
    align-items: center;
    width: 100%;
  }

  .tournament-card {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 250px;
  }

  .card-header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding-bottom: 0.75rem;
    margin-bottom: 1rem;
  }

  .tournament-body {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .meta-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    color: var(--text-secondary);
  }

  .meta-val {
    font-weight: 600;
    color: var(--text-primary);
  }

  .player-pill-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 0.5rem;
  }

  .player-pill {
    background-color: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.25);
    color: #a5b4fc;
    font-size: 0.75rem;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
  }

  .player-pill-more {
    font-size: 0.75rem;
    color: var(--text-muted);
    padding: 0.2rem 0.5rem;
  }

  .placeholder-text {
    font-size: 0.85rem;
    color: var(--text-muted);
    font-style: italic;
  }

  .round-status {
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .podium-overview {
    background: rgba(15, 23, 42, 0.3);
    padding: 0.75rem;
    border-radius: 8px;
    font-size: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .winner-row {
    font-weight: 500;
  }

  .tournament-actions {
    margin-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding-top: 1rem;
    gap: 0.5rem;
  }

  .icon-btn {
    padding: 0.5rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .create-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .error-text {
    font-size: 0.75rem;
    color: var(--error);
    margin-top: 0.25rem;
  }

  .empty-card {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
  }

  .empty-state {
    text-align: center;
    color: var(--text-muted);
  }

  .register-modal-content {
    max-width: 600px !important;
  }

  .modal-sub {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-top: -0.5rem;
    margin-bottom: 1.5rem;
  }

  .player-selection-list {
    max-height: 350px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-right: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.15);
  }

  .player-select-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: rgba(30, 41, 59, 0.4);
    border: 1px solid rgba(255,255,255,0.02);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .player-select-item:hover {
    background: rgba(30, 41, 59, 0.7);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .player-select-item.selected {
    background: rgba(99, 102, 241, 0.1);
    border-color: rgba(99, 102, 241, 0.3);
  }

  .select-name {
    display: block;
    font-weight: 500;
  }

  .select-rating {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .checkbox-container {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-color);
    font-weight: bold;
    font-size: 0.9rem;
    transition: all 0.2s ease;
  }

  .selected .checkbox-container {
    background-color: var(--success);
    border-color: var(--success);
    color: white;
  }

  .player-select-item:not(.selected):hover .checkbox-container {
    background-color: var(--primary);
    border-color: var(--primary);
    color: white;
  }

  .registration-counter {
    font-size: 0.85rem;
    color: var(--text-secondary);
    font-weight: 500;
  }
</style>
