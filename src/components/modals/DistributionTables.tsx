import React, { useMemo } from "react";
import { Table, Card, Row, Col, Button, Tooltip } from "antd";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";

type Props = {
  data: any[];

  hiddenAdvertisers: Set<string>;
  hiddenCampaigns: Set<string>;

  toggleHideAdvertiser: (id: string) => void;
  toggleHideCampaign: (id: string) => void;

  activeAdvertiser: string | null;
  activeCampaign: string | null;

  setActiveAdvertiser: (id: string | null) => void;
  setActiveCampaign: (id: string | null) => void;
};

const DistributionTables: React.FC<Props> = ({
  data,
  hiddenAdvertisers,
  hiddenCampaigns,
  toggleHideAdvertiser,
  toggleHideCampaign,
  activeAdvertiser,
  activeCampaign,
  setActiveAdvertiser,
  setActiveCampaign,
}) => {
  // ✅ Compute distributions once
  const { advertiserData, campaignData } = useMemo(() => {
    const adv: Record<string, number> = {};
    const cmp: Record<string, number> = {};

    data.forEach((r) => {
      if (r.ADVERTISER_NAME) {
        adv[r.ADVERTISER_NAME] = (adv[r.ADVERTISER_NAME] || 0) + 1;
      }
      if (r.CREATIVE_CAMPAIGN_NAME) {
        cmp[r.CREATIVE_CAMPAIGN_NAME] =
          (cmp[r.CREATIVE_CAMPAIGN_NAME] || 0) + 1;
      }
    });

    return {
      advertiserData: Object.entries(adv)
        .map(([id, value]) => ({ id, value }))
        .sort((a, b) => b.value - a.value),

      campaignData: Object.entries(cmp)
        .map(([id, value]) => ({ id, value }))
        .sort((a, b) => b.value - a.value),
    };
  }, [data]);

  const advertiserColumns = [
    { title: "Advertiser", dataIndex: "id" },
    {
      title: "Count",
      dataIndex: "value",
      sorter: (a: any, b: any) => b.value - a.value,
    },
    {
      title: "Show/Hide",
      dataIndex: "id",
      render: (id: string) => {
        const isHidden = hiddenAdvertisers.has(id);

        return (
          <Button
            type="text"
            icon={isHidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => toggleHideAdvertiser(id)}
          />
        );
      },
    },
    {
      title: "Focus",
      render: (_: any, record: any) => (
        <Tooltip title="Show only this advertiser">
          <Button
            size="small"
            type={activeAdvertiser === record.id ? "primary" : "text"}
            onClick={() =>
              setActiveAdvertiser(
                activeAdvertiser === record.id ? null : record.id
              )
            }
          >
            🎯
          </Button>
        </Tooltip>
      ),
    },
  ];

  const campaignColumns = [
    { title: "Campaign", dataIndex: "id" },
    {
      title: "Count",
      dataIndex: "value",
      sorter: (a: any, b: any) => b.value - a.value,
    },
    {
      title: "Show/Hide",
      dataIndex: "id",
      render: (id: string) => {
        const isHidden = hiddenCampaigns.has(id);

        return (
          <Button
            type="text"
            icon={isHidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => toggleHideCampaign(id)}
          />
        );
      },
    },
    {
      title: "Focus",
      render: (_: any, record: any) => (
        <Tooltip title="Show only this campaign">
          <Button
            size="small"
            type={activeCampaign === record.id ? "primary" : "text"}
            onClick={() =>
              setActiveCampaign(
                activeCampaign === record.id ? null : record.id
              )
            }
          >
            🎯
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <Row gutter={16} style={{ marginTop: 24 }}>
      <Col span={12}>
        <Card title="Advertiser Distribution">
          <Table
            columns={advertiserColumns}
            dataSource={advertiserData}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>
      </Col>

      <Col span={12}>
        <Card title="Campaign Distribution">
          <Table
            columns={campaignColumns}
            dataSource={campaignData}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>
      </Col>
    </Row>
  );
};

export default React.memo(DistributionTables);