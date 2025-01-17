import { Menu, MenuProps } from "antd";
import { Footer, Header } from "antd/es/layout/layout";
import { createStyles } from "antd-style";
import { FileSearchOutlined, BarChartOutlined } from "@ant-design/icons";
import { Outlet, useNavigate } from "react-router-dom";

const useStyles = createStyles(() => ({
  appLayoutContainer: {
    display: "grid",
    gridTemplateRows: "auto 1fr auto",
    gridTemplateAreas: `
      "header"
      "main"
      "footer"
    `,
    height: "100vh",
  },
  appLayoutHeader: {
    gridArea: "header",
    width: "100%",
    padding: 0,
  },
  appLayoutMain: {
    gridArea: "main",
    padding: 24,
    overflow: "hidden",
  },
  appLayoutFooter: {
    gridArea: "footer",
    textAlign: "center",
  },
}));

type MenuItem = Required<MenuProps>["items"][number];

export const AppLayout = () => {
  const { styles } = useStyles();

  const navigate = useNavigate();

  const items: Array<MenuItem> = [
    {
      label: "Grid",
      key: "grid",
      icon: <FileSearchOutlined />,
      onClick: () => navigate("/"),
    },
    {
      label: "Graphs",
      key: "app",
      icon: <BarChartOutlined />,
      onClick: () => navigate("/charts"),
    },
  ];

  return (
    <div className={styles.appLayoutContainer}>
      <Header className={styles.appLayoutHeader}>
        <Menu mode="horizontal" defaultSelectedKeys={["1"]} items={items} />
      </Header>
      <div className={styles.appLayoutMain}>
        <Outlet />
      </div>
      <Footer className={styles.appLayoutFooter}>Crypto Drops</Footer>
    </div>
  );
};
