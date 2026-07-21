<script>
  import { onMount } from 'svelte';
  import { players } from './store.js';

  export let standings; // { first: id, second: id, third: id }

  $: firstPlace = standings?.first ? $players.find(p => p.id === standings.first) : null;
  $: secondPlace = standings?.second ? $players.find(p => p.id === standings.second) : null;
  $: thirdPlace = standings?.third ? $players.find(p => p.id === standings.third) : null;

  let animate = false;
  onMount(() => {
    // Add small delay to trigger CSS entry animations
    const timer = setTimeout(() => animate = true, 100);
    return () => clearTimeout(timer);
  });
</script>

<div class="podium-section card">
  <h2>🏆 Final Tournament Standings 🏆</h2>
  
  <div class="podium-wrapper" class:animate>
    <!-- 2nd Place (Silver) -->
    {#if secondPlace}
      <div class="podium-col second">
        <div class="player-bubble animate-item delay-1">
          <div class="medal silver-medal">🥈</div>
          <span class="p-name">{secondPlace.name}</span>
          <span class="p-rating">Rating: {secondPlace.rating}</span>
        </div>
        <div class="podium-block silver-block animate-item delay-1">
          <span class="rank-number">2</span>
          <span class="rank-title">Silver</span>
        </div>
      </div>
    {/if}

    <!-- 1st Place (Gold) -->
    {#if firstPlace}
      <div class="podium-col first">
        <div class="player-bubble animate-item">
          <div class="crown">👑</div>
          <div class="medal gold-medal">🥇</div>
          <span class="p-name">{firstPlace.name}</span>
          <span class="p-rating">Rating: {firstPlace.rating}</span>
        </div>
        <div class="podium-block gold-block animate-item">
          <span class="rank-number">1</span>
          <span class="rank-title">Gold</span>
        </div>
      </div>
    {/if}

    <!-- 3rd Place (Bronze) -->
    {#if thirdPlace}
      <div class="podium-col third">
        <div class="player-bubble animate-item delay-2">
          <div class="medal bronze-medal">🥉</div>
          <span class="p-name">{thirdPlace.name}</span>
          <span class="p-rating">Rating: {thirdPlace.rating}</span>
        </div>
        <div class="podium-block bronze-block animate-item delay-2">
          <span class="rank-number">3</span>
          <span class="rank-title">Bronze</span>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .podium-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: radial-gradient(circle at center, rgba(99, 102, 241, 0.15), transparent 70%), 
                rgba(30, 41, 59, 0.7) !important;
    padding: 2.5rem !important;
    border: 1.5px solid rgba(139, 92, 246, 0.3) !important;
    box-shadow: 0 10px 40px -10px rgba(139, 92, 246, 0.15) !important;
  }

  .podium-section h2 {
    margin-bottom: 2.5rem;
    text-align: center;
    font-size: 1.8rem;
    background: linear-gradient(135deg, #fff, #fbbf24);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .podium-wrapper {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 1.5rem;
    height: 380px;
    width: 100%;
    max-width: 650px;
    margin-top: 1rem;
  }

  .podium-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    height: 100%;
    justify-content: flex-end;
  }

  .player-bubble {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-bottom: 1rem;
    position: relative;
  }

  .crown {
    position: absolute;
    top: -2.25rem;
    font-size: 2rem;
    animation: bounce 2s infinite ease-in-out;
  }

  .medal {
    font-size: 2.5rem;
    line-height: 1;
    margin-bottom: 0.5rem;
  }

  .p-name {
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--text-primary);
    max-width: 180px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .p-rating {
    font-size: 0.8rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  /* Podiums blocks */
  .podium-block {
    width: 100%;
    border-radius: 12px 12px 0 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    position: relative;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
  }

  .first .podium-block {
    height: 180px;
    background: linear-gradient(to top, rgba(217, 119, 6, 0.9), rgba(245, 158, 11, 0.9));
    border: 1px solid rgba(245, 158, 11, 0.4);
    border-bottom: none;
    box-shadow: 0 10px 30px rgba(245, 158, 11, 0.2);
  }

  .second .podium-block {
    height: 130px;
    background: linear-gradient(to top, rgba(71, 85, 105, 0.9), rgba(148, 163, 184, 0.9));
    border: 1px solid rgba(148, 163, 184, 0.4);
    border-bottom: none;
    box-shadow: 0 10px 30px rgba(148, 163, 184, 0.15);
  }

  .third .podium-block {
    height: 90px;
    background: linear-gradient(to top, rgba(120, 53, 15, 0.9), rgba(180, 83, 9, 0.9));
    border: 1px solid rgba(180, 83, 9, 0.4);
    border-bottom: none;
    box-shadow: 0 10px 30px rgba(180, 83, 9, 0.15);
  }

  .rank-number {
    font-size: 3rem;
    font-weight: 800;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1;
  }

  .rank-title {
    font-size: 0.75rem;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.5);
  }

  /* Entry animations setup */
  .animate-item {
    opacity: 0;
    transform: translateY(20px) scale(0.9);
    transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .podium-wrapper.animate .animate-item {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  .podium-wrapper.animate .delay-1 {
    transition-delay: 0.2s;
  }

  .podium-wrapper.animate .delay-2 {
    transition-delay: 0.4s;
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }

  @keyframes scaleUp {
    from { transform: scaleY(0); }
    to { transform: scaleY(1); }
  }
</style>
