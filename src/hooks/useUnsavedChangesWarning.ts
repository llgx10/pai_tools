import { useEffect } from "react";
import { UNSAFE_NavigationContext } from "react-router-dom";
import { useContext } from "react";

export function useUnsavedChangesWarning(when: boolean) {
  const { navigator } = useContext(UNSAFE_NavigationContext);

  useEffect(() => {
    if (!when) return;

    const push = navigator.push;

    navigator.push = (to: import("react-router-dom").To, options?: import("react-router-dom").NavigateOptions) => {
      const confirmLeave = window.confirm(
        "You have unsaved data. Are you sure you want to leave?"
      );
      if (confirmLeave) {
        push(to, options);
      }
    };

    return () => {
      navigator.push = push;
    };
  }, [when, navigator]);

  useEffect(() => {
    if (!when) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);

    return () => {
      window.removeEventListener("beforeunload", handler);
    };
  }, [when]);
}