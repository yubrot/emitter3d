import { h, Component } from 'preact';

export type Props = {
  range: [number, number, number];
  className?: string;
  disabled?: boolean;
  value: number;
  onChange(value: number): void;
};

export class Slider extends Component<Props, {}> {
  private container!: HTMLElement;

  componentDidMount() {
    this.container.addEventListener('mousedown', this.handleSliderMoveStart);
  }

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.handleSliderMove);
    document.removeEventListener('mouseup', this.handleSliderMoveEnd);
    this.container.removeEventListener('mousedown', this.handleSliderMoveStart);
  }

  private handleSliderMoveStart = (ev: MouseEvent) => {
    if (this.props.disabled) return;
    document.addEventListener('mousemove', this.handleSliderMove);
    document.addEventListener('mouseup', this.handleSliderMoveEnd);

    this.handleSliderMove(ev);
  };

  private handleSliderMove = (ev: MouseEvent) => {
    const { left, width } = this.container.getBoundingClientRect();
    const r = Math.min(1, Math.max(0, (ev.clientX - left) / width));

    const { range: [min, max, step] } = this.props;
    const value = min + step * Math.round(r * (max - min) / step);
    this.props.onChange(value);
  };

  private handleSliderMoveEnd = (ev: MouseEvent) => {
    document.removeEventListener('mousemove', this.handleSliderMove);
    document.removeEventListener('mouseup', this.handleSliderMoveEnd);
  };

  render() {
    const { className, disabled, range: [min, max, step], value, children } = this.props;
    const width = ((value - min) / (max - min) * 100) + '%';
    const number = Slider.numberString(value, step);

    return (
      <div className={`slider ${disabled ? 'disabled' : ''} ${className || ''}`} ref={d => this.container = d}>
        <div className="slider-body" style={{ width }} />
        <div className="slider-surface">
          {children}
          <div className="slider-number">
            {number}
          </div>
        </div>
      </div>
    );
  }

  static numberString(value: number, step: number): string {
    let decimal = 0;
    while (step < 1) ++decimal, step *= 10;
    let s = value < 0 ? "-" : "";
    let t = String(Math.round(Math.abs(value) * 10 ** decimal));
    let u = "";
    for (; decimal > 0; --decimal) {
      if (t.length > 1) {
        u = t.substr(t.length - 1) + u;
        t = t.substr(0, t.length - 1);
      } else {
        u = t + u;
        t = "0";
      }
    }
    return s + t + (u == "" ? "" : "." + u);
  }
}
