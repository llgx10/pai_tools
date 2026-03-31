import React, { useMemo } from "react";
import { Card, Row, Col } from "antd";

type RowData = {
  isFaulty?: boolean;
  IMPRESSIONS?: number | string;
};

type Props = {
  data: RowData[];
};

const StatsPanel: React.FC<Props> = ({ data }) => {
  const {
    totalRows,
    faultyRows,
    faultyPercentage,
    impressionPercentage,
  } = useMemo(() => {
    const totalRows = data.length;

    const faultyRows = data.filter((r) => r.isFaulty).length;

    const faultyPercentage = totalRows
      ? ((faultyRows / totalRows) * 100).toFixed(2)
      : "0";

    const hasImpressions = data[0] && "IMPRESSIONS" in data;

    const totalImpressions = hasImpressions
      ? data.reduce(
          (sum, r) => sum + (parseFloat(String(r.IMPRESSIONS)) || 0),
          0
        )
      : 0;

    const faultyImpressions = hasImpressions
      ? data
          .filter((r) => r.isFaulty)
          .reduce(
            (sum, r) => sum + (parseFloat(String(r.IMPRESSIONS)) || 0),
            0
          )
      : 0;

    const impressionPercentage = totalImpressions
      ? ((faultyImpressions / totalImpressions) * 100).toFixed(2)
      : null;

    return {
      totalRows,
      faultyRows,
      faultyPercentage,
      totalImpressions,
      faultyImpressions,
      impressionPercentage,
    };
  }, [data]);

  return (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={8}>
        <Card>
          <b>Total Rows</b>
          <div>{totalRows}</div>
        </Card>
      </Col>

      <Col span={8}>
        <Card>
          <b>Faulty Rows</b>
          <div>
            {faultyRows} ({faultyPercentage}%)
          </div>
        </Card>
      </Col>

      <Col span={8}>
        <Card>
          <b>Faulty Impressions</b>
          <div>
            {impressionPercentage ? `${impressionPercentage}%` : "—"}
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default React.memo(StatsPanel);