import { h, Component } from 'preact';

export type Props = {
  range: [number, number, number];
  className?: string;
  value: number;
  onChange(value: number): void;
};

export class Slider extends Component<Props, { isActive: boolean }> {
  private container!: HTMLElement;

  constructor(props: Props) {
    super(props);
    this.state = { isActive: false };
  }

  componentDidMount() {
    this.container.addEventListener('mousedown', this.handleSliderMoveStart);
  }

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.handleSliderMove);
    document.removeEventListener('mouseup', this.handleSliderMoveEnd);
    this.container.removeEventListener('mousedown', this.handleSliderMoveStart);
  }

  private handleSliderMoveStart = (ev: MouseEvent) => {
    document.addEventListener('mousemove', this.handleSliderMove);
    document.addEventListener('mouseup', this.handleSliderMoveEnd);

    this.setState({ isActive: true });
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

    this.setState({ isActive: false });
  };

  render() {
    const { className, range: [min, max, step], value, children } = this.props;
    const width = ((value - min) / (max - min) * 100) + '%';
    const number = String(value).replace(/(\.[0-9]*?)0{4,}[0-9]$/, '$1');

    return (
      <div className={`slider ${className || ''}`} ref={d => this.container = d}>
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
}
