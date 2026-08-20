"use client";
import { formatTimer, splitText } from "@/lib/utils";
import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";


type GameTextAreaProps = {
    raceText: string;
    onProgress: (progress: number) => void;
    onFinish: (typedText: string) => void;
}
export default function GameTextArea({ raceText, onProgress, onFinish }: GameTextAreaProps) {
    const [randomText, setRandomText] = useState(splitText(raceText))
    const [textTypedByUser, setTextTypedByUser] = useState("");
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [cursor, setCursor] = useState<number>(0);
    const [timer, setTimer] = useState<number>(0);
    const [isFocused, setIsFocused] = useState(false);
    const typedRef = useRef<string>("")
    const finishedRef = useRef(false)
    const allCorrect = randomText.every(ch => ch.color !== 'black' && ch.color !== 'red');
    const gameOver = randomText.length > 0 && allCorrect;


    const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const typedChar = e.currentTarget.value.slice(-1);
        const isCorrect = typedChar === randomText[cursor]?.char;

        setRandomText((prev) =>
            prev.map((item, index) =>
                index === cursor
                    ? { ...item, color: isCorrect ? "green" : "red" }
                    : item,
            ),
        );


        setTextTypedByUser("");

        typedRef.current += typedChar

        const idxOfFirstRed = randomText.findIndex(i => i.color === 'red')
        if (idxOfFirstRed !== -1) {
            onProgress(idxOfFirstRed / randomText.length)
            const nextCursor = cursor + 1
            setCursor(nextCursor)
        } else {
            const nextCursor = cursor + 1
            setCursor(nextCursor)
            onProgress(nextCursor / randomText.length)


            if (nextCursor >= randomText.length && !finishedRef.current) {
                finishedRef.current = true
                onFinish(typedRef.current)
            }
        }
    };

    useEffect(() => {
        const id = setInterval(() => {
            if (gameOver) return
            setTimer((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(id);
    }, [gameOver]);


    const focusInput = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        focusInput();

        const handleVisibility = () => {
            if (!document.hidden) focusInput();
        };

        window.addEventListener("focus", focusInput);
        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            window.removeEventListener("focus", focusInput);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [focusInput]);




    const handleKeys = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Backspace") {

            if (typedRef.current)
                typedRef.current = typedRef.current?.slice(0, - 1)



            e.preventDefault();
            setRandomText((prev) =>
                prev.map((item, index) =>
                    index === cursor - 1 ? { ...item, color: "black" } : item,
                ),
            );

            setCursor((prev) => Math.max(0, prev - 1));
        }

    };


    // 1 word ≈ 5 chars; use only correct (green) characters
    const correctChars = randomText.filter((ch) => ch.color === "green").length;
    const wpm = timer === 0 ? 0 : (correctChars / 5) * (60 / timer);

    return (
        <div className="m-auto ">
            <div onClick={focusInput} className="cursor-text">
                <div className="flex justify-between items-center max-w-[700px]">
                    <div>{wpm.toFixed(0)} WPM</div>
                    <div>{formatTimer(timer)}</div>
                </div>
                <div className="text-balance z-0 relative max-w-[700px]">

                    <div className={isFocused ? "-z-10" : "-z-10 blur-sm"}>
                        {[...randomText].map((ch, index) => (
                            <span key={index} style={{
                                color: ch.color
                            }}>{ch.char}</span>
                        ))}
                    </div>

                    {!isFocused && randomText.length > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-sm">
                            Click here to type
                        </div>
                    )}
                </div>
                <textarea
                    ref={inputRef}
                    value={textTypedByUser}
                    onChange={handleInput}
                    className="absolute opacity-0"
                    onKeyDown={handleKeys}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
            </div>
        </div>
    );
}
