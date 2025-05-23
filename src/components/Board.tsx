import {useEffect, useRef, useState} from "react";
import {BoggleDice} from "~/server/diceManager";
import {MIN_WORD_LENGTH} from "./Constants.tsx";
import {LetterBlock} from "./LetterBlock";
import {type BoardConfiguration, RoundState, WordSubmissionState} from "./Types.tsx";
import useSelectionDrag from "./useSelectionDrag.tsx";

import {getCellIdFromLetterId, getWordFromLetterBlockIds} from "~/lib/helpers.tsx";


interface BoardProps {
    boardConfig: BoardConfiguration,
    roomCode: string,
    onSubmitWord: (cellIds: number[]) => void,
    wordSubmissionState: WordSubmissionState,
    roundState: RoundState,
    onReselecting: () => void,
    onSelectionChange: (selectionSoFar: string) => void,
}

export default function Board({ boardConfig, onSubmitWord, wordSubmissionState, roundState, onReselecting, onSelectionChange }: BoardProps) {

    const [selectedLetterIds, setSelectedLetterIds] = useState<number[]>([]);
    const [isSelecting, setIsSelecting] = useState<boolean>(false);
    const boardRef = useRef<HTMLDivElement | null>(null);
    const [_, setHasFirstRenderHappened] = useState(false);
    const [prevRoundState, setPrevRoundState] = useState<RoundState>(roundState);

    const isSelectionDisabled =
        wordSubmissionState == WordSubmissionState.Submitting ||
        wordSubmissionState == WordSubmissionState.Confirming ||
        wordSubmissionState == WordSubmissionState.Confirmed ||
        roundState == RoundState.Intermission;

    const handleSelectionStarted = (e: PointerEvent, letterBlockId: number) => {
        if (isSelectionDisabled) return;
        setIsSelecting(true);
        setSelectedLetterIds([letterBlockId]);
        onSelectionChange(getWordFromLetterBlockIds([letterBlockId], boardConfig).word);
        onReselecting();
    }

    // force re-render in order to pass DOM refs to children
    useEffect(() => {
        setHasFirstRenderHappened(true);
    }, [])

    const handleLetterBlockEnter = (e: PointerEvent, letterBlockId: number) => {
        if (!isSelecting || letterBlockId == undefined || selectedLetterIds.includes(letterBlockId) || isSelectionDisabled) return;
        const lastBlockSelected = selectedLetterIds.slice(-1)[0];
        if (lastBlockSelected == undefined) return;
        const lastCellSelected = getCellIdFromLetterId(boardConfig, lastBlockSelected);
        const currCellSelected = getCellIdFromLetterId(boardConfig, letterBlockId);
        if (lastCellSelected != undefined && currCellSelected != undefined) {
            const isNeighbor = getNeighbors(lastCellSelected)?.includes(currCellSelected);
            if (!isNeighbor) return;
        }
        const updatedSelectedLetterIds = [...selectedLetterIds, letterBlockId]
        setSelectedLetterIds(updatedSelectedLetterIds);
        onSelectionChange(getWordFromLetterBlockIds(updatedSelectedLetterIds, boardConfig).word);
    }

    const handleSelectionFinished = (e: PointerEvent) => {
        if (isSelectionDisabled || !isSelecting) return; // TODO: there shouldn't be a mutation until selection is finished
        setIsSelecting(false);
        if (selectedLetterIds.length >= MIN_WORD_LENGTH) {
            onSubmitWord(selectedLetterIds.map(lid => getCellIdFromLetterId(boardConfig, lid)),);
        } else {
            setSelectedLetterIds([]);
            onSelectionChange('');
        }
    }

    // TODO: letterIds or sourceCellIds?


    // when pointerup happens outside a letter
    const windowRef = useRef<EventTarget>(window);
    useSelectionDrag(windowRef, [isSelecting, selectedLetterIds], {
        onPointerUp: handleSelectionFinished,
    }, 'window');

    // prevent tap-and-hold browser context menu from appearing
    const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
    }
    useEffect(() => {
        window.addEventListener('contextmenu', handleContextMenu, true);
        return () => {
            window.removeEventListener('contextmenu', handleContextMenu, true);
        }
    }, []);

    if (roundState != prevRoundState) {
        setSelectedLetterIds([]);
        setPrevRoundState(roundState);
        onSelectionChange('');
    }

    return (
        <>
            <div className="board flex flex-col mb-6" ref={boardRef}>
                {rows.map((row) =>
                    <div key={row} className="board-row flex justify-center">
                        {rows.map(col => {
                            const i = (boardWidth * row) + col;
                            const letterBlock = boardConfig[i]?.letterBlock;
                            if (letterBlock != undefined) {
                                return (
                                    <LetterBlock key={letterBlock.id.toString() + ":" + letterBlock.numTimesRolled.toString()}
                                                 id={letterBlock.id} letters={letterBlock.letters}
                                                 onPointerDown={handleSelectionStarted} onPointerUp={handleSelectionFinished}
                                                 onPointerEnter={handleLetterBlockEnter}
                                                 isSelected={selectedLetterIds.includes(letterBlock.id)}
                                                 wordSubmissionState={wordSubmissionState}
                                                 numTimesRolled={letterBlock.numTimesRolled}
                                                 isSelectionDisabled={isSelectionDisabled}
                                    />
                                )
                            }

                        })}
                    </div>
                )}

            </div>
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

function getNeighbors(cellId: number) {
    if (cellId < 0 || cellId >= neighborMap.length) throw new Error('Letter block index out of bounds');
    return neighborMap[cellId];
}