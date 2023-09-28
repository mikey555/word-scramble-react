import { LetterBlock } from "./LetterBlock";
import { BoggleDice, LetterDieSchema } from "~/server/diceManager";
import { useEffect, useRef, useState } from "react";
import useCustomDrag from "./useDrag";
import { useUserIdContext } from "./hooks/useUserIdContext";
import { useChannel } from "@ably-labs/react-hooks";
import { WordSubmittedMessageData } from "~/server/api/routers/gameplayRouter";
import { ablyChannelName } from "~/server/ably/ablyHelpers";
import { api } from "~/utils/api";
import { MaterialUISwitch } from "./MUISwitch";
import LetterDropTarget from "./LetterDropTarget";
import { swap } from "~/utils/helpers";
interface BoardProps {
    config: LetterDieSchema[],
    roomCode: string,
    gameId: string,
}




export type DragMode = 'DragToSelect' | 'DragNDrop';

export default function Board({config, roomCode, gameId}: BoardProps) {
    const [letterBlocks, setLetterBlocks] = useState([...config]);
    const [selectedLetters, setSelectedLetters] = useState<number[]>([]);
    const [isPointerDown, setIsPointerDown] = useState<boolean>(false);
    const [pointerOver, setPointerOver] = useState<number>(); // pointerover
    const [lastSubmittedLetters, setLastSubmittedLetters] = useState<number[]>();
    const [letters, setLetters] = useState(config);

    const [dragMode, setDragMode] = useState<DragMode>('DragNDrop');


    const submitWord = api.gameplay.submitWord.useMutation({
        onSettled: () => {
            setSelectedLetters([]);
        }
    });

    const [channel] = useChannel(ablyChannelName(roomCode), 'wordSubmitted', (message) => {
        const msgData = message.data as WordSubmittedMessageData;
        setLetterBlocks(msgData.newBoard);
    });

    const userId = useUserIdContext();

    const handleLetterBlockDown = (e: PointerEvent, i: number) => {
        if (submitWord.isLoading) return;
        setIsPointerDown(true);
        switch (dragMode) {
            case 'DragToSelect':
                setSelectedLetters([i]);
                break;
            case 'DragNDrop':

                break;
            default:
                break;
        }
    }

    const handleLetterBlockEnter = (e: PointerEvent, i: number) => {
        if (!isPointerDown || i == undefined || selectedLetters.includes(i) || submitWord.isLoading) return;

        switch (dragMode) {
            case 'DragToSelect':
                const lastBlockSelected = selectedLetters.slice(-1)[0];
                if (lastBlockSelected != undefined) {
                    const isNeighbor = getNeighbors(lastBlockSelected)?.includes(i);
                    if (!isNeighbor) return;
                }
                setPointerOver(i);
                setSelectedLetters([...selectedLetters, i]);
                break;
            case 'DragNDrop':

                break;
            default:
                break;
        }
    }
    const handlePointerUp = (e: PointerEvent) => {

        if (submitWord.isLoading) return;
        setIsPointerDown(false);
        switch (dragMode) {
            case 'DragToSelect':
                if (letters == undefined || letters.length < 3) {
                    setSelectedLetters([]);
                    return;
                }
                handleSubmitLetters(selectedLetters);
                break;
            case 'DragNDrop':

                break;

            default:
                break;
        }
    }

    const handleSwapLetterToCell = (lowerLetterBlockId: number, fromCell: number, toCell: number) => {
        // console.log(`swapping blocks: ${fromCell} to ${toCell}`)
        if (fromCell === toCell) return;
        setLetterBlocks(swap(letterBlocks, fromCell, toCell));
        // setSwappedLetterInfo({ id: lowerLetterBlockId, sendToCell: toCell });

    };

    const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
    }

    function handleSubmitLetters(letters: number[]) {

        submitWord.mutate({
            userId: userId,
            gameId: gameId,
            letterBlocks: letters,
            roomCode: roomCode,
        })
    }

    // when pointerup happens outside a letter
    const windowRef = useRef<EventTarget>(window);
    useCustomDrag(windowRef, [isPointerDown, selectedLetters], {
        onPointerUp: handlePointerUp,
        dragMode: dragMode
    }, 'window');



    // prevent tap-and-hold browser context menu from appearing
    useEffect(() => {
        window.addEventListener('contextmenu', handleContextMenu, true);
        return () => {
            window.removeEventListener('contextmenu', handleContextMenu, true);
        }
    }, []);

    return (
        <>
            <div className="board flex flex-col">
                {rows.map((row) =>
                    <div key={row} className="board-row flex justify-center">
                    {rows.map(col => {
                        const i = boardWidth * row + col;
                        const letterBlock = letterBlocks[i];
                        const letter = letterBlock?.letters[0];
                        if (i === 2) {
                            console.log(`Board: rendering cell 2 as ${letterBlock?.id}/${letter}`)
                        }
                        if (letterBlock != undefined && letter != undefined)
                            return (
                                <LetterDropTarget key={i} cell={i} onDragOver={handleSwapLetterToCell} childLetterBlockId={letterBlock.id} childLetter={letterBlock.letters[0]}>
                                    <LetterBlock key={letterBlock.id} id={letterBlock.id} letter={letter} currCell={i}
                                        onPointerDown={handleLetterBlockDown} onPointerUp={handlePointerUp}
                                        onPointerEnter={handleLetterBlockEnter}

                                        isSelected={selectedLetters.includes(i)}
                                        isPointerOver={pointerOver === i}
                                        blocksSelected={selectedLetters}

                                        dragMode={dragMode}

                                    />
                                </LetterDropTarget>)
                    })}
                    </div>
                )}
            </div>
            <MaterialUISwitch />
        </>
    );
}

const boardWidth = Math.sqrt(BoggleDice.length);
    if (![4, 5, 6].includes(boardWidth)) {
        throw new Error('Board must be square');
    }
const rows = [...Array(boardWidth).keys()]


const neighborMap = [
    [1, 4, 5],
    [0, 4, 5, 6, 2],
    [1, 5, 6, 7, 3],
    [2, 6, 7],
    [0, 1, 5, 9, 8],
    [0, 1, 2, 4, 6, 8, 9, 10],
    [1, 2, 3, 5, 7, 9, 10, 11],
    [3, 2, 6, 10, 11],
    [4, 5, 9, 12, 13],
    [4, 5, 6, 8, 10, 12, 13, 14],
    [5, 6, 7, 9, 11, 13, 14, 15],
    [6, 7, 10, 14, 15],
    [8, 9, 13],
    [12, 8, 9, 10, 14],
    [13, 9, 10, 11, 15],
    [14, 10, 11]
];

function getNeighbors(i: number) {
    if (i < 0 || i >= neighborMap.length) throw new Error('Letter block index out of bounds');
    return neighborMap[i];
}