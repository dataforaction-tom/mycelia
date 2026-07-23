import { Suspense } from "react";
import { ConfirmSignInClient } from "./confirm-client";

export const metadata = {
  title: "Confirm sign in",
};

export default function ConfirmSignInPage() {
  return (
    <Suspense>
      <ConfirmSignInClient />
    </Suspense>
  );
}
