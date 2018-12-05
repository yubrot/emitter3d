import { h, Component } from 'preact';

export type Props = {
  className?: string;
  text: string;
  onClick(): void;
};

export class Button extends Component<Props, {}> {
  private handleClick = (ev: MouseEvent) => {
    this.props.onClick();
  };

  render() {
    const { text, className } = this.props;
    return (
      <input
        type="button"
        className={`button ${className || ''}`}
        value={text}
        onClick={this.handleClick}
      />
    );
  }
}

