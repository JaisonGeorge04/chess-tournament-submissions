<script>
  import { players, tournaments } from './store.js';

  export let activeTab = 'players';
  export let selectTournamentId = null;

  $: totalPlayers = $players.length;
  $: totalTournaments = $tournaments.length;

  $: matchesPlayed = $tournaments.reduce((acc, t) => {
    let count = 0;
    if (t.rounds) {
      t.rounds.forEach(round => {
        round.forEach(match => {
          if (match.status === 'completed') count++;
        });
      });
    }
    return acc + count;
  }, 0);

  $: topPlayer = [...$players].sort((a, b) => b.rating - a.rating)[0] || null;
  $: recentTournaments = [...$tournaments]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);
  $: topRatedPlayers = [...$players]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  function navigateToTournament(id) {
    selectTournamentId = id;
    activeTab = 'tournaments';
  }
</script>

<div class="dashboard-container">
  <!-- Stats Cards Grid -->
  <div class="grid-cols-4 gap-md stats-grid">
    <div class="card stat-card">
      <div class="stat-icon players-icon">👥</div>
      <div class="stat-content">
        <span class="stat-label">Total Players</span>
        <span class="stat-value">{totalPlayers}</span>
      </div>
    </div>

    <div class="card stat-card">
      <div class="stat-icon tournaments-icon">🏆</div>
      <div class="stat-content">
        <span class="stat-label">Tournaments</span>
        <span class="stat-value">{totalTournaments}</span>
      </div>
    </div>

    <div class="card stat-card">
      <div class="stat-icon matches-icon">⚔️</div>
      <div class="stat-content">
        <span class="stat-label">Matches Simulated</span>
        <span class="stat-value">{matchesPlayed}</span>
      </div>
    </div>

    <div class="card stat-card">
      <div class="stat-icon top-icon">👑</div>
      <div class="stat-content">
        <span class="stat-label">Top Rated Player</span>
        <span class="stat-value text-truncate" title={topPlayer ? topPlayer.name : 'N/A'}>
          {topPlayer ? topPlayer.name : 'None'}
        </span>
        {#if topPlayer}
          <span class="stat-sub">Rating: {topPlayer.rating}</span>
        {/if}
      </div>
    </div>
  </div>

  <div class="grid-cols-2 gap-lg main-dashboard-grid">
    <!-- Recent Tournaments Card -->
    <div class="card list-section">
      <div class="flex-row section-header">
        <h2>Recent Tournaments</h2>
        <button class="btn btn-secondary btn-sm" on:click={() => activeTab = 'tournaments'}>View All</button>
      </div>

      {#if recentTournaments.length === 0}
        <div class="empty-state">
          <p>No tournaments created yet.</p>
          <button class="btn btn-primary btn-sm" style="margin-top: 1rem;" on:click={() => activeTab = 'tournaments'}>
            Create One
          </button>
        </div>
      {:else}
        <div class="recent-list">
          {#each recentTournaments as tournament}
            <div class="recent-item" on:click={() => navigateToTournament(tournament.id)}>
              <div class="recent-info">
                <h3>{tournament.name}</h3>
                <span class="recent-meta">
                  {tournament.playerIds.length} players registered
                </span>
              </div>
              <div class="recent-status">
                {#if tournament.status === 'registration'}
                  <span class="badge badge-primary">Registering</span>
                {:else if tournament.status === 'active'}
                  <span class="badge badge-warning">In Progress</span>
                {:else}
                  <span class="badge badge-success">Completed</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Leaderboard Card -->
    <div class="card list-section">
      <div class="flex-row section-header">
        <h2>Top Rated Players</h2>
        <button class="btn btn-secondary btn-sm" on:click={() => activeTab = 'players'}>View All</button>
      </div>

      {#if topRatedPlayers.length === 0}
        <div class="empty-state">
          <p>No players available.</p>
          <button class="btn btn-primary btn-sm" style="margin-top: 1rem;" on:click={() => activeTab = 'players'}>
            Add Player
          </button>
        </div>
      {:else}
        <div class="leaderboard-list">
          {#each topRatedPlayers as player, index}
            <div class="leaderboard-item">
              <div class="rank-badge rank-{index + 1}">
                {index + 1}
              </div>
              <div class="player-info">
                <h3>{player.name}</h3>
                <span class="player-country">{player.country}</span>
              </div>
              <div class="player-rating">
                <span class="rating-value">{player.rating}</span>
                <span class="rating-label">Rating</span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .dashboard-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 1.5rem;
    position: relative;
    overflow: hidden;
  }

  .stat-card::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 60px;
    height: 60px;
    background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);
    border-radius: 50%;
  }

  .stat-icon {
    font-size: 2.25rem;
    width: 3.5rem;
    height: 3.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(255,255,255,0.05);
  }

  .stat-content {
    display: flex;
    flex-direction: column;
    min-width: 0; /* allows text truncation to work */
  }

  .stat-label {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .stat-sub {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .text-truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .section-header {
    margin-bottom: 1.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    padding-bottom: 0.75rem;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--text-muted);
  }

  .recent-list, .leaderboard-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .recent-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.3);
    border: 1px solid rgba(255,255,255,0.02);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .recent-item:hover {
    background: rgba(99, 102, 241, 0.08);
    border-color: rgba(99, 102, 241, 0.2);
    transform: translateX(4px);
  }

  .recent-info h3 {
    font-size: 1.05rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .recent-meta {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .btn-sm {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }

  /* Leaderboard Styling */
  .leaderboard-item {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 0.85rem 1rem;
    background: rgba(15, 23, 42, 0.3);
    border-radius: 12px;
  }

  .rank-badge {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 1.1rem;
    border: 1px solid rgba(255,255,255,0.1);
  }

  .rank-1 {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    box-shadow: 0 0 10px rgba(245, 158, 11, 0.3);
  }

  .rank-2 {
    background: linear-gradient(135deg, #94a3b8, #64748b);
    color: white;
    box-shadow: 0 0 10px rgba(148, 163, 184, 0.3);
  }

  .rank-3 {
    background: linear-gradient(135deg, #b45309, #78350f);
    color: white;
    box-shadow: 0 0 10px rgba(180, 83, 9, 0.3);
  }

  .player-info h3 {
    font-size: 1.05rem;
    font-weight: 600;
  }

  .player-country {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .player-rating {
    margin-left: auto;
    text-align: right;
    display: flex;
    flex-direction: column;
  }

  .rating-value {
    font-weight: 700;
    color: var(--primary);
    font-size: 1.1rem;
  }

  .rating-label {
    font-size: 0.7rem;
    color: var(--text-muted);
    text-transform: uppercase;
  }
</style>
