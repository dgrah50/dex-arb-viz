import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";

export function loadingOverlayComponent(props: { loadingMessage: string }) {
  return (
    <div className="ag-overlay-loading-center" role="presentation">
      <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
      <div aria-live="polite" aria-atomic="true">
        {props.loadingMessage}
      </div>
    </div>
  );
}
