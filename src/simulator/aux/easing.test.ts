import { Easing } from './easing';

const functions = [
  { name: 'linear', easing: Easing.linear },
  { name: 'ease-in', easing: Easing.easeIn },
  { name: 'ease-out', easing: Easing.easeOut },
  { name: 'ease-in-out', easing: Easing.easeInOut },
];

for (const { name, easing } of functions) {
  test(name, () => {
    for (const [a, r] of [
      [-1, 0],
      [0, 0],
      [1, 1],
      [2, 1],
    ]) {
      expect(easing.at(a)).toEqual(r);
    }

    for (const [a, r] of [
      [-1, 0],
      [0, 0],
      [5, 1],
      [6, 1],
    ]) {
      expect(easing.at(a, 5)).toEqual(r);
    }

    for (const [a, r] of [
      [-1, 0],
      [0, 0],
      [0.01, 1],
      [1, 1],
    ]) {
      expect(easing.at(a, 0)).toEqual(r);
    }

    for (const [a, b, r] of [
      [-1, 0, 0],
      [0, 1, 1],
      [1, 2, 0],
    ]) {
      expect(easing.delta(a, b)).toEqual(r);
    }

    for (const [a, b, r] of [
      [-1, 0, 0],
      [0, 0.01, 1],
      [0.01, 1, 0],
      [-1, -1, 0],
      [0, 0, 0],
      [1, 1, 0],
    ]) {
      expect(easing.delta(a, b, 0)).toEqual(r);
    }

    for (const [a, b, r] of [
      [-1, 0, 0],
      [0, 5, 1],
      [5, 6, 0],
      [0, 0, 0],
      [3, 3, 0],
      [5, 5, 0],
    ]) {
      expect(easing.delta(a, b, 5)).toEqual(r);
    }
  });
}
