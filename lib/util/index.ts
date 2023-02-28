import { max } from "d3";

export const makeDisplayNum = (numbers: number[]) => {
  if (max(numbers)! >= 100000) {
    let checkIndex = 10;
    while (true) {
      let count = 0;
      for (const number of numbers) {
        if (number % checkIndex == 0) {
          count++;
        }
      }
      if (count == numbers.length) {
        checkIndex *= 10;
      } else {
        break;
      }
    }
    checkIndex = checkIndex / 10;
    switch (checkIndex) {
      case 1:
        return ["", checkIndex];
      case 10:
        return ["십", checkIndex];
      case 100:
        return ["백", checkIndex];
      case 1000:
        return ["천", checkIndex];
      case 10000:
        return ["만", checkIndex];
      case 100000:
        return ["십만", checkIndex];
      case 1000000:
        return ["백만", checkIndex];
      case 10000000:
        return ["천만", checkIndex];
      case 100000000:
        return ["억", checkIndex];
      case 1000000000:
        return ["십억", checkIndex];
      case 10000000000:
        return ["백억", checkIndex];
      case 100000000000:
        return ["천억", checkIndex];
      case 1000000000000:
        return ["조", checkIndex];
      default:
        return ["", checkIndex];
    }
  } else {
    return ["", 1];
  }
};
