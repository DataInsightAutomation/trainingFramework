import React from 'react';
import { useAppStore } from "../../store/appStore";
import { tabConfig } from '../../constants/config/tabConfig';
import ThemedContent from '../../components/shared/ThemedContent';
import MainLayout from '../../components/core/layout/MainLayout';

const WebUi = () => {
    // Get the tab key directly from the top level
    const { activeKeyLeftPanel } = useAppStore();
    
    const renderContent = () => {
        // Find the active tab configuration
        const activeTab = tabConfig.find(tab => tab.key === activeKeyLeftPanel);
        
        if (activeTab) {
            const Component = activeTab.component;
            return (
                <ThemedContent>
                    <Component />
                </ThemedContent>
            );
        }
        
        return (
            <ThemedContent>
                <div className="p-4">Please select a tab</div>
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