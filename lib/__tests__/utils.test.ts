import { describe, expect, it } from "vitest";
import { formatTimer } from "../utils";
describe("formatTimer", () => {
  it.each([
    { seconds: 0, expected: "00:00" },
    { seconds: 9, expected: "00:09" },
    { seconds: 59, expected: "00:59" },
  ])(
    "Pads seconds below 60 formatTimer($seconds) makes $expected",
    ({ seconds, expected }) => {
      expect(formatTimer(seconds)).toBe(expected);
    },
  );

  it.each([
    { seconds: 60, expected: "01:00" },
    { seconds: 125, expected: "02:05" },
  ])(
    "Rolls over into minutes at 60 formatTimer($seconds) makes $expected",
    ({ seconds, expected }) => {
      expect(formatTimer(seconds)).toBe(expected);
    },
  );

  it("Formats a full hour as 60:00, no hour field", () => {
    const time = 3600;
    const timer = formatTimer(time);
    expect(timer).toBe("60:00");
  });
});
