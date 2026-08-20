export const data = [
  {
    id: "1",
    text: "The quick brown fox jumps over the lazy dog.",
  },
  {
    id: "2",
    text: "Programming is full of interesting challenges.",
  },
  {
    id: "3",
    text: "Technology moves quickly, so curiosity is one of the most useful.",
  },
];

export const randomRaceText =
  data[Math.floor(Math.random() * data.length)].text;
