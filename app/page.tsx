"use client";
import { data } from "@/lib/dummy-text";
import { formatTimer, splitText } from "@/lib/utils";
import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

export default function Home() {
  const [randomText, setRandomText] = useState(
    splitText(data[getRandomInt(3)].text),
  );
  const [textTypedByUser, setTextTypedByUser] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [cursor, setCursor] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);

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
    setCursor((prev) => prev + 1);
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    const id = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const handleKeys = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      setRandomText((prev) =>
        prev.map((item, index) =>
          index === cursor - 1 ? { ...item, color: "white" } : item,
        ),
      );
      setCursor((prev) => Math.max(0, prev - 1));
    }
  };

  // 1 word ≈ 5 chars; use only correct (green) characters
  const correctChars = randomText.filter((ch) => ch.color === "green").length;
  const wpm = timer === 0 ? 0 : (correctChars / 5) * (60 / timer);

  return (
    <div className="m-auto">
      <div>
        <div className="flex justify-between items-center max-w-[700px]">
          <div>{wpm.toFixed(0)} WPM</div>
          <div>{formatTimer(timer)}</div>
        </div>
        <div className="text-balance z-0 relative max-w-[700px]">

          <div className="-z-10 ">
            {[...randomText].map((ch, index) => (
              <span key={index} style={{
                color: ch.color
              }}>{ch.char}</span>
            ))}
          </div>
        </div>
        <textarea
          ref={inputRef}
          value={textTypedByUser}
          onChange={handleInput}
          className="opacity-0"
          autoFocus
          onKeyDown={handleKeys}
        />
        <div>{textTypedByUser}</div>
      </div>
    </div>
  );
}
