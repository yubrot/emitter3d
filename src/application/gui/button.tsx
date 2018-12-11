import { h, Component } from 'preact';

export type Props = {
  className?: string;
  onClick(): void;
};

export class Button extends Component<Props, {}> {
  private handleClick = (ev: MouseEvent) => {
    this.props.onClick();
  };

  render() {
    const { className, children } = this.props;
    return (
      <button className={`button ${className || ''}`} onClick={this.handleClick}>
        {children}
      </button>
    );
  }
}

