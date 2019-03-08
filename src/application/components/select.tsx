import { h, Component } from 'preact';

export type Props<T extends string> = {
  options: T[];
  className?: string;
  value: T;
  onChange(value: T): void;
};

export class Select<T extends string> extends Component<Props<T>, {}> {
  private select!: HTMLSelectElement;

  private handleChange = () => {
    const i = this.props.options.findIndex(o => o == this.props.value);
    const next = this.props.options[(i + 1) % this.props.options.length];
    this.props.onChange(next);
  };

  render() {
    const { className, options, value, onChange, children } = this.props;

    return (
      <div className={`select ${className || ''}`} onClick={this.handleChange}>
        {children}
        <div className="select-current">
          {value}
        </div>
      </div>
    );
  }
}
