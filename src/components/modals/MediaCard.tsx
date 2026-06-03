// src/components/modals/MediaCard.tsx

import React from "react";
import { Card, Input, Checkbox } from "antd";

import { LazyMedia } from "./LazyMedia";

import type { RowData } from "../../types/RowData";

type Props = {
    row: RowData;

    mediaField: string;

    onSelect: (row: RowData) => void;

    onFaultyClick: (row: RowData) => void;

    onUpdateRow: (
        id: string | number,
        field: string,
        value: any
    ) => void;

    externalUpdateRow?: (
        id: string | number,
        field: string,
        value: any
    ) => void;

    index?: number;
};

const MediaCardComponent = ({
    row,
    mediaField,
    onSelect,
    onFaultyClick,
    onUpdateRow,
    externalUpdateRow,
    index,
}: Props) => {
    const mediaUrl =
        row[mediaField as keyof RowData] ||
        row.CREATIVE_URL_SUPPLIER ||
        row.media ||
        "";

    return (
        <Card
            hoverable
            bodyStyle={{
                padding: 10,
            }}
            onClick={() => onSelect(row)}
        >
            <div
                style={{
                    aspectRatio: "9/16",
                    overflow: "hidden",
                    background: "#f5f5f5",
                    marginBottom: 8,
                }}
            >
                <LazyMedia
                    url={String(mediaUrl)}
                    disableLink
                    lazy
                />
            </div>

            <div
                style={{
                    fontWeight: 600,
                }}
            >
                {index !== undefined
                    ? `${index + 1}. `
                    : ""}
                {row.ADVERTISER_NAME ||
                    "Unknown"}
            </div>

            <div
                style={{
                    fontSize: 12,
                }}
            >
                {row.BRAND}
            </div>

            <div
                style={{
                    marginTop: 6,
                }}
                onClick={(e) =>
                    e.stopPropagation()
                }
            >
                <Input
                    placeholder="Add remark"
                    value={row.remark || ""}
                    onChange={(e) => {
                        const value =
                            e.target.value;

                        onUpdateRow(
                            row.id,
                            "remark",
                            value
                        );

                        externalUpdateRow?.(
                            row.id,
                            "remark",
                            value
                        );
                    }}
                />

                <Checkbox
                    style={{
                        marginTop: 6,
                    }}
                    checked={
                        !!row.isFaulty
                    }
                    onChange={() =>
                        onFaultyClick(row)
                    }
                >
                    Faulty
                </Checkbox>
            </div>
        </Card>
    );
};

const MediaCard = React.memo(
    MediaCardComponent,
    (prev, next) =>
        prev.row === next.row
);

export default MediaCard;