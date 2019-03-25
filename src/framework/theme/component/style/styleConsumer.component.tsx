import React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { ThemeStyleType } from 'eva/packages/types';
import { MappingContext } from '../mapping';
import { ThemeContext } from '../theme';
import { StyleConsumerService } from '../../service/style';
import {
  Interaction,
  ThemeType,
  StyleType,
} from '../../type';

export interface Props {
  appearance?: string;
  theme?: ThemeType;
  themedStyle?: StyleType;
  dispatch?: (interaction: Interaction[]) => void;
}

interface PrivateProps<T> {
  forwardedRef?: React.RefObject<T>;
}

interface State {
  interaction: Interaction[];
}

export interface Context {
  style: ThemeStyleType;
  theme: ThemeType;
}

export const styled = <P extends object>(Component: React.ComponentClass<P>) => {

  type WrappingProps = PrivateProps<WrappedElementInstance> & WrappedProps;
  type WrappedProps = P & Props;
  type WrappingElement = React.ReactElement<WrappingProps>;
  type WrappedElement = React.ReactElement<WrappedProps>;
  type WrappedElementInstance = React.ReactInstance;

  class Wrapper extends React.Component<WrappingProps, State> {

    public state: State = {
      interaction: [],
    };

    private init: boolean = false;

    // Yes. This is not static because it is calculated once we got some meta from style context.
    private defaultProps: Props;
    private service: StyleConsumerService;

    private onInit = (context: Context) => {
      const displayName: string = Component.displayName || Component.name;

      this.service = new StyleConsumerService(displayName, context);
      this.defaultProps = this.service.createDefaultProps();

      this.init = true;
    };

    private onDispatch = (interaction: Interaction[]) => {
      this.setState({ interaction });
    };

    private withStyledProps = (source: P, context: Context): WrappedProps => {
      const { interaction } = this.state;

      const props: WrappingProps = { ...this.defaultProps, ...source };

      return this.service.withStyledProps(props, context, interaction);
    };

    private renderWrappedElement = (context: Context): WrappedElement => {
      if (!this.init) {
        this.onInit(context);
      }

      const { forwardedRef, ...restProps } = this.props;
      const props: P & Props = this.withStyledProps(restProps as P, context);

      return (
        <Component
          {...props}
          ref={forwardedRef}
          dispatch={this.onDispatch}
        />
      );
    };

    public render(): React.ReactNode {
      const StyledElement = this.renderWrappedElement;

      return (
        <MappingContext.Consumer>{(styles: ThemeStyleType): WrappedElement => (
          <ThemeContext.Consumer>{(theme: ThemeType): WrappedElement => (
            <StyledElement style={styles} theme={theme}/>
          )}</ThemeContext.Consumer>
        )}</MappingContext.Consumer>
      );
    }
  }

  const WrappingElement = (props: WrappingProps, ref: WrappedElementInstance): WrappingElement => {
    return (
      <Wrapper
        {...props}
        forwardedRef={ref}
      />
    );
  };

  const StyledComponent = React.forwardRef<WrappedElementInstance, WrappingProps>(WrappingElement);

  StyledComponent.displayName = Component.displayName || Component.name;
  hoistNonReactStatics(StyledComponent, Component);

  return StyledComponent;
};