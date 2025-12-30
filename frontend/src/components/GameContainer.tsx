import { PixiGame } from '../game/PixiGame';

interface GameContainerProps {
  onGameOver?: (score: number) => void;
  onScoreUpdate?: (score: number) => void;
  onSubmitScoreRequest?: (score: number) => void;
  selectedSkin?: string;
  isJesseMode?: boolean;
}

export function GameContainer({
  onGameOver,
  onScoreUpdate,
  selectedSkin = 'bird',
  isJesseMode = false,
}: GameContainerProps) {
  return (
    <div className="flex items-center justify-center">
      <PixiGame
        onScoreUpdate={onScoreUpdate}
        onGameOver={onGameOver}
        selectedSkin={selectedSkin}
        isJesseMode={isJesseMode}
      />
    </div>
  );
}
