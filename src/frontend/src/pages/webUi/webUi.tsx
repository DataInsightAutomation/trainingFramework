import React, { useContext } from 'react';
import { Context } from "../../utils/context";
import { tabConfig } from '../../constants/config/tabConfig';
import ThemedContent from '../../components/shared/ThemedContent';
import MainLayout from '../../components/core/layout/MainLayout';

const WebUi = () => {
    const { state } = useContext(Context);
    const activeTabKey = state.en?.activeKeyLeftPanel;
    
    const renderContent = () => {
        // Find the active tab configuration
        const activeTab = tabConfig.find(tab => tab.key === activeTabKey);
        
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