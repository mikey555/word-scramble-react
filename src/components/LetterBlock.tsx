import {useRef, useState} from "react";
import {WordSubmissionState} from "./Types.tsx";
import {type LetterDieSchema} from "~/server/diceManager.tsx";
import useSelectionDrag from "./useSelectionDrag.tsx";
import clsx from 'clsx';
import {AnimatePresence, easeInOut, motion} from "framer-motion";
import {CONFIRMED_COLOR, IN_PROGRESS_COLOR, VALID_COLOR} from "~/components/Constants.tsx";

export interface LetterBlockProps {
    id: number,
    letters: string;
    isSelected: boolean;
    wordSubmissionState: WordSubmissionState;
    isSelectionDisabled: boolean;

    isPointerDown?: boolean;
    numTimesRolled: number;

    onPointerDown: (e: PointerEvent, i: number) => void;
    onPointerUp: (e: PointerEvent, i: number) => void;
    onPointerEnter: (e: PointerEvent, i: number) => void;


}

export interface DraggedLetter extends LetterDieSchema {
    currCell: number,
}

export function LetterBlock({
    id, letters, isSelected, onPointerDown, onPointerUp, onPointerEnter,
    isPointerDown, numTimesRolled, wordSubmissionState, isSelectionDisabled
}: LetterBlockProps) {
    const eventTargetRef = useRef<HTMLDivElement>(null);
    const [isPointerOver, setIsPointerOver] = useState(false);
    const [prevNumTimesRolled, setPrevNumTimesRolled] = useState(numTimesRolled);
    const [prevLetters, setPrevLetters] = useState(letters); // hang onto prev letters for reroll animation

    // const transformAnimScope = useTransformAnimation(sourceCell, boardDiv, isPointerOver, isSelected, latestMsg);

    const letterToDisplay = prevLetters.at(0)?.toUpperCase().replace('Q', 'Qu');
    const handlePointerUp = (e: PointerEvent) => {
        onPointerUp(e, id);
    };

    const handlePointerDown = (e: PointerEvent) => {
        onPointerDown(e, id);
    };

    const handlePointerEnter = (e: PointerEvent) => {
        onPointerEnter(e, id);
    };

    const handleDrag = (e: PointerEvent) => {
        eventTargetRef.current?.setPointerCapture(e.pointerId);
    };

    useSelectionDrag(eventTargetRef, [isPointerDown && isPointerOver], {
        onPointerDown: handlePointerDown,
        onPointerUp: handlePointerUp,
        onPointerEnter: handlePointerEnter,
        onDrag: handleDrag,
    }, id);

    const style = {
        fontSize: 40,
        boxShadow: isPointerOver ? '2px 2px 5px rgba(0,0,0,0.10)' : '2px 2px 0 rgba(0,0,0,0.10)',
        background: 'white',
    }

    const variants = {
        default: { opacity: 1, scale: 1 },
        hidden: { opacity: 0, scale: 0 },
        selected: { scale: 1.15, backgroundColor: IN_PROGRESS_COLOR },
        submitting: { scale: 1.15, backgroundColor: IN_PROGRESS_COLOR },
        submitted: { scale: 1.15, backgroundColor: VALID_COLOR },
        confirmed: { scale: 1.25, backgroundColor: CONFIRMED_COLOR },
        disabled: { opacity: 1, scale: 1 },
    }

    const transition = {
        duration: 0.2,
        easeInOut
    }

    let animationState = 'default';
    if (prevNumTimesRolled != numTimesRolled) {
        setPrevNumTimesRolled(numTimesRolled);
        animationState = 'hidden';
    }
    else if (isSelected) {
        switch (wordSubmissionState) {
            case WordSubmissionState.NotSubmitted:
                animationState = 'selected';
                break;
            case WordSubmissionState.Submitting:
                animationState = 'submitting';
                break;
            case WordSubmissionState.Submitted:
                animationState = 'submitted';
                break;
            case WordSubmissionState.Confirming:
                animationState = 'submitted';
                break;
            case WordSubmissionState.Confirmed:
                animationState = 'confirmed';
                break;
        }
    } else if (wordSubmissionState === WordSubmissionState.SubmitFailed) {
        animationState = 'default';
    }

    return (
        <AnimatePresence>
            <motion.div id={`letter-block-${id}`} data-letter={prevLetters[0]}
                className={clsx('border letter-block select-none w-[60px] h-[60px] m-1.5 rounded-lg font-bold')}
                variants={variants} animate={animationState} exit={{scale: 0}} initial={{scale: 0}}
                transition={transition} style={style} //ref={transformAnimScope}
            >
                <div ref={eventTargetRef} className={clsx(`w-full h-full flex justify-center items-center`,
                    letterToDisplay && letterToDisplay?.length > 1 && 'text-3xl' )}>
                    {letterToDisplay}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

