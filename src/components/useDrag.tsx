import { useState, useEffect, RefObject } from 'react';
import { isPointerEvent } from '~/utils/helpers';


interface DragOptions {
    onPointerDown?: (e: PointerEvent) => void,
    onPointerUp?: (e: PointerEvent) => void,
    onPointerMove?: (e: PointerEvent) => void,
    onPointerOver?: (e: PointerEvent) => void,
    onPointerEnter?: (e: PointerEvent) => void,
    onPointerLeave?: (e: PointerEvent) => void,
    onDrag?: (e: PointerEvent) => void,
    dragMode: DragMode,
}

export type DragMode = 'DragToSelect' | 'DragNDrop';

// should accept ref to window and HTMLElement
// https://javascript.plainenglish.io/how-to-make-a-simple-custom-usedrag-react-hook-6b606d45d353
export const useCustomDrag = (ref: RefObject<HTMLDivElement | EventTarget>, deps: any[], options: DragOptions, blockId: number | string) => {
    const {
        onPointerDown = (e: PointerEvent) => undefined,
        onPointerUp = (e: PointerEvent) => undefined,
        onPointerEnter = (e: PointerEvent) => undefined,
        onDrag = (e: PointerEvent) => undefined,

    } = options;

    const [isDragging, setIsDragging] = useState(false);

    const handlePointerDown = (e: Event) => {

        e.stopPropagation();
        if (!isPointerEvent(e)) throw new Error('Event is not a PointerEvent');
        // if (e.target && isHTMLDivElement(e.target)) e.target.releasePointerCapture(e.pointerId);

        // console.log(`pointerdown: ${blockId}`)
        switch (options.dragMode) {
            case 'DragToSelect':

                break;
            case 'DragNDrop':

                setIsDragging(true);
                break;
            default:
                break;
        }


        onPointerDown(e);
    };

    const handlePointerUp = (e: Event) => {
        e.stopPropagation();
        if (!isPointerEvent(e)) throw new Error('Event is not a PointerEvent');


        // console.log(`pointerup: ${blockId}`)
        switch (options.dragMode) {
            case 'DragToSelect':


                break;
            case 'DragNDrop':

                setIsDragging(false);
                break;
            default:
                break;
        }
        onPointerUp(e);
    };

    const handlePointerEnter = (e: Event) => {
        // console.log(`pointerenter: ${blockId}`);

        // e.stopPropagation();
        if (!isPointerEvent(e)) throw new Error('Event is not a PointerEvent');

        onPointerEnter(e);

    }

    const handlePointerMove = (e: Event) => {
        // console.log(`pointermove: ${blockId}`)
        if (options.dragMode !== 'DragNDrop') return;
        if (!isPointerEvent(e)) throw new Error('Event is not a PointerEvent');

        if (isDragging) {


            onDrag(e);
        }
    };

    const handleGotPointerCapture = (e: Event) => {
        if (!isPointerEvent(e)) throw new Error('Event is not a PointerEvent');

        console.log(`gotPointerCapture pointerId: ${e.pointerId}`)
        console.log(`got pointer capture: ${blockId}`)

        // e.target?.addEventListener('pointermove', handlePointerMove);
        // e.target?.addEventListener('pointerenter', handlePointerEnter);
    }

    const handleLostPointerCapture = (e: Event) => {
        console.log(`lost pointer capture: ${blockId}`)
        if (!isPointerEvent(e)) throw new Error('Event is not a PointerEvent');
        // e.target?.removeEventListener('pointermove', handlePointerMove);
        // e.target?.removeEventListener('pointerenter', handlePointerEnter);
    }


    useEffect(() => {
        const element = ref.current;
        if (element) {
            // console.log(`${blockId}: ${deps}`);
            element.addEventListener('pointerdown', handlePointerDown);
            element.addEventListener('pointerup', handlePointerUp);
            element.addEventListener('pointerenter', handlePointerEnter);
            element.addEventListener('pointermove', handlePointerMove);
           /*  if (isHTMLDivElement(element)) {
                element.addEventListener('gotpointercapture', handleGotPointerCapture);
                element.addEventListener('lostpointercapture', handleLostPointerCapture);
            } */

            return () => {
                element.removeEventListener('pointerdown', handlePointerDown);
                element.removeEventListener('pointerup', handlePointerUp);
                element.removeEventListener('pointerenter', handlePointerEnter);
                element.removeEventListener('pointermove', handlePointerMove);
                /* if (isHTMLDivElement(element)) {
                    element.removeEventListener('gotpointercapture', handleGotPointerCapture);
                    element.removeEventListener('lostpointercapture', handleLostPointerCapture);
                } */
            };
        }
    }); // TODO: bring back deps to improve performance

    return { isDragging };
}

export default useCustomDrag;