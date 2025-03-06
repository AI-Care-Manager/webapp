"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import StoreProvider from "../state/redux";
import { Amplify } from "aws-amplify";

// Configure Amplify
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID!,
      userPoolClientId:
        process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID!,
    },
  },
});

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <StoreProvider>
      <Authenticator.Provider>
        {children}
      </Authenticator.Provider>
    </StoreProvider>
  );
};

export default Providers;
