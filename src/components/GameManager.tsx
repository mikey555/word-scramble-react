import {useChannel} from "ably/react";
import {useState} from "react";
import {ablyChannelName} from "~/server/ably/ablyHelpers.ts";
import Board from "./Board.tsx";
import Scoreboard from "./Scoreboard.tsx";
import {
    AblyMessageType,
    type BeginIntermissionMessageData,
    beginIntermissionMsgDataSchema,
    type GameState,
    RoundState,
    type Score,
    type SimplePlayerInfo,
    type WordSubmissionResponse,
    WordSubmissionState
} from "./Types.tsx";
import {useUserIdContext} from "./hooks/useUserIdContext";
import {RulesDialog} from "./RulesDialog.tsx";
import {NUM_ROUNDS_PER_GAME} from "./Constants.tsx";
import {api} from "~/utils/api.ts";
import {validateSchema} from "~/utils/validator.tsx";
import {LeaveRoomConfirmationDialog} from "~/components/LeaveRoomConfirmationDialog.tsx";

interface GameManagerProps {
    gameId: string,
    roomCode: string,
    playersOrdered: SimplePlayerInfo[],
    onLeaveRoom: () => void,
    initGameState: GameState,
    initRoundState: RoundState,
    gameTimeStarted: number,
    initTimeLastRoundOver: number | null,
    initScores: Score[]
}

export default function GameManager({ gameId, roomCode, playersOrdered,
                                    onLeaveRoom, initGameState, initRoundState, initScores,
                                    gameTimeStarted, initTimeLastRoundOver}: GameManagerProps) {
    const userId = useUserIdContext();
    const [scores, setScores] = useState<Score[]>(initScores);
    const channelName = ablyChannelName(roomCode);
    const [latestWordSubmission, setLatestWordSubmission] = useState<WordSubmissionResponse | null>();
    const [gameState, setGameState] = useState<GameState>(initGameState);
    const [roundState, setRoundState] = useState<RoundState>(initRoundState);
    const [latestBeginIntermissionMessage, setLatestBeginIntermissionMessage] = useState<BeginIntermissionMessageData | null>();

    const [submittedCellIds, setSubmittedCellIds] = useState<number[]>([]);
    const [wordSubmissionState, setWordSubmissionState] = useState<WordSubmissionState>(WordSubmissionState.NotSubmitted);
    const [wordSelectionSoFar, setWordSelectionSoFar] = useState('');
    const [timeLastRoundOver, setTimeLastRoundOver] = useState<number|null>(initTimeLastRoundOver);

    const submitWordMutation = api.gameplay.submitWord.useMutation({
        onMutate: () => {
            setWordSubmissionState(WordSubmissionState.Submitting)
        },
        onSuccess: (data: WordSubmissionResponse) => {
            if (data.isValid) {
                setWordSubmissionState(WordSubmissionState.Submitted);
                setSubmittedCellIds(data.cellIds);
            } else {
                setWordSubmissionState(WordSubmissionState.SubmitFailed);
            }
            setLatestWordSubmission(data);
            setWordSelectionSoFar('');
        },
        onError: (e) => {
            // TODO: handle
        },
    });

    const confirmWordMutation = api.gameplay.confirmWord.useMutation({
        onMutate: () => {
            setWordSubmissionState(WordSubmissionState.Confirming)
        },
        onSuccess: (data) => {
            setWordSubmissionState(WordSubmissionState.Confirmed);
            if (data.areAllWordsConfirmed) {
                triggerEndOfRoundAndPublishResultsMutation.mutate({
                    round: data.round,
                    roomCode: roomCode,
                    userId: userId,
                    gameId: data.gameId,
                })
            }
        },
        onError: () => {
            setWordSubmissionState(WordSubmissionState.Submitted);
        },
    });

    const triggerEndOfRoundAndPublishResultsMutation = api.gameplay.triggerEndOfRoundAndPublishResults.useMutation({
        onError: (e) => {
            // TODO: handle
        }
    });

    const gameInfoQuery = api.lobby.fetchGameInfo.useQuery({ roomCode: roomCode, userId: userId}); // TODO: I imagine this is being called way too often

    useChannel(channelName, AblyMessageType.BeginIntermission, (message) => {
        const result = validateSchema({dto: message.data, schemaName: 'beginIntermissionMsgDataSchema', schema: beginIntermissionMsgDataSchema});
        setLatestBeginIntermissionMessage(result);
        setLatestWordSubmission(null);
        setTimeLastRoundOver(result.timeLastRoundOver);
        setScores(result.scores);
        setRoundState(RoundState.Intermission);
    })
    function handleBeginWordSelection() {
        let nextState;
        if (latestBeginIntermissionMessage != undefined
            && gameInfoQuery.dataUpdatedAt < latestBeginIntermissionMessage.dateTimePublished
        ) {
            nextState = latestBeginIntermissionMessage.state;
        } else if (gameInfoQuery.data != undefined) {
            nextState = gameInfoQuery.data.state;
        } else {
            throw new Error('no game state found')
        }
        setGameState(nextState);
        setWordSubmissionState(WordSubmissionState.NotSubmitted);
        if (nextState.isGameFinished) {
            setRoundState(RoundState.GameFinished);
        } else {
            setRoundState(RoundState.WordSelection);
        }
        setLatestBeginIntermissionMessage(null);
    }

    function handleEndOfRoundTimeUp() {
        triggerEndOfRoundAndPublishResultsMutation.mutate({
            round: gameState.round,
            roomCode: roomCode,
            userId: userId,
            gameId: gameId,
        })
    }

    function handleSubmitWord(cellIds: number[]) {
        if (wordSubmissionState === WordSubmissionState.NotSubmitted || wordSubmissionState === WordSubmissionState.SubmitFailed ) {
        submitWordMutation.mutate({
            userId: userId,
            gameId: gameId,
            roomCode: roomCode,
            cellIds: cellIds,
        })}
    }

    function handleReselecting() {
        setWordSubmissionState(WordSubmissionState.NotSubmitted);
        setLatestWordSubmission(null)
    }

    function handleConfirmWord() {
        if (submittedCellIds.length > 0 && wordSubmissionState == WordSubmissionState.Submitted) {
            confirmWordMutation.mutate({
                userId: userId,
                gameId: gameId,
                roomCode: roomCode,
                cellIds: submittedCellIds,
            })
        }
    }

    function handleSelectionChange(selectionSoFar: string) {
        setWordSelectionSoFar(selectionSoFar);
    }

    return (
        <div className="max-w-lg p-6 space-y-6">
            <div className="flex space-x-1 mb-6 justify-center">
                <LeaveRoomConfirmationDialog onClick={onLeaveRoom} roomCode={roomCode}/>
                <RulesDialog/>
            </div>
            {roundState == RoundState.GameFinished ?
                <h1 className={'text-3xl'}>Game Over!</h1> :
                <div className={"green-200"}>{`Round ${gameState.round + 1}/${NUM_ROUNDS_PER_GAME}`}</div>


            }
            {roundState != RoundState.GameFinished &&
                <Board boardConfig={gameState.board} roomCode={roomCode} onSubmitWord={handleSubmitWord}
                       wordSubmissionState={wordSubmissionState} onReselecting={handleReselecting}
                       roundState={roundState} onSelectionChange={handleSelectionChange}/>
            }
            <Scoreboard playersOrdered={playersOrdered} scores={scores} gameState={gameState} roundState={roundState}
                        latestWordSubmission={latestWordSubmission}
                        latestBeginIntermissionMessage={latestBeginIntermissionMessage}
                        onConfirmWord={handleConfirmWord} wordSubmissionState={wordSubmissionState}
                        timeLastRoundOver={timeLastRoundOver} gameTimeStarted={gameTimeStarted}
                        onBeginWordSelection={handleBeginWordSelection}
                        onEndOfRoundTimeUp={handleEndOfRoundTimeUp} wordSelectionSoFar={wordSelectionSoFar}
            />
        </div>
    )


}