"use client";

import { Component, Fragment, type ReactNode } from "react";
import { Button } from "./button";
import { StatusState } from "./status-state";

interface SectionErrorBoundaryProps {
  children: ReactNode | (() => ReactNode);
  title?: string;
}

function SectionContent({ render }: { render: () => ReactNode }) {
  return render();
}

/** Keeps a render failure inside its section; retry remounts only that section. */
export class SectionErrorBoundary extends Component<SectionErrorBoundaryProps, { failed: boolean; attempt: number }> {
  state = { failed: false, attempt: 0 };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <StatusState
          layout="panel"
          variant="destructive"
          title={this.props.title ?? "Unable to display this section"}
          description="Please try again. You can continue using the other sections."
          actions={<Button variant="outline" onClick={() => this.setState(({ attempt }) => ({ failed: false, attempt: attempt + 1 }))}>Try again</Button>}
        />
      );
    }
    return (
      <Fragment key={this.state.attempt}>
        {typeof this.props.children === "function"
          ? <SectionContent render={this.props.children} />
          : this.props.children}
      </Fragment>
    );
  }
}
