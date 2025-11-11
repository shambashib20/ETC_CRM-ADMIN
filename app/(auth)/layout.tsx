import React, { ReactElement } from "react";

function AuthLayout({ children }: { children: ReactElement }) {
  return <div className="auth_layout">{children}</div>;
}

export default AuthLayout;
