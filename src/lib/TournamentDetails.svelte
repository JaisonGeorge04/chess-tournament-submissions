<script>
  import { tournaments, tournamentActions, players } from './store.js';
  import BracketView from './BracketView.svelte';
  import Podium from './Podium.svelte';

  export let selectTournamentId;

  let activeSubTab = 'matchups'; // 'matchups', 'bracket', 'standings'

  $: tournament = $tournaments.find((t) => t.id === selectTournamentId) || null;

  $: currentRound = tournament && tournament.rounds ? tournament.rounds[tournament.currentRoundIndex] : [];

  $: allCompleted = currentRound && currentRound.length > 0 && currentRound.every((m) => m.status === 'completed');

  $: getPlayer = (id) => {
    if (!id) return { name: 'BYE', rating: '' };
    return $players.find((p) => p.id === id) || { name: 'Deleted Player', rating: '' };
  };

  function simulateMatch(matchId) {
    if (!tournament) return;
    tournamentActions.simulateMatch(tournament.id, tournament.currentRoundIndex, matchId, $players);
  }

  function simulateRound() {
    if (!tournament) return;
    tournamentActions.simulateRound(tournament.id, tournament.currentRoundIndex, $players);
  }

  function advanceRound() {
    if (!tournament) return;
    tournamentActions.advanceRound(tournament.id);
    
    // Automatically switch tabs for a nice UX transition
    const updated = $tournaments.find((t) => t.id === selectTournamentId);
    if (updated.status === 'completed') {
      activeSubTab = 'standings';
    }
  }

  // Calculate tournament wins and matches played for leaderboard
  $: tournamentStats = (() => {
    if (!tournament) return [];
    
    const stats = {};
    tournament.playerIds.forEach(id => {
      stats[id] = { id, wins: 0, matches: 0, status: 'Active' };
    });

    if (tournament.rounds) {
      tournament.rounds.forEach((round, rIdx) => {
        round.forEach((match) => {
          if (match.status === 'completed') {
            const p1 = match.player1Id;
            const p2 = match.player2Id;
            const win = match.winnerId;
            const lose = win === p1 ? p2 : p1;

            if (p1 && stats[p1]) {
              stats[p1].matches++;
              if (win === p1) stats[p1].wins++;
            }
            if (p2 && stats[p2]) {
              stats[p2].matches++;
              if (win === p2) stats[p2].wins++;
            }

            // Record elimination rounds for ranking placement
            if (lose && stats[lose]) {
              stats[lose].status = `Eliminated (Round ${rIdx + 1})`;
            }
          }
        });
      });
    }

    // Set statuses for finalists
    if (tournament.status === 'completed' && tournament.standings) {
      const { first, second, third } = tournament.standings;
      if (first && stats[first]) stats[first].status = 'Champion (1st Place)';
      if (second && stats[second]) stats[second].status = 'Runner-up (2nd Place)';
      if (third && stats[third]) stats[third].status = '3rd Place';
    }

    return Object.values(stats).sort((a, b) => {
      // Sort: Champions first, then runner up, then 3rd, then by round of elimination/wins
      const getRankWeight = (item) => {
        if (item.status.includes('1st')) return 100;
        if (item.status.includes('2nd')) return 90;
        if (item.status.includes('3rd')) return 80;
        if (item.status.includes('Active')) return 70;
        
        // Extract round index from "Eliminated (Round X)"
        const match = item.status.match(/Round (\d+)/);
        if (match) {
          return parseInt(match[1]);
        }
        return 0;
      };

      const wA = getRankWeight(a);
      const wB = getRankWeight(b);
      
      if (wA !== wB) return wB - wA;
      return b.wins - a.wins; // tiebreaker: tournament wins
    });
  })();
</script>

{#if !tournament}
  <div class="card error-card">
    <p>Tournament not found.</p>
    <button class="btn btn-secondary" on:click={() => selectTournamentId = null}>Back to List</button>
  </div>
{:else}
  <div class="tournament-details-page">
    <!-- Header with Back navigation -->
    <div class="card details-header-card">
      <div class="flex-row">
        <button class="btn btn-secondary btn-sm" on:click={() => selectTournamentId = null}>
          ← Back to Tournaments
        </button>
        <span class="created-at">Created: {new Date(tournament.createdAt).toLocaleDateString()}</span>
      </div>

      <div class="flex-row title-row" style="margin-top: 1rem;">
        <div>
          <h1>{tournament.name}</h1>
          <span class="sub-details">{tournament.playerIds.length} players registered • Single Elimination Format</span>
        </div>
        <div>
          {#if tournament.status === 'registration'}
            <span class="badge badge-primary">Registration</span>
          {:else if tournament.status === 'active'}
            <span class="badge badge-warning">Active • Round {tournament.currentRoundIndex + 1}</span>
          {:else}
            <span class="badge badge-success">Completed</span>
          {/if}
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="details-tabs">
      <button 
        class="tab-btn" 
        class:active={activeSubTab === 'matchups'} 
        on:click={() => activeSubTab = 'matchups'}
      >
        ⚔️ Matches & Simulation
      </button>
      <button 
        class="tab-btn" 
        class:active={activeSubTab === 'bracket'} 
        on:click={() => activeSubTab = 'bracket'}
      >
        🌳 Visual Bracket
      </button>
      <button 
        class="tab-btn" 
        class:active={activeSubTab === 'standings'} 
        on:click={() => activeSubTab = 'standings'}
      >
        🏆 Standings & Rankings
      </button>
    </div>

    <!-- Tab Contents -->
    <div class="tab-content-container">
      
      <!-- Tab 1: Matchups & Simulation -->
      {#if activeSubTab === 'matchups'}
        <div class="card matchups-section">
          <div class="flex-row section-toolbar">
            <div>
              <h2>Round {tournament.currentRoundIndex + 1} Matchups</h2>
              <p class="section-desc">Simulate matches randomly (weighted by player Elo rating) or simulate the entire round.</p>
            </div>
            
            {#if tournament.status === 'active'}
              <div class="toolbar-actions">
                {#if !allCompleted}
                  <button class="btn btn-secondary" on:click={simulateRound}>
                    Simulate Remaining Matches
                  </button>
                {:else}
                  <button class="btn btn-success animate-pulse" on:click={advanceRound}>
                    {#if currentRound.length === 2 && currentRound[1].isThirdPlaceMatch}
                      Complete Tournament
                    {:else if currentRound.length === 1}
                      Complete Tournament
                    {:else}
                      Advance to Round {tournament.currentRoundIndex + 2} →
                    {/if}
                  </button>
                {/if}
              </div>
            {/if}
          </div>

          {#if tournament.status === 'completed'}
            <div class="alert-info-box">
              <span class="alert-icon">🎉</span>
              <div>
                <h4>Tournament is Completed!</h4>
                <p>The champions have been crowned. View the full results in the "Standings & Rankings" tab.</p>
              </div>
            </div>
          {/if}

          <div class="matches-list-grid">
            {#each currentRound as match}
              {@const p1 = getPlayer(match.player1Id)}
              {@const p2 = getPlayer(match.player2Id)}
              
              <div class="match-item-card" class:match-completed={match.status === 'completed'}>
                {#if match.isThirdPlaceMatch}
                  <div class="tag third-place-tag">3rd Place Match</div>
                {:else if match.isFinal}
                  <div class="tag final-tag">Final Match</div>
                {/if}

                <div class="match-teams">
                  <!-- Player 1 -->
                  <div class="team-row" class:is-winner={match.status === 'completed' && match.winnerId === match.player1Id}>
                    <span class="team-name">{p1.name}</span>
                    <span class="team-rating">({p1.rating})</span>
                    {#if match.status === 'completed'}
                      <span class="team-score">{match.score1}</span>
                    {/if}
                  </div>

                  <div class="vs-divider">VS</div>

                  <!-- Player 2 -->
                  <div class="team-row" class:is-winner={match.status === 'completed' && match.winnerId === match.player2Id}>
                    {#if match.player2Id === null}
                      <span class="team-name italic text-muted">BYE</span>
                      <span class="team-rating"></span>
                      {#if match.status === 'completed'}
                        <span class="team-score">0</span>
                      {/if}
                    {:else}
                      <span class="team-name">{p2.name}</span>
                      <span class="team-rating">({p2.rating})</span>
                      {#if match.status === 'completed'}
                        <span class="team-score">{match.score2}</span>
                      {/if}
                    {/if}
                  </div>
                </div>

                <div class="match-controls">
                  {#if match.status === 'completed'}
                    <span class="badge badge-success">Completed</span>
                  {:else if match.isBye}
                    <span class="badge badge-primary">BYE (Auto Win)</span>
                  {:else if tournament.status === 'active'}
                    <button class="btn btn-primary btn-sm" on:click={() => simulateMatch(match.id)}>
                      Simulate Game
                    </button>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Tab 2: Bracket View -->
      {#if activeSubTab === 'bracket'}
        <div class="card bracket-card-container">
          <BracketView {tournament} />
        </div>
      {/if}

      <!-- Tab 3: Standings & Rankings -->
      {#if activeSubTab === 'standings'}
        <div class="standings-tab-container">
          
          {#if tournament.status === 'completed' && tournament.standings}
            <Podium standings={tournament.standings} />
          {/if}

          <div class="card standings-table-card" style="margin-top: 1.5rem;">
            <h2>Tournament Standings Leaderboard</h2>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Elo Rating</th>
                    <th>Matches Played</th>
                    <th>Wins In Tournament</th>
                    <th>Status / Result</th>
                  </tr>
                </thead>
                <tbody>
                  {#each tournamentStats as stat, index}
                    {@const p = getPlayer(stat.id)}
                    <tr class:highlight-row={index < 3 && tournament.status === 'completed'}>
                      <td>
                        <span class="rank-pos pos-{index + 1}">
                          {index + 1}
                        </span>
                      </td>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.rating}</td>
                      <td>{stat.matches}</td>
                      <td>{stat.wins}</td>
                      <td>
                        {#if stat.status.includes('Champion')}
                          <span class="badge badge-success">{stat.status}</span>
                        {:else if stat.status.includes('2nd')}
                          <span class="badge badge-primary">{stat.status}</span>
                        {:else if stat.status.includes('3rd')}
                          <span class="badge badge-warning">{stat.status}</span>
                        {:else if stat.status.includes('Active')}
                          <span class="badge badge-warning">{stat.status}</span>
                        {:else}
                          <span class="badge badge-danger">{stat.status}</span>
                        {/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .tournament-details-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .details-header-card {
    padding: 1.5rem 2rem;
  }

  .created-at {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .title-row {
    align-items: flex-start;
  }

  .sub-details {
    font-size: 0.95rem;
    color: var(--text-secondary);
  }

  /* Sub Tabs Navigation */
  .details-tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color);
    gap: 0.5rem;
  }

  .tab-btn {
    padding: 0.75rem 1.5rem;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .tab-btn:hover {
    color: var(--text-primary);
    border-bottom-color: var(--text-muted);
  }

  .tab-btn.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
  }

  .section-toolbar {
    border-bottom: 1px solid rgba(255,255,255,0.05);
    padding-bottom: 1rem;
    margin-bottom: 1.5rem;
  }

  .section-desc {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .toolbar-actions {
    display: flex;
    gap: 0.75rem;
  }

  .alert-info-box {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background-color: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 8px;
    margin-bottom: 1.5rem;
  }

  .alert-icon {
    font-size: 1.75rem;
  }

  .alert-info-box h4 {
    margin-bottom: 0.15rem;
    color: #a5b4fc;
  }

  .alert-info-box p {
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  /* Matches List Grid */
  .matches-list-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.25rem;
  }

  @media (max-width: 768px) {
    .matches-list-grid {
      grid-template-columns: 1fr;
    }
  }

  .match-item-card {
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 1rem;
    position: relative;
    transition: all 0.2s ease;
  }

  .match-item-card:hover {
    border-color: rgba(255,255,255,0.1);
    background: rgba(15, 23, 42, 0.6);
  }

  .match-item-card.match-completed {
    background: rgba(30, 41, 59, 0.2);
    opacity: 0.9;
  }

  .tag {
    position: absolute;
    top: 10px;
    right: 12px;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 0.1rem 0.5rem;
    border-radius: 4px;
    text-transform: uppercase;
  }

  .third-place-tag {
    background-color: rgba(180, 83, 9, 0.2);
    border: 1px solid rgba(180, 83, 9, 0.4);
    color: #fcd34d;
  }

  .final-tag {
    background-color: rgba(245, 158, 11, 0.2);
    border: 1px solid rgba(245, 158, 11, 0.4);
    color: #fcd34d;
  }

  .match-teams {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 1rem;
  }

  .team-row {
    display: flex;
    align-items: center;
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    background: rgba(0,0,0,0.15);
  }

  .team-row.is-winner {
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.2);
    color: #6ee7b7;
    font-weight: 600;
  }

  .team-name {
    flex-grow: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 75%;
  }

  .team-rating {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-right: 0.75rem;
  }

  .is-winner .team-rating {
    color: rgba(110, 231, 183, 0.7);
  }

  .team-score {
    font-weight: 700;
    font-size: 1.1rem;
  }

  .vs-divider {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-muted);
    text-align: center;
    margin: -0.25rem 0;
  }

  .match-controls {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  /* Table Standings Styling */
  .rank-pos {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.85rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255,255,255,0.05);
  }

  .pos-1 { background-color: var(--gold); color: var(--bg-darkest); }
  .pos-2 { background-color: var(--silver); color: var(--bg-darkest); }
  .pos-3 { background-color: var(--bronze); color: white; }

  .highlight-row {
    background-color: rgba(99, 102, 241, 0.03);
  }

  .highlight-row td {
    background-color: rgba(99, 102, 241, 0.03);
  }

  /* Pulse animation */
  .animate-pulse {
    animation: pulse 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: .9; transform: scale(1.02); }
  }
</style>
