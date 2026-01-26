import { Layout, Menu, theme } from "antd";
import { useLocation, useNavigate } from "react-router-dom";

const { Header } = Layout;

const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken(); // 👈 read current theme

  const items = [
    { key: "/", label: "Home", onClick: () => navigate("/") },
    { key: "/media-inspector2", label: "Media Inspector V2", onClick: () => navigate("/media-inspector2") },
    { key: "/text-converter", label: "Text Converter", onClick: () => navigate("/text-converter") },
    { key: "/query-builder", label: "Query Builder", onClick: () => navigate("/query-builder") },
  ];

  return (
    <Header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        height: 50,
        lineHeight: "48px",
        padding: "0 16px",
        background: token.colorBgContainer,              // ✅ theme-aware
        borderBottom: `1px solid ${token.colorBorder}`,  // ✅ theme-aware
      }}
    >
      <Menu
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={items}
        style={{
          background: "transparent",                     // 👈 inherit header bg
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
          height: 48,
          lineHeight: "48px",
          fontSize: 13,
          borderBottom: "none",
        }}
      />
    </Header>
  );
};

export default AppHeader;
