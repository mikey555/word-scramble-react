import { api } from "~/utils/api";
import { Block } from "@mui/icons-material";
import { LetterBlock } from "./wordScramble";
import { boggleDice } from "~/server/diceManager";
import { useContext, useEffect, useRef, useState } from "react";
import useDrag from "./useDrag";
import { useUserIdContext } from "./useUserIdContext";

interface BoardProps {
    onSubmitWord: (arg0: number[]) => void,
    config: string
}

const boardWidth = Math.sqrt(boggleDice.length);
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

export default function Board({config, onSubmitWord}: BoardProps) {
    
    const letterBlocks = [...config];
    const [selectedLetters, setSelectedLetters] = useState<number[]>([]);
    const [isPointerDown, setIsPointerDown] = useState<boolean>(false);
    const [pointerOver, setPointerOver] = useState<number | string>();
    const [lastSubmittedLetters, setLastSubmittedLetters] = useState<number[]>();

    
    const userId = useUserIdContext();

    const handlePointerDown = (e: PointerEvent, i?: number) => {
        setIsPointerDown(true);
        // console.log("pointerDown: " + [i]);
        if (i != undefined) {
            setSelectedLetters([i]);
            // console.log("selected: " + [i]);
        }
    }

    const handlePointerOver = (e: PointerEvent, i?: number) => {
        
        // console.log(`isPointerDown: ${isPointerDown}`);
        if (!isPointerDown || i == undefined || selectedLetters.includes(i)) return;
        const lastBlockSelected = selectedLetters.slice(-1)[0];
        if (lastBlockSelected != undefined) {
            const isNeighbor = getNeighbors(lastBlockSelected)?.includes(i);
            if (!isNeighbor) return;
        }
        
        setPointerOver(i);
        setSelectedLetters([...selectedLetters, i]);
        // console.log(`selected: ${blocksSelected.toString()}, ${[i].toString()}`);
    }

    const handlePointerLeave = (e: PointerEvent, i: number) => {
        
    }


    const handlePointerUp = (e: PointerEvent, i?: number) => {
        
        setIsPointerDown(false);
        onSubmitWord(selectedLetters);
        setSelectedLetters([]);
        // const msg = i == undefined ? "over window" : "over " + i;
        // console.log("selected: none. " + msg);
        
    }

    
    const windowRef = useRef<EventTarget>(window);
    useDrag(windowRef, [isPointerDown, selectedLetters], {
        onPointerUp: handlePointerUp
    });



    

    return (
        <div className="board">
            {rows.map((row) => {
                return (
                    <div key={row} className="board-row flex">
                    {rows.map(col => {
                        const i = boardWidth * row + col;
                        const letter = letterBlocks[i];

                        if (letter != undefined)
                            return <LetterBlock id={i} isSelected={selectedLetters.includes(i)} letter={letter}
                                key={`{row}-${col}`}
                                onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}
                                onPointerOver={handlePointerOver} onPointerLeave={handlePointerLeave}
                                isPointerDown={isPointerDown} isPointerOver={pointerOver === i}
                                blocksSelected={selectedLetters}
                            />
                    })}
                    </div>
                )
            })}

            
        </div>);
}
