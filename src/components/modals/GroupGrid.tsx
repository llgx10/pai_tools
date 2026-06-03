// src/components/modals/GroupGrid.tsx

import React from "react";
import { AutoSizer } from "react-virtualized-auto-sizer";
import { FixedSizeGrid as Grid } from "react-window";

import MediaCard from "./MediaCard";
import type { RowData } from "../../types/RowData";

type GroupGridProps = {
    items: RowData[];

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
};

const CARD_WIDTH = 280;
const CARD_HEIGHT = 560;
const GRID_HEIGHT = 700;

function GroupGridComponent({
    items,
    mediaField,
    onSelect,
    onFaultyClick,
    onUpdateRow,
    externalUpdateRow,
}: GroupGridProps) {
    return (
        <div
            style={{
                width: "100%",
                height: GRID_HEIGHT,
            }}
        >
            <AutoSizer
                renderProp={({
                    width,
                    height,
                }) => {
                    if (!width || !height) {
                        return null;
                    }

                    const columnCount =
                        Math.max(
                            1,
                            Math.floor(
                                width / CARD_WIDTH
                            )
                        );

                    const rowCount =
                        Math.ceil(
                            items.length /
                            columnCount
                        );

                    return (
                        <Grid
                            columnCount={
                                columnCount
                            }
                            columnWidth={
                                CARD_WIDTH
                            }
                            height={height}
                            rowCount={rowCount}
                            rowHeight={
                                CARD_HEIGHT
                            }
                            width={width}
                        >
                            {({
                                columnIndex,
                                rowIndex,
                                style,
                            }) => {
                                const index =
                                    rowIndex *
                                    columnCount +
                                    columnIndex;

                                if (
                                    index >=
                                    items.length
                                ) {
                                    return null;
                                }

                                const row =
                                    items[index];

                                return (
                                    <div
                                        style={{
                                            ...style,
                                            padding: 8,
                                            boxSizing:
                                                "border-box",
                                        }}
                                    >
                                        <MediaCard
                                            row={row}
                                            index={index}
                                            mediaField={
                                                mediaField
                                            }
                                            onSelect={
                                                onSelect
                                            }
                                            onFaultyClick={
                                                onFaultyClick
                                            }
                                            onUpdateRow={
                                                onUpdateRow
                                            }
                                            externalUpdateRow={
                                                externalUpdateRow
                                            }
                                        />
                                    </div>
                                );
                            }}
                        </Grid>
                    );
                }}
            />
        </div>
    );
}

export const GroupGrid = React.memo(
    GroupGridComponent
);

export default GroupGrid;