import { h, render } from 'preact';
import { Application } from './application';

function main(container: HTMLElement): void {
  render(<Application />, container);
}

export = main;
