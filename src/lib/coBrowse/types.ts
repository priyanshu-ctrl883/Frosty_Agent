export type DrivingMode = "admin" | "merchant" | "both";

export type RemoteCursorState = {
  xRatio: number;
  yRatio: number;
  visible: boolean;
  name?: string | null;
  role: "admin" | "merchant";
  lastUpdated: number;
};

export type RemoteClickState = {
  id: string;
  xRatio: number;
  yRatio: number;
  role: "admin" | "merchant";
  timestamp: number;
};

export type RemoteFocusState = {
  selector: string | null;
  label?: string | null;
  role: "admin" | "merchant";
};

export type CoBrowseEvent =
  | {
      event: "cursor";
      payload: { xRatio: number; yRatio: number; visible?: boolean };
    }
  | {
      event: "scroll";
      payload: { scrollYRatio: number; scrollYPx: number };
    }
  | {
      event: "navigate";
      payload: { path: string };
    }
  | {
      event: "input";
      payload: { selector: string; value: string };
    }
  | {
      event: "focus";
      payload: { selector: string | null; label?: string | null };
    }
  | {
      event: "click";
      payload: { xRatio: number; yRatio: number };
    }
  | {
      event: "state_snapshot";
      payload: { path: string; scrollYRatio: number; driving: DrivingMode };
    }
  | {
      event: "driving_change";
      payload: { driving: DrivingMode };
    };

export type CoBrowseContextState = {
  isActive: boolean;
  drivingMode: DrivingMode;
  isDriver: boolean;
  remoteCursor: RemoteCursorState | null;
  remoteClicks: RemoteClickState[];
  remoteFocus: RemoteFocusState | null;
  setDrivingMode: (mode: DrivingMode) => void;
};
