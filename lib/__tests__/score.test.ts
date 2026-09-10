import { describe, expect, it } from "vitest";
import { scoreRace } from "../score";
describe("ScoreRace", () => {
  const exampleText = "This is example race text"; //25

  it("Scores a race with all correct typed characters", () => {
    const typedText = "This is example race text";
    const { accuracy, wpm, correctChars } = scoreRace(
      exampleText,
      typedText,
      5000,
    );

    expect(accuracy).toBe(100);
    //  formula 25 / 5 / (5000 / 60000) = 60
    expect(wpm).toBe(60);
    expect(correctChars).toBe(25);
  });

  it("Scores a race with 5 wrong typed characters", () => {
    const typedText = "Tsis ss sxample sace sext"; // 5 wrong chars

    const { correctChars, wpm, accuracy } = scoreRace(
      exampleText,
      typedText,
      5000,
    );

    expect(correctChars).toBe(20);
    expect(wpm).toBe(48);
    expect(accuracy).toBe(80);
  });

  it("Scores a shifted attempt as zero (scoring is strictly position-based)", () => {
    const typedText = "his is example race text";

    const { correctChars, wpm, accuracy } = scoreRace(
      exampleText,
      typedText,
      5000,
    );

    expect(correctChars).toBe(0);
    expect(wpm).toBe(0);
    expect(accuracy).toBe(0);
  });
});
