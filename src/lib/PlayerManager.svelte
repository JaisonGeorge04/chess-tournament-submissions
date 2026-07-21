<script>
  import { players, playerActions, tournaments } from './store.js';

  let searchQuery = '';
  let sortBy = 'rating-desc'; // 'rating-desc', 'rating-asc', 'name-asc', 'name-desc'
  
  // Create / Edit Form State
  let showModal = false;
  let isEditing = false;
  let currentPlayer = { id: null, name: '', rating: 1200, age: 25, country: '' };
  
  // Validation Errors
  let errors = { name: '', rating: '', age: '', country: '' };

  // Check if player is registered in an active tournament
  function isPlayerInActiveTournament(playerId) {
    return $tournaments.some(t => t.status === 'active' && t.playerIds.includes(playerId));
  }

  // Filtered and Sorted Players list
  $: filteredPlayers = $players
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'rating-desc') return b.rating - a.rating;
      if (sortBy === 'rating-asc') return a.rating - b.rating;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      return 0;
    });

  function openAddModal() {
    isEditing = false;
    currentPlayer = { id: null, name: '', rating: 1200, age: 25, country: '' };
    errors = { name: '', rating: '', age: '', country: '' };
    showModal = true;
  }

  function openEditModal(player) {
    isEditing = true;
    currentPlayer = { ...player };
    errors = { name: '', rating: '', age: '', country: '' };
    showModal = true;
  }

  function validate() {
    let valid = true;
    errors = { name: '', rating: '', age: '', country: '' };

    if (!currentPlayer.name.trim()) {
      errors.name = 'Name is required';
      valid = false;
    }
    if (!currentPlayer.country.trim()) {
      errors.country = 'Country is required';
      valid = false;
    }
    if (currentPlayer.rating < 100 || currentPlayer.rating > 4000) {
      errors.rating = 'Rating must be between 100 and 4000';
      valid = false;
    }
    if (currentPlayer.age < 5 || currentPlayer.age > 120) {
      errors.age = 'Age must be between 5 and 120';
      valid = false;
    }

    return valid;
  }

  function handleSubmit() {
    if (!validate()) return;

    if (isEditing) {
      playerActions.update(currentPlayer);
    } else {
      playerActions.add(currentPlayer);
    }

    showModal = false;
  }

  function handleDelete(id, name) {
    if (isPlayerInActiveTournament(id)) {
      alert(`Cannot delete ${name} because they are currently playing in an active tournament!`);
      return;
    }

    if (confirm(`Are you sure you want to delete ${name}?`)) {
      playerActions.delete(id);
    }
  }

  function getAvatarColor(name) {
    const colors = [
      '#ef4444', '#f57c00', '#f59e0b', '#10b981', '#06b6d4', 
      '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }
</script>

<div class="player-manager">
  <!-- Search and Actions Header -->
  <div class="card toolbar-card">
    <div class="toolbar-content">
      <div class="search-box">
        <input 
          type="text" 
          placeholder="Search players by name..." 
          bind:value={searchQuery}
        />
      </div>
      <div class="sort-box">
        <select bind:value={sortBy}>
          <option value="rating-desc">Rating: High to Low</option>
          <option value="rating-asc">Rating: Low to High</option>
          <option value="name-asc">Name: A to Z</option>
          <option value="name-desc">Name: Z to A</option>
        </select>
      </div>
      <button class="btn btn-primary" on:click={openAddModal}>
        <span>+</span> Add New Player
      </button>
    </div>
  </div>

  <!-- Players list / Table -->
  <div class="card table-card">
    <h2>All Players ({filteredPlayers.length})</h2>
    {#if filteredPlayers.length === 0}
      <div class="empty-state">
        <p>No players found matching your criteria.</p>
      </div>
    {:else}
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th>Country</th>
              <th>Age</th>
              <th>Rating</th>
              <th>Win / Loss</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredPlayers as player}
              <tr>
                <td>
                  <div class="player-cell">
                    <div 
                      class="player-avatar" 
                      style="background-color: {getAvatarColor(player.name)}"
                    >
                      {player.name.charAt(0)}
                    </div>
                    <span class="player-name">{player.name}</span>
                    {#if isPlayerInActiveTournament(player.id)}
                      <span class="badge badge-warning text-xs">Playing</span>
                    {/if}
                  </div>
                </td>
                <td>{player.country}</td>
                <td>{player.age}</td>
                <td>
                  <span class="rating-badge">{player.rating}</span>
                </td>
                <td>
                  <span class="text-success">{player.wins} W</span> / 
                  <span class="text-error">{player.losses} L</span>
                </td>
                <td style="text-align: right;">
                  <div class="actions-cell">
                    <button 
                      class="btn btn-secondary btn-sm"
                      on:click={() => openEditModal(player)}
                    >
                      Edit
                    </button>
                    <button 
                      class="btn btn-danger btn-sm"
                      class:btn-disabled={isPlayerInActiveTournament(player.id)}
                      on:click={() => handleDelete(player.id, player.name)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>

  <!-- Modal Form -->
  {#if showModal}
    <div class="modal-overlay" on:click|self={() => showModal = false}>
      <div class="modal-content">
        <h2>{isEditing ? 'Edit Player' : 'Add New Player'}</h2>
        
        <form on:submit|preventDefault={handleSubmit} class="player-form">
          <div class="form-group">
            <label for="name">Full Name</label>
            <input 
              type="text" 
              id="name" 
              bind:value={currentPlayer.name} 
              placeholder="e.g. Magnus Carlsen"
            />
            {#if errors.name}
              <span class="error-text">{errors.name}</span>
            {/if}
          </div>

          <div class="grid-cols-2 gap-sm">
            <div class="form-group">
              <label for="rating">Elo Rating</label>
              <input 
                type="number" 
                id="rating" 
                bind:value={currentPlayer.rating} 
                min="100" 
                max="4000"
              />
              {#if errors.rating}
                <span class="error-text">{errors.rating}</span>
              {/if}
            </div>

            <div class="form-group">
              <label for="age">Age</label>
              <input 
                type="number" 
                id="age" 
                bind:value={currentPlayer.age} 
                min="5" 
                max="120"
              />
              {#if errors.age}
                <span class="error-text">{errors.age}</span>
              {/if}
            </div>
          </div>

          <div class="form-group">
            <label for="country">Country</label>
            <input 
              type="text" 
              id="country" 
              bind:value={currentPlayer.country} 
              placeholder="e.g. Norway"
            />
            {#if errors.country}
              <span class="error-text">{errors.country}</span>
            {/if}
          </div>

          <div class="flex-row modal-actions" style="margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" on:click={() => showModal = false}>
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              {isEditing ? 'Save Changes' : 'Create Player'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>

<style>
  .player-manager {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .toolbar-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .search-box {
    flex-grow: 1;
    min-width: 250px;
  }

  .sort-box select {
    width: auto;
    min-width: 200px;
  }

  .table-card h2 {
    margin-bottom: 1.25rem;
  }

  .player-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .player-avatar {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: white;
    font-size: 0.95rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .player-name {
    font-weight: 500;
  }

  .rating-badge {
    background: rgba(99, 102, 241, 0.15);
    color: #a5b4fc;
    font-weight: 600;
    padding: 0.35rem 0.65rem;
    border-radius: 6px;
    border: 1px solid rgba(99, 102, 241, 0.3);
  }

  .text-success { color: var(--success); }
  .text-error { color: var(--error); }
  .text-xs { font-size: 0.65rem; padding: 0.1rem 0.4rem; }

  .actions-cell {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .btn-sm {
    padding: 0.35rem 0.75rem;
    font-size: 0.85rem;
  }

  .player-form {
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

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--text-muted);
  }
</style>
