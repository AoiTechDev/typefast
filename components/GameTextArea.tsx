"use client";
import { FOG_CHARS_AHEAD, hasModifier, MODIFIERS, type ModifierId } from "@/lib/modifiers";
import { formatTimer, splitText } from "@/lib/utils";
import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";

type GameTextAreaProps = {
    raceText: string;
    modifiers: readonly ModifierId[];
    onProgress: (progress: number, wpm: number) => void;
    onFinish: (typedText: string) => void;
}

const LEGEND = [
    { label: "Untyped", className: "text-dim" },
    { label: "Correct", className: "text-ink" },
    { label: "Wrong", className: "bg-hot text-panel" },
    { label: "Cursor", className: "bg-lime text-ink" },
];

export default function GameTextArea({ raceText, modifiers, onProgress, onFinish }: GameTextAreaProps) {
    const [randomText, setRandomText] = useState(splitText(raceText))
    const [textTypedByUser, setTextTypedByUser] = useState("");
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [cursor, setCursor] = useState<number>(0);
    const [timer, setTimer] = useState<number>(0);
    const [isFocused, setIsFocused] = useState(false);
    const typedRef = useRef<string>("")
    const finishedRef = useRef(false)
    const timerRef = useRef(0)
    const attemptedRef = useRef<Set<number>>(new Set())

    const stopOnError = hasModifier(modifiers, "stop-on-error");
    const noBackspace = hasModifier(modifiers, "no-backspace");
    const fog = hasModifier(modifiers, "fog");
    const mirror = hasModifier(modifiers, "mirror");
    const canRewind = !stopOnError && !noBackspace;

    const correctChars = randomText.filter((ch) => ch.color === "green").length;
    const wrongChars = randomText.filter((ch) => ch.color === "red").length;
    const typedChars = correctChars + wrongChars;
    const wpm = timer === 0 ? 0 : (correctChars / 5) * (60 / timer);
    const accuracy = typedChars === 0 ? 100 : Math.round((correctChars / typedChars) * 100);
    const gameOver = randomText.length > 0 && cursor >= randomText.length;

    const reportProgress = (next: typeof randomText, nextCursor: number) => {
        const correct = next.filter((ch) => ch.color === "green").length
        const firstWrong = next.findIndex((item) => item.color === "red")
        const reached = canRewind && firstWrong !== -1 ? firstWrong : nextCursor
        const elapsed = timerRef.current
        const liveWpm = elapsed === 0 ? 0 : (correct / 5) * (60 / elapsed)
        onProgress(next.length === 0 ? 0 : reached / next.length, liveWpm)
    }

    const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
        if (gameOver) return;

        const typedChar = e.currentTarget.value.slice(-1);
        const isCorrect = typedChar === randomText[cursor]?.char;
        const wasWrong = randomText[cursor]?.color === "red";

        setTextTypedByUser("");

        if (!attemptedRef.current.has(cursor)) {
            attemptedRef.current.add(cursor);
            typedRef.current += typedChar;
        }

        const next = randomText.map((item, index) =>
            index === cursor
                ? { ...item, color: isCorrect && !wasWrong ? ("green" as const) : ("red" as const) }
                : item,
        );

        setRandomText(next);

        if (stopOnError && !isCorrect) {
            reportProgress(next, cursor);
            return;
        }

        const nextCursor = cursor + 1;
        setCursor(nextCursor);
        reportProgress(next, nextCursor);

        if (nextCursor >= next.length && !finishedRef.current) {
            finishedRef.current = true;
            onFinish(typedRef.current);
        }
    };

    const handleKeys = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key !== "Backspace") return;

        e.preventDefault();

        if (!canRewind || cursor === 0) return;

        attemptedRef.current.delete(cursor - 1);
        typedRef.current = typedRef.current.slice(0, -1);

        const next = randomText.map((item, index) =>
            index === cursor - 1 ? { ...item, color: "black" as const } : item,
        );

        setRandomText(next);

        const nextCursor = cursor - 1;
        setCursor(nextCursor);
        reportProgress(next, nextCursor);
    };

    useEffect(() => {
        const id = setInterval(() => {
            if (gameOver) return
            setTimer((prev) => {
                const next = prev + 1
                timerRef.current = next
                return next
            });
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

    const charClassName = (color: string, index: number) => {
        if (fog && index > cursor + FOG_CHARS_AHEAD) {
            return "text-dim blur-[5px]";
        }

        if (index === cursor) return "bg-lime text-ink";
        if (color === "green") return "text-ink";
        if (color === "red") return "bg-hot text-panel";

        return "text-dim";
    };

    return (
        <div className="mx-auto max-w-3xl">
            <div className="grid grid-cols-3 gap-4">
                <div className="border-[4px] border-ink bg-lime px-4 py-3 shadow-[6px_6px_0_0_var(--color-ink)]">
                    <p className="font-mono text-[11px] font-bold tracking-widest uppercase">WPM</p>
                    <p className="text-3xl font-extrabold tabular-nums">{wpm.toFixed(0)}</p>
                </div>
                <div className="border-[4px] border-ink bg-panel px-4 py-3 shadow-[6px_6px_0_0_var(--color-ink)]">
                    <p className="font-mono text-[11px] font-bold tracking-widest text-dim uppercase">
                        Elapsed
                    </p>
                    <p className="text-3xl font-extrabold tabular-nums">{formatTimer(timer)}</p>
                </div>
                <div className="border-[4px] border-ink bg-panel px-4 py-3 shadow-[6px_6px_0_0_var(--color-ink)]">
                    <p className="font-mono text-[11px] font-bold tracking-widest text-dim uppercase">
                        Accuracy
                    </p>
                    <p className="text-3xl font-extrabold tabular-nums">{accuracy}%</p>
                </div>
            </div>

            <div
                onClick={focusInput}
                className="relative mt-6 cursor-text border-[4px] border-ink bg-panel p-7 shadow-[10px_10px_0_0_var(--color-ink)]"
            >
                <p
                    className={`font-mono text-xl leading-[1.9] break-words ${mirror ? "scale-x-[-1]" : ""} ${isFocused ? "" : "blur-[6px] select-none"
                        }`}
                >
                    {randomText.map((ch, index) => (
                        <span key={index} className={charClassName(ch.color, index)}>
                            {ch.char}
                        </span>
                    ))}
                </p>

                {!isFocused && randomText.length > 0 && (
                    <div className="absolute inset-0 grid place-items-center">
                        <span className="border-[4px] border-ink bg-hot px-7 py-4 text-xl font-extrabold tracking-wide text-panel uppercase shadow-[8px_8px_0_0_var(--color-ink)]">
                            Click here to type
                        </span>
                    </div>
                )}

                <textarea
                    ref={inputRef}
                    value={textTypedByUser}
                    onChange={handleInput}
                    className="absolute top-0 left-0 h-full w-full cursor-text opacity-0"
                    onKeyDown={handleKeys}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-5">
                {LEGEND.map((item) => (
                    <span key={item.label} className="flex items-center gap-2">
                        <span className={`px-1 font-mono text-sm ${item.className}`}>n</span>
                        <span className="font-mono text-[11px] font-bold tracking-widest text-dim uppercase">
                            {item.label}
                        </span>
                    </span>
                ))}

                {modifiers.length > 0 && (
                    <span className="ml-auto flex flex-wrap gap-2">
                        {MODIFIERS.filter((modifier) => modifiers.includes(modifier.id)).map((modifier) => (
                            <span
                                key={modifier.id}
                                className="border-[2px] border-ink bg-ink px-2 py-1 font-mono text-[11px] font-bold tracking-widest text-panel uppercase"
                            >
                                {modifier.label}
                            </span>
                        ))}
                    </span>
                )}
            </div>
        </div>
    );
}
