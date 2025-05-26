import Evaluate from "../../components/custom/evaluate/Evaluate";
import Train from "../../components/custom/train/Train";

export interface TabItem {
  key: string;
  label: string;
  icon?: string; // Optional icon class/name
  component: React.ComponentType<any>;
}

export const tabConfig: TabItem[] = [
  {
    key: "element1",
    label: "Train",
    icon: "bi bi-graph-up", // Bootstrap icon example
    component: Train
  },
  {
    key: "element2",
    label: "Evaluate",
    icon: "bi bi-clipboard-data",
    component: Evaluate
  },
  {
    key: "element3",
    label: "Export",
    icon: "bi bi-gear", // Example icon
    component: () => <div>Export</div> // Placeholder component
  },
  {
    key: "element4",
    label: "Inference / Prediction / Deployment",
    icon: "bi bi-gear", // Example icon
    component: () => <div>Inference / Prediction / Deployment</div> // Placeholder component
  }
  // Add more tabs easily by adding to this array
];