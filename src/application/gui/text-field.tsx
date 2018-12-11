import { h, Component } from 'preact';

export type Props = {
  className?: string;
  value: string;
  onChange(value: string): void;
  multiline?: boolean;
};

export class TextField extends Component<Props, {}> {
  private handleChange = (ev: Event) => {
    this.props.onChange((ev.target as any).value);
  };

  render() {
    const { className, value, onChange, multiline } = this.props;
    return multiline ? (
      <textarea
        className={`text-field multiline ${className || ''}`}
        value={value}
        onInput={this.handleChange}
      />
    ) : (
      <input
        type="text"
        className={`text-field ${className || ''}`}
        value={value}
        onInput={this.handleChange}
      />
    );
  }
}

