import { h, Component } from 'preact';

export type Props = {
  className?: string;
  value: boolean;
  onChange(value: boolean): void;
};

export class Toggle extends Component<Props, {}> {
  private toggleChange = () => {
    this.props.onChange(!this.props.value);
  };

  render() {
    const { className, value, children } = this.props;

    return (
      <div className={`toggle ${className || ''} ${value ? 'checked' : ''}`} onClick={this.toggleChange}>
        {children}
      </div>
    );
  }
}
