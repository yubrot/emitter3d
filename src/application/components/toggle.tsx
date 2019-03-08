import { h, Component } from 'preact';

export type Props = {
  className?: string;
  disabled?: boolean;
  value: boolean;
  onChange(value: boolean): void;
};

export class Toggle extends Component<Props, {}> {
  private toggleChange = () => {
    if (this.props.disabled) return;
    this.props.onChange(!this.props.value);
  };

  render() {
    const { className, disabled, value, children } = this.props;

    return (
      <div className={`toggle ${className || ''} ${disabled ? 'disabled' : ''} ${value ? 'checked' : ''}`} onClick={this.toggleChange}>
        {children}
      </div>
    );
  }
}
