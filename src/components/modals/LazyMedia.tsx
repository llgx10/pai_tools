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
        if (!lazy) {
            setVisible(true);
            return;
        }

        const obs = new IntersectionObserver(
            ([entry]) => {
                setVisible(entry.isIntersecting);
            },
            {
                rootMargin: "300px",
            }
        );

        if (ref.current) {
            obs.observe(ref.current);
        }

        return () => obs.disconnect();
    }, [lazy]);

    return (
        <div
            ref={ref}
            style={{
                width: "100%",
                minHeight: 250,
            }}
        >
            {visible
                ? renderMedia(url, disableLink)
                : null}
        </div>
    );
};