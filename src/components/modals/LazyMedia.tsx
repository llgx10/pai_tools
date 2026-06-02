import { useState, useEffect, useRef } from "react";
import { renderMedia } from "../../utils/mediaUtils";

type Props = {
    url?: string;
    disableLink?: boolean;
    lazy?: boolean;
};

export const LazyMedia = ({
    url,
    disableLink = false,
    lazy = true,
}: Props) => {
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // non-lazy mode
        if (!lazy) {
            setVisible(true);
            return;
        }

        setVisible(false);

        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    obs.disconnect();
                }
            },
            {
                rootMargin: "200px",
            }
        );

        if (ref.current) {
            obs.observe(ref.current);
        }

        return () => obs.disconnect();
    }, [lazy, url]);

    return (
        <div
            ref={ref}
            style={{
                width: "100%",
                height: "100%",
            }}
        >
            {visible
                ? renderMedia(url, disableLink)
                : "Loading..."}
        </div>
    );
};