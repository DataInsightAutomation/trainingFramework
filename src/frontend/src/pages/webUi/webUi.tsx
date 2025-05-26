import React, { useEffect, useState } from 'react';
import { useAppStore } from "../../store/appStore";
import { tabConfig } from '../../constants/config/tabConfig';
import ThemedContent from '../../components/shared/ThemedContent';
import MainLayout from '../../components/core/layout/mainLayout/MainLayout';

const WebUi = () => {
    // Get the tab key and setter from the store
    const { activeKeyLeftPanel, setActiveTab } = useAppStore();
    // Add local state to track initialization
    const [isInitialized, setIsInitialized] = useState(false);
    // Set default tab on component mount - run only once
    useEffect(() => {
        // Force select the first tab on initial render
        setActiveTab(tabConfig[0].key);
        setIsInitialized(true);
        
        // For debugging
        console.log("Set default tab to:", tabConfig[0].key);
    }, [setActiveTab]);
    
    const renderContent = () => {
        // If we're initialized and have a valid tab key, render the component
        if (isInitialized && activeKeyLeftPanel && tabConfig.some(tab => tab.key === activeKeyLeftPanel)) {
            const activeTab = tabConfig.find(tab => tab.key === activeKeyLeftPanel);
            const Component = activeTab!.component;
            
            return (
                <ThemedContent>
                    <Component />
                </ThemedContent>
            );
        }
        
        // Show a loading spinner only briefly while initializing
        return (
            <ThemedContent>
                <div className="p-4 text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading content...</p>
                </div>
            </ThemedContent>
        );
    };

    return (
        <MainLayout>
            {renderContent()}
        </MainLayout>
    );
};

export default WebUi;