<script>
  import { players } from './store.js';

  export let tournament;

  $: getPlayer = (id) => {
    if (!id) return { name: 'BYE', rating: '' };
    return $players.find(p => p.id === id) || { name: 'Deleted Player', rating: '' };
  };

  $: rounds = tournament.rounds || [];
</script>

<div class="bracket-wrapper">
  {#if rounds.length === 0}
    <div class="empty-bracket">
      <p>No bracket generated yet. Start the tournament to see matchups.</p>
    </div>
  {:else}
    <div class="bracket-container">
      {#each rounds as round, rIdx}
        <div class="bracket-column">
          <div class="round-header">
            <h3>
              {#if rIdx === rounds.length - 1}
                Finals
              {:else if rIdx === rounds.length - 2}
                Semifinals
              {:else if rIdx === rounds.length - 3}
                Quarterfinals
              {:else}
                Round {rIdx + 1}
              {/if}
            </h3>
            <span class="matches-count">{round.length} {round.length === 1 ? 'match' : 'matches'}</span>
          </div>

          <div class="matches-list" style="--round-idx: {rIdx}">
            {#each round as match}
              {@const p1 = getPlayer(match.player1Id)}
              {@const p2 = getPlayer(match.player2Id)}
              
              <div class="match-card-container">
                <!-- Connectors can be drawn using CSS pseudo-elements -->
                <div class="card match-card" class:completed={match.status === 'completed'} class:special-match={match.isThirdPlaceMatch || match.isFinal}>
                  {#if match.isThirdPlaceMatch}
                    <div class="match-type-tag third-place-tag">3rd Place Play-Off</div>
                  {:else if match.isFinal}
                    <div class="match-type-tag final-tag">Championship Final</div>
                  {/if}

                  <div class="player-slot" class:winner={match.status === 'completed' && match.winnerId === match.player1Id} class:loser={match.status === 'completed' && match.winnerId !== match.player1Id}>
                    <div class="player-details">
                      <span class="p-name">{p1.name}</span>
                      {#if p1.rating}
                        <span class="p-rating">({p1.rating})</span>
                      {/if}
                    </div>
                    <div class="player-score">
                      {#if match.status === 'completed'}
                        {match.score1 ?? ''}
                      {:else if match.isBye}
                        W
                      {:else}
                        -
                      {/if}
                    </div>
                  </div>

                  <div class="divider"></div>

                  <div class="player-slot" class:winner={match.status === 'completed' && match.winnerId === match.player2Id} class:loser={match.status === 'completed' && match.winnerId !== match.player2Id}>
                    <div class="player-details">
                      <span class="p-name">{p2.name}</span>
                      {#if p2.rating}
                        <span class="p-rating">({p2.rating})</span>
                      {/if}
                    </div>
                    <div class="player-score">
                      {#if match.status === 'completed'}
                        {match.score2 ?? ''}
                      {:else if match.player2Id === null}
                        BYE
                      {:else}
                        -
                      {/if}
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .bracket-wrapper {
    overflow-x: auto;
    padding: 1.5rem 0;
    width: 100%;
  }

  .bracket-container {
    display: flex;
    gap: 3rem;
    min-width: max-content;
    padding: 1rem;
    align-items: stretch;
  }

  .bracket-column {
    display: flex;
    flex-direction: column;
    width: 280px;
  }

  .round-header {
    text-align: center;
    margin-bottom: 2rem;
    border-bottom: 2px solid rgba(255,255,255,0.05);
    padding-bottom: 0.75rem;
  }

  .round-header h3 {
    font-size: 1.2rem;
    color: var(--text-primary);
  }

  .matches-count {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    font-weight: 600;
  }

  .matches-list {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    height: 100%;
    flex-grow: 1;
    gap: 2rem;
  }

  .match-card-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  .match-card {
    width: 100%;
    padding: 0.75rem !important;
    background: rgba(30, 41, 59, 0.9) !important;
    border: 1px solid rgba(255, 255, 255, 0.05);
    position: relative;
    z-index: 2;
  }

  .match-card.completed {
    border-color: rgba(99, 102, 241, 0.15);
  }

  .match-card.special-match {
    border: 1.5px dashed rgba(139, 92, 246, 0.4);
    box-shadow: 0 0 15px rgba(139, 92, 246, 0.05);
  }

  .match-type-tag {
    position: absolute;
    top: -10px;
    left: 10px;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 0.1rem 0.5rem;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    z-index: 10;
  }

  .third-place-tag {
    background-color: #b45309;
    color: white;
  }

  .final-tag {
    background-color: var(--gold);
    color: var(--bg-darkest);
  }

  .player-slot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4rem 0.5rem;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .player-slot.winner {
    background-color: rgba(16, 185, 129, 0.08);
    color: #6ee7b7;
    font-weight: 600;
  }

  .player-slot.loser {
    opacity: 0.5;
  }

  .player-details {
    display: flex;
    gap: 0.35rem;
    align-items: center;
    max-width: 80%;
  }

  .p-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .p-rating {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .winner .p-rating {
    color: rgba(110, 231, 183, 0.7);
  }

  .player-score {
    font-size: 0.9rem;
    font-weight: 700;
    width: 24px;
    text-align: right;
  }

  .divider {
    height: 1px;
    background-color: rgba(255, 255, 255, 0.05);
    margin: 0.35rem 0;
  }

  .empty-bracket {
    text-align: center;
    padding: 3rem;
    color: var(--text-muted);
    font-style: italic;
  }
</style>
