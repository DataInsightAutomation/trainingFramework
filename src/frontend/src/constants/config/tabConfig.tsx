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
  // Add more tabs easily by adding to this array
];