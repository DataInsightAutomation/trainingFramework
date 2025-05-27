import EvaluateWithLayout from "../../components/custom/evaluate/Evaluate";
import TrainWithLayout from "../../components/custom/train/Train";

export interface TabItem {
  key: string;
  label: string;
  icon?: string; // Optional icon class/name
  component: React.ComponentType<any>;
}

export const tabConfig: TabItem[] = [
  {
    key: "train",
    label: "Train",
    icon: "bi bi-graph-up", // Bootstrap icon example
    component: TrainWithLayout
  },
  {
    key: "evaluate",
    label: "Evaluate",
    icon: "bi bi-clipboard-data",
    component: EvaluateWithLayout
  },
  {
    key: "export",
    label: "Export",
    icon: "bi bi-box-arrow-up", // More appropriate icon
    component: () => <div>Export</div> // Placeholder component
  },
  {
    key: "inference",
    label: "Inference",
    icon: "bi bi-lightning", // More appropriate icon
    component: () => <div>Inference</div> // Placeholder component
  }
  // Add more tabs easily by adding to this array
];