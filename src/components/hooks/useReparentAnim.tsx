import { RefObject, useEffect, useRef, useState } from "react";

type XYPosition = {
    x: number,
    y: number
}

export default function useReparentAnimation(ref: RefObject<HTMLDivElement>, isDragging: boolean, sourceCell: number) {

    const [isRunning, setIsRunning] = useState(false);
    // const [prevRect, setPrevRect] = useState(ref.current?.getBoundingClientRect());
    const prevRect = useRef<DOMRect>();
    const currRect = ref.current?.getBoundingClientRect();


    let delta: { x: number, y: number } | undefined = undefined;
    if (sourceCell === 3) {
        console.log(`currRec: ${currRect}`)
        console.log(`prevRect: ${prevRect}`)
        console.log(`curr, prev left: ${currRect?.left}, ${prevRect.current?.left}`)
        console.log(`curr, prev top: ${currRect?.top}, ${prevRect.current?.top}`)
        console.log(`new cell: ${sourceCell}`)
        console.log(`isDragging: ${isDragging}`)
    }

    if (!isDragging && currRect && prevRect.current
        && currRect?.left != prevRect.current?.left
        && currRect?.top != prevRect.current?.top
        ) {
        // moved!
        console.log(`sourceCell ${sourceCell} moved`)
        delta = {
            x: currRect.x - prevRect.current.x,
            y: currRect.y - prevRect.current.y
        }
    }

    // set ref after first DOM render
    useEffect(() => {
        prevRect.current = ref.current?.getBoundingClientRect();
        // console.log(`Init useEffect for ${sourceCell}:`)
        // console.log(ref.current?.getBoundingClientRect())
        // console.log(`prevRect: ${prevRect}`)
    }, [])

    useEffect(() => {
        // when rect changes, animate it. except when it's being dragged.
        /* const node = ref.current;
        const duration = 1000;
        let startTime: number | null = performance.now();
        let frameId: number | null = null;

        function onFrame(now: number) {
            if (startTime == null) return;
            const timePassed = now - startTime;
            const progress = Math.min(timePassed / duration, 1);
            onProgress(progress);
            if (progress < 1) {
                // We still have more frames to paint
                frameId = requestAnimationFrame(onFrame);
            }
        }

        function onProgress(progress: number) {
            if (node == null) return;
            node.style.opacity = progress;
        }

        function start() {
            onProgress(0);
            startTime = performance.now();
            frameId = requestAnimationFrame(onFrame);
        }

        function stop() {
            if (frameId == null) return;
            cancelAnimationFrame(frameId);
            startTime = null;
            frameId = null;
        }

        start();
        return () => stop(); */


        // console.log(ref.current?.parentElement?.parentElement?.id)

        if (!isRunning && delta) {
            setIsRunning(true);
            console.log(`running reparent animation on ${ref.current?.parentElement?.id}!`)
            // console.log(ref.current?.parentElement)
            setTimeout(() => {
                setIsRunning(false);
                console.log(`stopping reparent animation on ${ref.current?.parentElement?.id}!`)
                // console.log(ref.current?.parentElement);
                prevRect.current = currRect;
            }, 1000);
        }



    }, [delta])
    return isRunning;
}