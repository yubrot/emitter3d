import { h, Component } from 'preact';

export type Props = {
  initiallyOpened?: boolean;
  className?: string;
  header: any;
};

type State = {
  isOpened: boolean;
};

export class Accordion extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { isOpened: props.initiallyOpened || false };
  }

  private toggleOpen = () => {
    this.setState({ isOpened: !this.state.isOpened });
  };

  render() {
    const { header, className, children } = this.props;
    const { isOpened } = this.state;

    return (
      <div className={`accordion ${className || ''} ${isOpened ? 'opened' : ''}`}>
        <div className="accordion-header" onClick={this.toggleOpen}>
          {header}
        </div>
        <div className="accordion-content">
          {children}
        </div>
      </div>
    );
  }
}
