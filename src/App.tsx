import { useState } from 'react';
import VenueSetup from './components/VenueSetup';
import GameSetup from './components/GameSetup';
import GameBoard from './components/GameBoard';
import { GameState, GameType, Player, DartThrow } from './types/game';

interface VenueInfo {
  id: string;
  name: string;
}

function App() {
  const [venue, setVenue] = useState<VenueInfo | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);

  const startGame = (gameType: GameType, playerNames: string[]) => {
    const startingScore = parseInt(gameType);
    const players: Player[] = playerNames.map((name, index) => ({
      id: `player-${index}`,
      name,
      score: startingScore,
      turns: [],
      isWinner: false,
      average: 0,
      highestScore: 0,
    }));

    setGameState({
      gameType,
      players,
      currentPlayerIndex: 0,
      currentThrows: [],
      isGameOver: false,
      winner: null,
    });
  };

  const addThrow = (dartThrow: DartThrow) => {
    if (!gameState || gameState.isGameOver) return;

    const newThrows = [...gameState.currentThrows, dartThrow];
    setGameState({
      ...gameState,
      currentThrows: newThrows,
    });
  };

  const addMiss = () => {
    if (!gameState || gameState.isGameOver) return;

    const missThrow: DartThrow = {
      sector: 0,
      multiplier: 'single',
      score: 0,
    };

    const newThrows = [...gameState.currentThrows, missThrow];
    setGameState({
      ...gameState,
      currentThrows: newThrows,
    });
  };

  const removeThrow = () => {
    if (!gameState || gameState.currentThrows.length === 0) return;

    const newThrows = gameState.currentThrows.slice(0, -1);
    setGameState({
      ...gameState,
      currentThrows: newThrows,
    });
  };

  const submitTurn = () => {
    if (!gameState || gameState.currentThrows.length === 0 || gameState.isGameOver) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const turnScore = gameState.currentThrows.reduce((acc, dart) => acc + dart.score, 0);
    const newScore = currentPlayer.score - turnScore;

    if (newScore < 0 || (newScore === 0 && gameState.currentThrows[gameState.currentThrows.length - 1].multiplier !== 'double')) {
      const updatedPlayers = [...gameState.players];
      updatedPlayers[gameState.currentPlayerIndex] = {
        ...currentPlayer,
        turns: [
          ...currentPlayer.turns,
          {
            throws: gameState.currentThrows,
            totalScore: 0,
            remainingScore: currentPlayer.score,
          },
        ],
      };

      setGameState({
        ...gameState,
        players: updatedPlayers,
        currentThrows: [],
        currentPlayerIndex: (gameState.currentPlayerIndex + 1) % gameState.players.length,
      });
      return;
    }

    const newTurns = [
      ...currentPlayer.turns,
      {
        throws: gameState.currentThrows,
        totalScore: turnScore,
        remainingScore: newScore,
      },
    ];

    const allThrows = newTurns.flatMap(turn => turn.throws);
    const totalScored = allThrows.reduce((acc, dart) => acc + dart.score, 0);
    const newAverage = allThrows.length > 0 ? totalScored / allThrows.length : 0;
    const newHighestScore = Math.max(currentPlayer.highestScore, turnScore);

    const updatedPlayer: Player = {
      ...currentPlayer,
      score: newScore,
      turns: newTurns,
      average: newAverage,
      highestScore: newHighestScore,
      isWinner: newScore === 0,
    };

    const updatedPlayers = [...gameState.players];
    updatedPlayers[gameState.currentPlayerIndex] = updatedPlayer;

    if (newScore === 0) {
      setGameState({
        ...gameState,
        players: updatedPlayers,
        currentThrows: [],
        isGameOver: true,
        winner: updatedPlayer,
      });
    } else {
      setGameState({
        ...gameState,
        players: updatedPlayers,
        currentThrows: [],
        currentPlayerIndex: (gameState.currentPlayerIndex + 1) % gameState.players.length,
      });
    }
  };

  const newGame = () => {
    if (!gameState) return;
    startGame(gameState.gameType, gameState.players.map(p => p.name));
  };

  const backToSetup = () => {
    setGameState(null);
  };

  if (!venue) {
    return (
      <VenueSetup
        onVenueSelected={(id, name) => setVenue({ id, name })}
      />
    );
  }

  if (!gameState) {
    return <GameSetup onStartGame={startGame} />;
  }

  return (
    <GameBoard
      players={gameState.players}
      currentPlayerIndex={gameState.currentPlayerIndex}
      currentThrows={gameState.currentThrows}
      gameType={gameState.gameType}
      isGameOver={gameState.isGameOver}
      winner={gameState.winner}
      onAddThrow={addThrow}
      onRemoveThrow={removeThrow}
      onSubmitTurn={submitTurn}
      onMiss={addMiss}
      onNewGame={newGame}
      onBackToSetup={backToSetup}
    />
  );
}

export default App;
