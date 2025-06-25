import React, { useState } from 'react';
import ModelConfigLayout from "#components/shared/ModelConfigLayout/ModelConfigLayout";
import { useAppStore } from '#store/appStore';
import './inference.scss';
import InferenceModel from './InferenceModel';
import Chat from './Chat';

// Translations for the inference page
export const translations = {
    en: {
        advancedOptions: "Advanced Options",
        basicOptions: "Basic Options",
        inferenceModel: "Inference",
        chat: "Chatbot UI",
        configureInference: "Configure Inference Options",
        modelSettings: "Model Settings",
        backendSettings: "Backend Settings",
        applyConfiguration: "Apply Configuration",
        resetDefaults: "Reset to Defaults",
        // Add these translations for the Chat component
        hideSettings: "Hide Settings",
        showSettings: "Show Settings",
        sendMessage: "Send",
        typeMessage: "Type your message here...",
        startConversation: "Start a conversation with the model",
        streaming: "Streaming response...",
        welcomeDescription: "Chat with the selected model. You can change model settings at any time.",
        codeBlock: "Code block",
        copyCode: "Copy code",
        copied: "Copied!",
        waitingForResponse: "Waiting for response...",
        // Template translations
        templateLlama3: "Llama 3",
        templateLlama2: "Llama 2",
        templateMistral: "Mistral",
        templateVicuna: "Vicuna",
        templateBaichuan: "Baichuan",
        templateChatGLM3: "ChatGLM3",
        templateQwen: "Qwen",
        templateDefault: "Default",
        // Finetuning type translations
        finetuningLora: "LoRA",
        finetuningQLora: "QLoRA",
        finetuningFull: "Full",
        finetuningNone: "None",
        // Backend translations
        backendHuggingface: "HuggingFace",
        backendVLLM: "vLLM",
        // Dropdown placeholder
        selectTemplate: "Select template",
        selectFinetuningType: "Select finetuning type",
        selectInferBackend: "Select backend"
    },
    zh: {
        advancedOptions: "高级选项",
        basicOptions: "基本选项",
        inferenceModel: "推理模型",
        chat: "聊天",
        configureInference: "配置推理选项",
        modelSettings: "模型设置",
        backendSettings: "后端设置",
        applyConfiguration: "应用配置",
        resetDefaults: "重置为默认值",
        // Add these translations for the Chat component
        hideSettings: "隐藏设置",
        showSettings: "显示设置",
        sendMessage: "发送",
        typeMessage: "输入消息...",
        startConversation: "开始与模型对话",
        streaming: "正在生成回复...",
        welcomeDescription: "与选定的模型聊天。您可以随时更改模型设置。",
        codeBlock: "代码块",
        copyCode: "复制代码",
        copied: "已复制!",
        waitingForResponse: "等待回应...",
        // Template translations
        templateLlama3: "Llama 3",
        templateLlama2: "Llama 2",
        templateMistral: "Mistral",
        templateVicuna: "Vicuna",
        templateBaichuan: "百川",
        templateChatGLM3: "ChatGLM3",
        templateQwen: "通义千问",
        templateDefault: "默认",
        // Finetuning type translations
        finetuningLora: "LoRA",
        finetuningQLora: "QLoRA",
        finetuningFull: "完整微调",
        finetuningNone: "无微调",
        // Backend translations
        backendHuggingface: "HuggingFace",
        backendVLLM: "vLLM",
        // Dropdown placeholder
        selectTemplate: "选择模板",
        selectFinetuningType: "选择微调类型",
        selectInferBackend: "选择后端"
    }
};

// Define enum for inference types
export enum InferenceType {
    MODEL = 'model',
    CHAT = 'chat'
}

const Inference = () => {
    // State to track which inference type is selected
    const [inferenceType, setInferenceType] = useState<InferenceType>(InferenceType.CHAT);
    const { currentLocale, currentTheme } = useAppStore();

    // Handle tab switching
    const handleTabChange = (type: InferenceType) => {
        if (type !== inferenceType) {
            setInferenceType(type);
        }
    };

    // Translate tab titles
    const getTabTitle = (type: InferenceType) => {
        const locale: 'en' | 'zh' = currentLocale === 'zh' ? 'zh' : 'en';
        return type === InferenceType.MODEL
            ? translations[locale].inferenceModel || 'Inference Model'
            : translations[locale].chat || 'Chat';
    };

    return (
        <>
            {/* Tab navigation using SCSS classes */}
            <div className={`inference-tabs ${currentTheme.name}-theme`}>
                <div
                    className={`inference-tab ${inferenceType === InferenceType.CHAT ? 'active' : 'inactive'}`}
                    onClick={() => handleTabChange(InferenceType.CHAT)}
                >
                    {getTabTitle(InferenceType.CHAT)}
                </div>
                <div
                    className={`inference-tab ${inferenceType === InferenceType.MODEL ? 'active' : 'inactive'}`}
                    onClick={() => handleTabChange(InferenceType.MODEL)}
                >
                    {getTabTitle(InferenceType.MODEL)}
                </div>

            </div>

            {/* Render the appropriate component based on selected tab */}
            {inferenceType === InferenceType.MODEL ? (
                <InferenceModel />
            ) : (
                <Chat />
            )}
        </>
    );
};

const InferenceWithLayout = () => {
    const { currentLocale } = useAppStore();
    const locale: 'en' | 'zh' = currentLocale === 'zh' ? 'zh' : 'en';

    // Ensure the chat fills the available space between header and footer
    return (
        <div style={{ height: '90vh', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {/* <ModelConfigLayout */}
                {/* title={translations[locale].configureInference || "Configure Inference Options"} */}
                {/* translations={translations}> */}
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    <Inference />
                </div>
            {/* </ModelConfigLayout> */}
        </div>
    );
};

export default InferenceWithLayout;
