export const scoreRace = (
  raceText: string,
  typedText: string,
  durationMs: number,
) => {
  let correctChars = 0;

  for (let index = 0; index < raceText.length; index++) {
    if (typedText[index] === raceText[index]) correctChars++;
  }

  const wpm = Math.round(correctChars / 5 / (durationMs / 60000));
  const accuracy = Math.round((correctChars / raceText.length) * 100);

  return { correctChars, wpm, accuracy };
};
