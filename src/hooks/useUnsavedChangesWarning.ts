import { useContext, useEffect } from "react";
import {
  UNSAFE_NavigationContext,
  To,
  NavigateOptions,
} from "react-router-dom";

export function useUnsavedChangesWarning(when: boolean) {
  const navigator = useContext(UNSAFE_NavigationContext).navigator;

  useEffect(() => {
    if (!when) return;

    const originalPush = navigator.push;

    navigator.push = (
      to: To,
      options?: NavigateOptions
    ) => {
      const ok = window.confirm(
        "You have unsaved data. Are you sure you want to leave?"
      );

      if (ok) {
        originalPush(to, options);
      }
    };

    return () => {
      navigator.push = originalPush;
    };
  }, [when, navigator]);
}
