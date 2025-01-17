import React from "react";
import { Layout } from "antd";
import { PriceComparison } from "./components/PriceComparison";

const { Header, Content } = Layout;

const App: React.FC = () => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ background: "#fff", padding: "0 24px" }}>
        <h1>Reya Price Comparison</h1>
      </Header>
      <Content style={{ padding: "24px" }}>
        <PriceComparison />
      </Content>
    </Layout>
  );
};

export default App;
