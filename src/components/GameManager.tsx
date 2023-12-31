import Board, { BoardConfiguration } from "./Board.tsx";
import { useUserIdContext } from "./hooks/useUserIdContext";

interface GameManagerProps {
    gameId: string,
    initBoard: BoardConfiguration,
    roomCode: string
}

export default function GameManager({gameId, initBoard, roomCode} : GameManagerProps) {
    const userId = useUserIdContext();
    const duration = 10;

    return (
        <>
            {initBoard &&
                <Board initBoardConfig={initBoard} roomCode={roomCode} gameId={gameId} />
            }
        </>
    )


}