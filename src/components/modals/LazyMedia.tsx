import { useState, useEffect, useRef } from "react";
import { renderMedia } from "../../utils/mediaUtils";

export const LazyMedia = ({ url }: { url?: string }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setVisible(true);
    });

    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return <div ref={ref}>{visible ? renderMedia(url) : "Loading..."}</div>;
};