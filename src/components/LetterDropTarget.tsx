import { forwardRef, useEffect, useRef } from "react";
import { DropTargetMonitor, useDrop } from "react-dnd";
import { LetterDieSchema } from "~/server/diceManager";
import { DraggedLetter } from "./LetterBlock";
import { SwappedLetterState } from "./Types.tsx";
import {clsx} from "clsx";

interface LetterDropTargetType {
    cellId: number,
    onHover: (fromCell: number, toCell: number) => void,
    onDrop: (cell: number, letterBlock: LetterDieSchema) => void,
    swappedLetterState: SwappedLetterState | undefined,
    isDragging: boolean,
}

const LetterDropTarget = forwardRef<HTMLDivElement, LetterDropTargetType>(
    ({ cellId, onHover, onDrop, swappedLetterState, isDragging }, ref) => {
        // const outerRef = useForwardedRef(ref);
        const divRef = useRef(null);

        // for forwarding ref
        useEffect(() => {
            if (!ref) return;
            if (typeof ref === "function") {
                ref(divRef.current);
            } else {
                ref.current = divRef.current;
            }
        }, [ref]);

        const [collectedProps, dropRef] = useDrop(() => {
            return {
                accept: 'letter',
                hover: hover,
                drop: drop,
                collect: (monitor) => ({
                    isOver: !!monitor.isOver(),
                })
            }
        }, [swappedLetterState, isDragging]);

        function hover(item: DraggedLetter, monitor: DropTargetMonitor) {
            onHover(cellId, item.currCell);
        }

        function drop(item: DraggedLetter) {
            const letter = { letters: item.letters, id: item.id } as LetterDieSchema; // TODO: why is this asserted?
            onDrop(cellId, letter);
        }

        return (
            <div /*ref={dropRef}*/ id={`letter-drop-target-${cellId.toString()}`}
                style={{
                    width: '50px', height: '50px'
                }}
                className={clsx(
                    'm-2',
                    isDragging ? 'z-10' : '',
                    'letter-drop-target',
                    collectedProps.isOver ? 'bg-slate-500 && opacity-25' : ''
                )}>
                <div ref={divRef} className={`h-full`} />
            </div>
        );
    }
);

LetterDropTarget.displayName = 'LetterDropTarget';
export default LetterDropTarget;