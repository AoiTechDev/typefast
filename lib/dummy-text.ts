export const data = [
  {
    id: "1",
    text: "It started as an ordinary Monday morning, but everything changed when the power suddenly went out. The lights flickered twice before the entire building went completely dark. Somewhere down the hallway, someone shouted, “Well, that's probably not a good sign.",
  },
  {
    id: "2",
    text: "Technology has changed the way we communicate, work, and learn. Every day, millions of people write messages, create documents, program software, and share ideas through digital devices. Being able to express yourself quickly and accurately can save time and make everyday tasks much easier.",
  },
  {
    id: "3",
    text: "The ability to remain focused while working under pressure is a skill that improves with experience. Distractions are everywhere, but developing a steady rhythm allows you to concentrate on what matters instead of worrying about how quickly you are progressing.",
  },
];

export const pickRaceText = () =>
  data[Math.floor(Math.random() * data.length)].text;
