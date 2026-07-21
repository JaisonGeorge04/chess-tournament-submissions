import { writable } from 'svelte/store';

// Helper to generate UUIDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// Mock Players to WOW the user on startup if they have no players
const initialPlayers = [
  { id: 'p1', name: 'Magnus Carlsen', rating: 2882, age: 35, country: 'Norway', wins: 0, losses: 0 },
  { id: 'p2', name: 'Hikaru Nakamura', rating: 2875, age: 38, country: 'USA', wins: 0, losses: 0 },
  { id: 'p3', name: 'Garry Kasparov', rating: 2851, age: 63, country: 'Russia', wins: 0, losses: 0 },
  { id: 'p4', name: 'Bobby Fischer', rating: 2785, age: 64, country: 'USA', wins: 0, losses: 0 },
  { id: 'p5', name: 'Viswanathan Anand', rating: 2770, age: 56, country: 'India', wins: 0, losses: 0 },
  { id: 'p6', name: 'Judit Polgar', rating: 2735, age: 49, country: 'Hungary', wins: 0, losses: 0 },
  { id: 'p7', name: 'Fabiano Caruana', rating: 2804, age: 33, country: 'USA', wins: 0, losses: 0 },
  { id: 'p8', name: 'Ding Liren', rating: 2780, age: 33, country: 'China', wins: 0, losses: 0 },
];

const initialTournaments = [
  {
    id: 't1',
    name: 'Champions Chess Showdown',
    status: 'registration', // 'registration', 'active', 'completed'
    playerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'],
    rounds: [],
    currentRoundIndex: 0,
    standings: null, // { first: id, second: id, third: id }
    createdAt: new Date().toISOString()
  }
];

// --- PLAYERS STORE ---
const storedPlayers = localStorage.getItem('chess_players');
const initialPlayersData = storedPlayers ? JSON.parse(storedPlayers) : initialPlayers;

export const players = writable(initialPlayersData);

players.subscribe((value) => {
  localStorage.setItem('chess_players', JSON.stringify(value));
});

export const playerActions = {
  add: (player) => {
    players.update((list) => [
      ...list,
      {
        id: generateId(),
        name: player.name,
        rating: parseInt(player.rating) || 1200,
        age: parseInt(player.age) || 25,
        country: player.country || 'Unknown',
        wins: 0,
        losses: 0,
      },
    ]);
  },
  update: (updatedPlayer) => {
    players.update((list) =>
      list.map((p) => (p.id === updatedPlayer.id ? { ...p, ...updatedPlayer } : p))
    );
  },
  delete: (id) => {
    players.update((list) => list.filter((p) => p.id !== id));
  },
};

// --- TOURNAMENTS STORE ---
const storedTournaments = localStorage.getItem('chess_tournaments');
const initialTournamentsData = storedTournaments ? JSON.parse(storedTournaments) : initialTournaments;

export const tournaments = writable(initialTournamentsData);

tournaments.subscribe((value) => {
  localStorage.setItem('chess_tournaments', JSON.stringify(value));
});

// Helper: Elo Probability for winning
const getWinProbability = (r1, r2) => {
  return 1 / (1 + Math.pow(10, (r2 - r1) / 400));
};

export const tournamentActions = {
  create: (name) => {
    tournaments.update((list) => [
      ...list,
      {
        id: generateId(),
        name,
        status: 'registration',
        playerIds: [],
        rounds: [],
        currentRoundIndex: 0,
        standings: null,
        createdAt: new Date().toISOString(),
      },
    ]);
  },
  delete: (id) => {
    tournaments.update((list) => list.filter((t) => t.id !== id));
  },
  registerPlayer: (tournamentId, playerId) => {
    tournaments.update((list) =>
      list.map((t) => {
        if (t.id === tournamentId) {
          if (!t.playerIds.includes(playerId)) {
            return { ...t, playerIds: [...t.playerIds, playerId] };
          }
        }
        return t;
      })
    );
  },
  unregisterPlayer: (tournamentId, playerId) => {
    tournaments.update((list) =>
      list.map((t) => {
        if (t.id === tournamentId) {
          return { ...t, playerIds: t.playerIds.filter((id) => id !== playerId) };
        }
        return t;
      })
    );
  },
  startTournament: (tournamentId, allPlayers) => {
    tournaments.update((list) =>
      list.map((t) => {
        if (t.id !== tournamentId) return t;

        const registeredIds = [...t.playerIds];
        if (registeredIds.length < 2) {
          return t; // Need at least 2 players
        }

        // Shuffle players for random pairing
        const shuffled = registeredIds.sort(() => 0.5 - Math.random());

        // Determine size of bracket (next power of 2)
        const N = shuffled.length;
        const M = Math.pow(2, Math.ceil(Math.log2(N)));

        // Create Round 1 matches
        const matches = [];
        const numMatches = M / 2;

        for (let i = 0; i < numMatches; i++) {
          const p1Id = shuffled[2 * i] || null;
          const p2Id = shuffled[2 * i + 1] || null;

          let match = {
            id: generateId(),
            player1Id: p1Id,
            player2Id: p2Id,
            winnerId: null,
            score1: null,
            score2: null,
            status: 'pending', // 'pending', 'completed'
            isBye: false,
          };

          // If one player is null, it's a BYE
          if (p1Id && !p2Id) {
            match.winnerId = p1Id;
            match.score1 = 1;
            match.score2 = 0;
            match.status = 'completed';
            match.isBye = true;
          } else if (!p1Id && p2Id) {
            match.winnerId = p2Id;
            match.score1 = 0;
            match.score2 = 1;
            match.status = 'completed';
            match.isBye = true;
          }

          matches.push(match);
        }

        return {
          ...t,
          status: 'active',
          currentRoundIndex: 0,
          rounds: [matches],
          standings: null,
        };
      })
    );
  },
  simulateMatch: (tournamentId, roundIndex, matchId, allPlayers) => {
    let matchWinnerId = null;
    let matchLoserId = null;

    tournaments.update((list) =>
      list.map((t) => {
        if (t.id !== tournamentId) return t;

        const rounds = [...t.rounds];
        const round = [...rounds[roundIndex]];
        const matchIdx = round.findIndex((m) => m.id === matchId);

        if (matchIdx === -1 || round[matchIdx].status === 'completed') return t;

        const match = { ...round[matchIdx] };
        const p1 = allPlayers.find((p) => p.id === match.player1Id);
        const p2 = allPlayers.find((p) => p.id === match.player2Id);

        if (!p1 || !p2) return t;

        // Perform random selection with Elo rating weighting
        const prob1 = getWinProbability(p1.rating, p2.rating);
        const rand = Math.random();

        if (rand < prob1) {
          match.winnerId = p1.id;
          match.score1 = 1;
          match.score2 = 0;
          matchWinnerId = p1.id;
          matchLoserId = p2.id;
        } else {
          match.winnerId = p2.id;
          match.score1 = 0;
          match.score2 = 1;
          matchWinnerId = p2.id;
          matchLoserId = p1.id;
        }

        match.status = 'completed';
        round[matchIdx] = match;
        rounds[roundIndex] = round;

        return { ...t, rounds };
      })
    );

    // Update player win/loss records globally
    if (matchWinnerId && matchLoserId) {
      players.update((pList) =>
        pList.map((p) => {
          if (p.id === matchWinnerId) {
            return { ...p, wins: p.wins + 1 };
          }
          if (p.id === matchLoserId) {
            return { ...p, losses: p.losses + 1 };
          }
          return p;
        })
      );
    }
  },
  simulateRound: (tournamentId, roundIndex, allPlayers) => {
    tournaments.update((list) => {
      const tIdx = list.findIndex((t) => t.id === tournamentId);
      if (tIdx === -1) return list;

      const t = list[tIdx];
      const rounds = [...t.rounds];
      const round = [...rounds[roundIndex]];
      let updatedPlayers = [...allPlayers];

      const newRound = round.map((match) => {
        if (match.status === 'completed') return match;
        if (!match.player1Id || !match.player2Id) return match;

        const p1 = updatedPlayers.find((p) => p.id === match.player1Id);
        const p2 = updatedPlayers.find((p) => p.id === match.player2Id);

        if (!p1 || !p2) return match;

        const prob1 = getWinProbability(p1.rating, p2.rating);
        const rand = Math.random();
        let winnerId, score1, score2, loserId;

        if (rand < prob1) {
          winnerId = p1.id;
          score1 = 1;
          score2 = 0;
          loserId = p2.id;
        } else {
          winnerId = p2.id;
          score1 = 0;
          score2 = 1;
          loserId = p1.id;
        }

        // Update local variables for subsequent updates in loop
        updatedPlayers = updatedPlayers.map((p) => {
          if (p.id === winnerId) return { ...p, wins: p.wins + 1 };
          if (p.id === loserId) return { ...p, losses: p.losses + 1 };
          return p;
        });

        return {
          ...match,
          winnerId,
          score1,
          score2,
          status: 'completed',
        };
      });

      // Update global players
      players.set(updatedPlayers);

      rounds[roundIndex] = newRound;
      const newList = [...list];
      newList[tIdx] = { ...t, rounds };
      return newList;
    });
  },
  advanceRound: (tournamentId) => {
    tournaments.update((list) =>
      list.map((t) => {
        if (t.id !== tournamentId) return t;

        const rounds = [...t.rounds];
        const currentRound = rounds[t.currentRoundIndex];

        // Ensure all matches are completed
        const uncompleted = currentRound.some((m) => m.status !== 'completed');
        if (uncompleted) return t;

        // Check if current round has a 3rd place match (which indicates we are in the Final round)
        const isFinalsRound = currentRound.length === 2 && currentRound[1].isThirdPlaceMatch;
        // Or if current round is just 1 match (the absolute Final with no 3rd place setup, i.e., started with 2 players)
        const isSingleMatchFinal = currentRound.length === 1;

        if (isFinalsRound || isSingleMatchFinal) {
          // Tournament is complete!
          let first = null;
          let second = null;
          let third = null;

          if (isSingleMatchFinal) {
            const finalMatch = currentRound[0];
            first = finalMatch.winnerId;
            second = finalMatch.winnerId === finalMatch.player1Id ? finalMatch.player2Id : finalMatch.player1Id;
          } else {
            // currentRound has [FinalMatch, ThirdPlaceMatch]
            const finalMatch = currentRound[0];
            const thirdPlaceMatch = currentRound[1];

            first = finalMatch.winnerId;
            second = finalMatch.winnerId === finalMatch.player1Id ? finalMatch.player2Id : finalMatch.player1Id;
            third = thirdPlaceMatch.winnerId;
          }

          return {
            ...t,
            status: 'completed',
            standings: { first, second, third },
          };
        }

        // If current round was Semifinals (which has exactly 2 matches)
        if (currentRound.length === 2) {
          // Generate:
          // 1. The Final match (winners of Match 0 and Match 1)
          // 2. The 3rd Place Play-Off match (losers of Match 0 and Match 1)
          const m0 = currentRound[0];
          const m1 = currentRound[1];

          const winner0 = m0.winnerId;
          const loser0 = m0.winnerId === m0.player1Id ? m0.player2Id : m0.player1Id;

          const winner1 = m1.winnerId;
          const loser1 = m1.winnerId === m1.player1Id ? m1.player2Id : m1.player1Id;

          const finalMatch = {
            id: generateId(),
            player1Id: winner0,
            player2Id: winner1,
            winnerId: null,
            score1: null,
            score2: null,
            status: 'pending',
            isBye: false,
            isFinal: true,
          };

          const thirdPlaceMatch = {
            id: generateId(),
            player1Id: loser0,
            player2Id: loser1,
            winnerId: null,
            score1: null,
            score2: null,
            status: 'pending',
            isBye: false,
            isThirdPlaceMatch: true,
          };

          const nextMatches = [finalMatch, thirdPlaceMatch];
          return {
            ...t,
            currentRoundIndex: t.currentRoundIndex + 1,
            rounds: [...rounds, nextMatches],
          };
        }

        // Normal Round progression: Pair winners of Match 2i and Match 2i+1
        const nextMatches = [];
        const numMatches = currentRound.length / 2;

        for (let i = 0; i < numMatches; i++) {
          const m0 = currentRound[2 * i];
          const m1 = currentRound[2 * i + 1];

          const p1Id = m0.winnerId;
          const p2Id = m1.winnerId;

          let match = {
            id: generateId(),
            player1Id: p1Id,
            player2Id: p2Id,
            winnerId: null,
            score1: null,
            score2: null,
            status: 'pending',
            isBye: false,
          };

          // Handle BYEs in advanced rounds just in case (e.g. if one player doesn't exist)
          if (p1Id && !p2Id) {
            match.winnerId = p1Id;
            match.score1 = 1;
            match.score2 = 0;
            match.status = 'completed';
            match.isBye = true;
          } else if (!p1Id && p2Id) {
            match.winnerId = p2Id;
            match.score1 = 0;
            match.score2 = 1;
            match.status = 'completed';
            match.isBye = true;
          }

          nextMatches.push(match);
        }

        return {
          ...t,
          currentRoundIndex: t.currentRoundIndex + 1,
          rounds: [...rounds, nextMatches],
        };
      })
    );
  },
};
