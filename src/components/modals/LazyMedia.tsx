import { useState, useEffect, useRef } from "react";
import { renderMedia } from "../../utils/mediaUtils";

export const LazyMedia = ({
  url,
  disableLink = false
}: {
  url?: string;
  disableLink?: boolean;
}) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    if (ref.current) obs.observe(ref.current);

    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      {visible ? renderMedia(url, disableLink) : "Loading..."}
    </div>
  );
};