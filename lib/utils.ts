import { Result } from "@/types/type";

export const splitText = (text: string | null) => {
  const result: Result[] = [];

  [...text!].map((element) => {
    result.push({
      char: element,
      color: "black",
    });
  });

  return result;
};

export const formatTimer = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};
