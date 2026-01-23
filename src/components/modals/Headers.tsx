import React from "react";
import { Layout, Menu } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import type { MenuProps } from "antd";

const { Header } = Layout;

const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const items: MenuProps["items"] = [
    {
      key: "/",
      label: "Home",
      onClick: () => navigate("/"),
    },
    // {
    //   key: "/media-inspector",
    //   label: "Media Inspector",
    //   onClick: () => navigate("/media-inspector"),
    // },
    {
      key: "/media-inspector2",
      label: "Media Inspector V2",
      onClick: () => navigate("/media-inspector2"),
    },
    {
      key: "/text-converter",
      label: "Text Converter",
      onClick: () => navigate("/text-converter"),
    },
    {
      key: "/query-builder",
      label: "Query Builder",
      onClick: () => navigate("/query-builder"),
    },
  ];

  return (
    <Header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        height: 48,                // ⬅️ smaller header
        lineHeight: "48px",
        padding: "0 16px",
        background: "#fff",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end", // ⬅️ move menu right
          alignItems: "center",
          height: "100%",
        }}
      >
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={items}
          style={{
            height: 48,
            lineHeight: "48px",
            fontSize: 13,           // ⬅️ slightly smaller text
            borderBottom: "none",
          }}
        />
      </div>
    </Header>
  );
};

export default AppHeader;
