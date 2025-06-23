import React, { useState } from 'react';
import ModelConfigLayout from '../../shared/ModelConfigLayout/ModelConfigLayout';
import { translations } from './EvaluateTranslation';
import ErrorBanner from '../../shared/ErrorBanner/ErrorBanner';
import TrainingEvaluate from './TrainingEvaluate';
import BenchmarkEvaluate from './BenchmarkEvaluate';
import './Evaluate.scss';
import { useAppStore } from '#store/appStore';

// Define enum for evaluation types
export enum EvaluationType {
  TRAINING = 'training',
  BENCHMARK = 'benchmark'
}

const Evaluate = () => {
  // State to track which evaluation type is selected
  const [evaluationType, setEvaluationType] = useState<EvaluationType>(EvaluationType.TRAINING);
  const { currentLocale, currentTheme } = useAppStore();
  
  // Handle tab switching
  const handleTabChange = (type: EvaluationType) => {
    if (type !== evaluationType) {
      setEvaluationType(type);
    }
  };

  // Translate tab titles - updated to use currentLocale from store
  const getTabTitle = (type: EvaluationType) => {
    const locale: 'en' | 'zh' = currentLocale === 'zh' ? 'zh' : 'en';
    return type === EvaluationType.TRAINING 
      ? translations[locale].trainingEvaluation || 'Training Evaluation'
      : translations[locale].benchmarkEvaluation || 'Benchmark Evaluation';
  };

  return (
    <>
      {/* Tab navigation using SCSS classes */}
      <div className={`evaluate-tabs ${currentTheme.name}-theme`}>
        <div 
          className={`evaluate-tab ${evaluationType === EvaluationType.TRAINING ? 'active' : 'inactive'}`}
          onClick={() => handleTabChange(EvaluationType.TRAINING)}
        >
          {getTabTitle(EvaluationType.TRAINING)}
        </div>
        <div 
          className={`evaluate-tab ${evaluationType === EvaluationType.BENCHMARK ? 'active' : 'inactive'}`}
          onClick={() => handleTabChange(EvaluationType.BENCHMARK)}
        >
          {getTabTitle(EvaluationType.BENCHMARK)}
        </div>
      </div>

      {/* Render the appropriate component based on selected tab */}
      {evaluationType === EvaluationType.TRAINING ? (
        <TrainingEvaluate />
      ) : (
        <BenchmarkEvaluate />
      )}
    </>
  );
};

// Create a wrapper component that includes the shared layout
const EvaluateWithLayout = () => (
  <ModelConfigLayout
    title="Configure Evaluation Options"
    translations={translations}
  >
    <Evaluate />
  </ModelConfigLayout>
);

export default EvaluateWithLayout;
