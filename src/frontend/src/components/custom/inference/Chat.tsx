import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { Card, Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { useAppStore } from '#store/appStore';
import TextField from '#components/core/field/text/TextField';
import { DropDown } from '#components/core/field/dropdown/Dropdown';
import { translations } from './Inference';
import './Chat.scss';

import {API_BASE_URL} from "#constants/endpoint"

// Define template options
const TEMPLATES = [
  { value: 'llama3', label: 'templateLlama3' },
  { value: 'llama2', label: 'templateLlama2' },
  { value: 'mistral', label: 'templateMistral' },
  { value: 'vicuna', label: 'templateVicuna' },
  { value: 'baichuan', label: 'templateBaichuan' },
  { value: 'chatglm3', label: 'templateChatGLM3' },
  { value: 'qwen', label: 'templateQwen' },
  { value: 'default', label: 'templateDefault' }
];


// Define finetuning types
const FINETUNING_TYPES = [
  { value: 'lora', label: 'finetuningLora' },
  { value: 'qlora', label: 'finetuningQLora' },
  { value: 'full', label: 'finetuningFull' },
  { value: 'none', label: 'finetuningNone' }
];

// Define backend options
const BACKENDS = [
  { value: 'huggingface', label: 'backendHuggingface' },
  { value: 'vllm', label: 'backendVLLM' }
];

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
  containsMarkdown?: boolean;
}

// Parse markdown text into a structured format that React can render
const parseMarkdownToStructure = (text: string) => {
  if (!text) return [];
  
  const blocks = [];
  const lines = text.split('\n');
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Handle code blocks
    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      let codeContent = [];
      let j = i + 1;
      
      // Find the closing backticks
      while (j < lines.length && !lines[j].trim().startsWith('```')) {
        codeContent.push(lines[j]);
        j++;
      }
      
      blocks.push({
        type: 'code-block',
        language,
        content: codeContent.join('\n')
      });
      
      i = j + 1; // Skip past the closing backticks
      continue;
    }
    
    // Handle headings
    if (line.startsWith('#')) {
      const level = line.match(/^#+/)[0].length;
      const content = line.replace(/^#+\s*/, '');
      
      blocks.push({
        type: 'heading',
        level: Math.min(level, 6), // h1-h6 only
        content
      });
      
      i++;
      continue;
    }
    
    // Handle lists
    if (line.match(/^\s*-\s+/)) {
      const items = [];
      
      while (i < lines.length && lines[i].trim().match(/^\s*-\s+/)) {
        items.push(lines[i].trim().replace(/^\s*-\s+/, ''));
        i++;
      }
      
      blocks.push({
        type: 'list',
        items
      });
      
      continue;
    }
    
    // Handle tables
    if (line.includes('|')) {
      // Check if this looks like a table header
      const headerMatch = line.match(/\|(.+)\|/);
      
      if (headerMatch && i + 1 < lines.length && lines[i + 1].includes('|') && lines[i + 1].includes('-')) {
        const headers = headerMatch[1].split('|').map(h => h.trim());
        const rows = [];
        
        // Skip the separator line
        i += 2;
        
        // Process table rows
        while (i < lines.length && lines[i].includes('|')) {
          const rowMatch = lines[i].match(/\|(.+)\|/);
          if (rowMatch) {
            rows.push(rowMatch[1].split('|').map(cell => cell.trim()));
          }
          i++;
        }
        
        blocks.push({
          type: 'table',
          headers,
          rows
        });
        
        continue;
      }
    }
    
    // Handle links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let linkMatch;
    let lastIndex = 0;
    let lineParts = [];
    
    while ((linkMatch = linkRegex.exec(line)) !== null) {
      // Add text before the link
      if (linkMatch.index > lastIndex) {
        lineParts.push({
          type: 'text',
          content: line.substring(lastIndex, linkMatch.index)
        });
      }
      
      // Add the link
      lineParts.push({
        type: 'link',
        text: linkMatch[1],
        url: linkMatch[2]
      });
      
      lastIndex = linkMatch.index + linkMatch[0].length;
    }
    
    // Add remaining text after the last link
    if (lastIndex < line.length) {
      lineParts.push({
        type: 'text',
        content: line.substring(lastIndex)
      });
    }
    
    // If we found links, add each part
    if (lineParts.length > 0) {
      blocks.push(...lineParts);
    } else if (line.length > 0) {
      // Regular paragraph
      blocks.push({
        type: 'paragraph',
        content: line
      });
    }
    
    i++;
  }
  
  return blocks;
};

// Memoize the MarkdownRenderer component for better performance
const MarkdownRenderer = memo(({ content, isStreaming = false }) => {
  const { currentLocale } = useAppStore();
  const locale = currentLocale === 'zh' ? 'zh' : 'en';
  const t = translations[locale];
  
  // Parse the markdown content into structured data
  const parsedContent = useMemo(() => {
    return parseMarkdownToStructure(content);
  }, [content]);
  
  // Handle code copy
  const handleCopyCode = useCallback((code) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        // Copy feedback can be handled via state if needed
      })
      .catch(err => {
        console.error('Failed to copy code:', err);
      });
  }, []);
  
  // Return React elements instead of setting innerHTML
  return (
    <div className="markdown-content">
      {parsedContent.map((block, index) => {
        if (block.type === 'paragraph') {
          return <p key={`p-${index}`}>{block.content}</p>;
        } else if (block.type === 'heading') {
          const HeadingTag = `h${block.level}` as keyof JSX.IntrinsicElements;
          return <HeadingTag key={`h-${index}`}>{block.content}</HeadingTag>;
        } else if (block.type === 'code-block') {
          return (
            <div className="code-block" key={`code-${index}`}>
              <div className="code-header">
                <span className="code-language">{block.language || 'text'}</span>
                <button 
                  className="copy-button"
                  onClick={() => handleCopyCode(block.content)}
                >
                  <span className="copy-text">{t.copyCode || 'Copy'}</span>
                </button>
              </div>
              <pre>
                <code className={`language-${block.language || 'text'}`}>
                  {block.content}
                </code>
              </pre>
            </div>
          );
        } else if (block.type === 'list') {
          return (
            <ul key={`list-${index}`}>
              {block.items.map((item, i) => (
                <li key={`li-${index}-${i}`}>{item}</li>
              ))}
            </ul>
          );
        } else if (block.type === 'table') {
          return (
            <div className="table-container" key={`table-${index}`}>
              <table className="markdown-table">
                <thead>
                  <tr>
                    {block.headers.map((header, i) => (
                      <th key={`th-${index}-${i}`}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={`tr-${index}-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <td key={`td-${index}-${rowIndex}-${cellIndex}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        } else if (block.type === 'link') {
          return (
            <a 
              key={`link-${index}`}
              href={block.url}
              target="_blank"
              rel="noopener noreferrer"
              className="markdown-link"
            >
              {block.text}
            </a>
          );
        } else {
          return <span key={`span-${index}`}>{block.content}</span>;
        }
      })}
      {isStreaming && <span className="cursor-blink">|</span>}
    </div>
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';

// Function to detect if text contains markdown elements - memoize for reuse
const containsMarkdown = (text: string): boolean => {
  const markdownPatterns = [
    /```[\s\S]*?```/, // Code blocks
    /`[^`]+`/, // Inline code
    /\*\*[^*]+\*\*/, // Bold
    /\*[^*]+\*/, // Italic
    /^#+\s+[^\n]+/m, // Headers
    /^\s*- [^\n]+/m, // List items
    /\|[^\n]+\|/ // Tables
  ];
  
  return markdownPatterns.some(pattern => pattern.test(text));
};

// 2. Add user feedback component for responses
const FeedbackButtons = memo(({ messageId, onFeedback }) => {
  const [feedback, setFeedback] = useState(null);
  
  const handleFeedback = useCallback((type) => {
    setFeedback(type);
    onFeedback(messageId, type);
  }, [messageId, onFeedback]);
  
  return (
    <div className="message-feedback">
      <Button 
        variant="link" 
        className={`feedback-btn ${feedback === 'like' ? 'selected' : ''}`}
        onClick={() => handleFeedback('like')}
        disabled={feedback !== null}
      >
        <i className="bi bi-hand-thumbs-up"></i>
      </Button>
      <Button 
        variant="link" 
        className={`feedback-btn ${feedback === 'dislike' ? 'selected' : ''}`}
        onClick={() => handleFeedback('dislike')}
        disabled={feedback !== null}
      >
        <i className="bi bi-hand-thumbs-down"></i>
      </Button>
    </div>
  );
});

FeedbackButtons.displayName = 'FeedbackButtons';

// Main Chat component
const Chat = () => {
  const { currentTheme, currentLocale } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get translated strings - memoize to prevent unnecessary rerenders
  const locale = currentLocale === 'zh' ? 'zh' : 'en';
  const t = useMemo(() => translations[locale], [locale]);
  
  // Model configuration
  const [modelConfig, setModelConfig] = useState({
    model_name_or_path: 'meta-llama/Llama-3.2-1B-Instruct',
    adapter_name_or_path: 'saves/Llama-3.2-1B-Instruct/supervised/lora/sft',
    template: 'llama3',
    finetuning_type: 'lora',
    infer_backend: 'huggingface',
    vllm_maxlen: '4096',
    vllm_gpu_util: '0.9',
    vllm_enforce_eager: false,
    vllm_max_lora_rank: '32',
    vllm_config: ''
  });
  
  // Add sessionId state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const handleNewSession = (() => {
    setSessionId("")
  })
  // Handle feedback on messages
  const handleMessageFeedback = useCallback((messageId, feedbackType) => {
    console.log(`Feedback for message ${messageId}: ${feedbackType}`);
    // Here you would typically send this to your backend
  }, []);
  
  // Track user scrolling to determine if auto-scroll should happen
  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // 50px threshold
    
    // If user scrolls up, mark that they've scrolled away from bottom
    if (!isAtBottom && !userHasScrolled) {
      setUserHasScrolled(true);
    }
    
    // If user scrolls back to bottom, reset the flag
    if (isAtBottom && userHasScrolled) {
      setUserHasScrolled(false);
    }
  }, [userHasScrolled]);
  
  // Add scroll event listener
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleScroll);
      return () => chatContainer.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);
  
  // Only scroll to bottom for user messages or when streaming is complete
  useEffect(() => {
    if (messages.length === 0) return;
    
    const latestMessage = messages[messages.length - 1];
    
    // Improved scroll logic: 
    // 1. Always scroll when user sends a message
    // 2. Scroll during streaming if user hasn't manually scrolled away
    // 3. Scroll when streaming completes if user hasn't manually scrolled away
    const shouldScrollToBottom = 
      latestMessage.role === 'user' || 
      (latestMessage.isStreaming && !userHasScrolled) ||
      (!latestMessage.isStreaming && latestMessage.id !== lastMessageId && !userHasScrolled);
      
    if (shouldScrollToBottom && messagesEndRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
    
    // Update last seen message ID if streaming has completed
    if (!latestMessage.isStreaming && latestMessage.id !== lastMessageId) {
      setLastMessageId(latestMessage.id);
    }
  }, [messages, userHasScrolled, lastMessageId]);
  
  // Add useEffect to handle layout adjustments when settings panel visibility changes
  useEffect(() => {
    // Allow the DOM to update before measuring/adjusting
    const timeoutId = setTimeout(() => {
      // Force a layout recalculation
      window.dispatchEvent(new Event('resize'));
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, [showConfig]);
  
  // Cleanup any pending streaming simulations on unmount
  useEffect(() => {
    return () => {
      if (streamingTimeoutRef.current) {
        clearInterval(streamingTimeoutRef.current);
      }
    };
  }, []);
  
  // Memoize the scroll-to-bottom handler
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUserHasScrolled(false);
  }, []);
  
  // Format timestamp - memoize
  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);
  
  // Generate a unique ID for messages
  const generateId = useCallback(() => 
    `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, 
  []);
  
  // Handle model config changes - memoize to avoid recreating function on each render
  const handleConfigChange = useCallback((name: string, value: string) => {
    setModelConfig(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);
  
  // Handle checkbox change - memoize
  const handleCheckboxChange = useCallback((name: string, checked: boolean) => {
    setModelConfig(prev => ({
      ...prev,
      [name]: checked
    }));
  }, []);
  
  // Simulate streaming content with markdown detection
  const simulateStreamingResponse = useCallback((text: string, delay = 50) => {
    const hasMarkdown = containsMarkdown(text);
    setIsStreaming(true);
    
    // Reset user scroll state when streaming starts
    setUserHasScrolled(false);
    
    // Different streaming strategies based on content type
    if (hasMarkdown) {
      // For markdown, we'll stream character by character
      let currentLength = 0;
      let currentText = '';
      
      const interval = setInterval(() => {
        currentLength += 5; // Increment by 5 characters at a time
        
        if (currentLength >= text.length) {
          clearInterval(interval);
          // Update message to final state
          setMessages(prev => 
            prev.map(m => 
              m.isStreaming 
                ? { ...m, content: text, isStreaming: false, containsMarkdown: true } 
                : m
            )
          );
          setIsStreaming(false);
        } else {
          currentText = text.substring(0, currentLength);
          
          setMessages(prev => 
            prev.map(m => 
              m.isStreaming 
                ? { ...m, content: currentText, containsMarkdown: true } 
                : m
            )
          );
        }
      }, delay);
      
      streamingTimeoutRef.current = interval;
      return () => clearInterval(interval);
    } else {
      // For regular text, stream word by word
      const words = text.split(' ');
      let currentIndex = 0;
      let currentText = '';
      
      const interval = setInterval(() => {
        currentIndex++;
        
        if (currentIndex >= words.length) {
          clearInterval(interval);
          // Update message to final state
          setMessages(prev => 
            prev.map(m => 
              m.isStreaming 
                ? { ...m, content: text, isStreaming: false } 
                : m
            )
          );
          setIsStreaming(false);
        } else {
          currentText = words.slice(0, currentIndex).join(' ');
          
          setMessages(prev => 
            prev.map(m => 
              m.isStreaming 
                ? { ...m, content: currentText } 
                : m
            )
          );
        }
      }, delay);
      
      streamingTimeoutRef.current = interval;
      return () => clearInterval(interval);
    }
  }, []);
  
  // Send payload to backend /chat endpoint (supports streaming response)
  const sendToBackend = useCallback(async (payload: any) => {
    try {
      // Attach session_id if present
      const payloadWithSession = sessionId ? { ...payload, session_id: sessionId } : payload;

      const resp = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadWithSession)
      });

      // --- Get session_id from response header if present ---
      // With Access-Control-Expose-Headers set, this will work in all browsers:
      const sessionHeader = resp.headers.get('x-session-id');
      if (sessionHeader && sessionHeader !== sessionId) {
        setSessionId(sessionHeader);
      }
      // ------------------------------------------------------

      if (!resp.body) {
        setMessages(prev =>
          prev.map(m =>
            m.isStreaming
              ? {
                  ...m,
                  content: 'Error: No streaming response from backend.',
                  isStreaming: false,
                  containsMarkdown: false
                }
              : m
          )
        );
        setIsStreaming(false);
        return;
      }

      // Read the stream and update the assistant message as chunks arrive
      const reader = resp.body.getReader();
      let result = '';
      setIsStreaming(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        result += chunk;
        setMessages(prev =>
          prev.map(m =>
            m.isStreaming
              ? {
                  ...m,
                  content: result,
                  containsMarkdown: containsMarkdown(result)
                }
              : m
          )
        );
      }

      setMessages(prev =>
        prev.map(m =>
          m.isStreaming
            ? {
                ...m,
                content: result,
                isStreaming: false,
                containsMarkdown: containsMarkdown(result)
              }
            : m
        )
      );
      setIsStreaming(false);
    } catch (err) {
      console.error('Backend error:', err);
      setIsStreaming(false);
      setMessages(prev =>
        prev.map(m =>
          m.isStreaming
            ? {
                ...m,
                content: 'Error: Unable to get response from backend.',
                isStreaming: false,
                containsMarkdown: false
              }
            : m
        )
      );
    }
  }, [sessionId]);

  // Send a message with example response - simplify to remove conversation management
  const sendMessage = useCallback(() => {
    if (!inputText.trim() || isStreaming) return;

    setUserHasScrolled(false);

    const userMessage: Message = {
      id: generateId(),
      content: inputText,
      role: 'user',
      timestamp: new Date()
    };

    const assistantMessage: Message = {
      id: generateId(),
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isStreaming: true,
      containsMarkdown: true
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInputText('');

    // --- Prepare payload for backend ---
    const {
      vllm_maxlen,
      vllm_gpu_util,
      vllm_enforce_eager,
      vllm_max_lora_rank,
      vllm_config,
      infer_backend,
      ...baseConfig
    } = modelConfig;

    let payload: Record<string, any> = {
      ...baseConfig,
      infer_backend,
      input: inputText
    };

    if (infer_backend === 'vllm') {
      if (vllm_maxlen && vllm_maxlen.trim() !== '') payload.vllm_maxlen = vllm_maxlen;
      if (vllm_gpu_util && vllm_gpu_util.trim() !== '') payload.vllm_gpu_util = vllm_gpu_util;
      if (vllm_max_lora_rank && vllm_max_lora_rank.trim() !== '') payload.vllm_max_lora_rank = vllm_max_lora_rank;
      if (vllm_enforce_eager) payload.vllm_enforce_eager = vllm_enforce_eager;
      if (vllm_config && vllm_config.trim() !== '') payload.vllm_config = vllm_config;
    }
    // For now, just log it
    console.log('Prepared payload:', payload);

    // --- Send to backend (async, non-blocking) ---
    sendToBackend(payload);
    // ---------------------------------------------

    // Example responses with markdown for demonstration
    const markdownResponses = [
      // Response with basic formatting
      `I analyzed your request using the **${modelConfig.model_name_or_path}** model.

### Key Findings
- This model uses the ${modelConfig.template} template
- It was fine-tuned with ${modelConfig.finetuning_type}
- It's running on the ${modelConfig.infer_backend} backend

Let me know if you need more information about how this works.`,

      // Response with code example
      `Here's a Python function that demonstrates what you're asking for:

\`\`\`python
def process_data(input_text, model_config):
    """
    Process input text using the specified model configuration.
    
    Args:
        input_text (str): The text to process
        model_config (dict): Model configuration parameters
        
    Returns:
        dict: Processing results
    """
    results = {}
    
    # Initialize model with configuration
    model_path = model_config.get('model_name_or_path', '')
    adapter_path = model_config.get('adapter_name_or_path', '')
    template = model_config.get('template', '')
    
    print(f"Processing with {model_path} using {template} template")
    
    # Process the input (simplified example)
    results['output'] = f"Processed: {input_text[:50]}...";
    results['model_used'] = model_path;
    
    return results;

# Example usage
config = {
    "model_name_or_path": "${modelConfig.model_name_or_path || 'default-model'}",
    "template": "${modelConfig.template || 'default'}"
}
result = process_data("Your input text here", config)
print(result)
\`\`\`

This function demonstrates how to structure your processing logic.`,

      // Response with table
      `Here's a comparison of different parameters:

| Parameter | Value | Description |
|-----------|-------|-------------|
| Learning rate | 5e-5 | The rate at which the model learns |
| Batch size | 8 | Number of samples processed before updating |
| Epochs | 3 | Number of complete passes through the dataset |

These parameters were optimized for your specific use case.`,

      // New response with more complex table comparing models and features
      `Here's a detailed comparison of popular language models and their capabilities:

| Model | Size | Training Tokens | Strengths | Limitations | Best Use Cases |
|-------|------|----------------|-----------|-------------|----------------|
| Llama 3 | 8B - 70B | 15T | Strong reasoning, multilingual | Compute intensive | General purpose, complex tasks |
| Mistral | 7B | 8T | Efficient, good code generation | Less creative | Deployment on limited hardware |
| Gemma | 2B - 7B | 6T | Compact, efficient | Limited context | Edge devices, mobile applications |
| Claude 3 | 8B - 70B+ | Unknown | Long context window, reasoning | API access only | Research, document analysis |
| GPT-4 | Unknown | Unknown | Best overall performance | Expensive, closed source | Production applications |

For this specific task, I would recommend using the **${modelConfig.model_name_or_path}** model with the configuration you've specified, as it provides a good balance of performance and resource efficiency.

You can find more information about optimizing these models in the [Hugging Face documentation](https://huggingface.co/docs).`,

      // Response with table showing model performance metrics
      `Based on my analysis, here are the performance metrics for your model configuration:

| Metric | Value | Comparison to Baseline | Improvement |
|--------|-------|------------------------|-------------|
| MMLU Score | 72.4% | 68.2% | +4.2% |
| HELM Benchmark | 65.8% | 62.1% | +3.7% |
| TruthfulQA | 81.2% | 75.3% | +5.9% |
| Toxicity Rate | 0.8% | 2.4% | -1.6% |
| Inference Speed | 32.5 tok/s | 24.2 tok/s | +34.3% |

The **${modelConfig.model_name_or_path}** model with **${modelConfig.finetuning_type}** fine-tuning shows significant improvements across all metrics compared to the baseline.

Let me know if you'd like more detailed information on any specific metric.`,

      // Add an example with an improperly formatted table (no | characters)
      `Here's a summary of the model performance metrics:

Parameter    Value    Comparison    Improvement
MMLU         72.4%    68.2%         +4.2%
HELM         65.8%    62.1%         +3.7%
TruthfulQA   81.2%    75.3%         +5.9%
Toxicity     0.8%     2.4%          -1.6%
Speed        32.5     24.2          +34.3%

The ${modelConfig.model_name_or_path} model shows significant improvements across all metrics compared to the baseline.`
    ];
    
    // Pick a random example
    const responseText = markdownResponses[Math.floor(Math.random() * markdownResponses.length)];
    // Start streaming simulation
    // simulateStreamingResponse(responseText, 30);
  }, [inputText, isStreaming, generateId, simulateStreamingResponse, messages, modelConfig, sendToBackend]);
  
  // Handle enter key press - memoize
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);
  
  // Memoize VLLM settings to prevent unnecessary rerenders
  const vllmSettings = useMemo(() => {
    if (modelConfig.infer_backend !== 'vllm') return null;
    
    return (
      <div className="vllm-settings">
        <h5 className="mt-3 mb-3 border-top pt-3">{t.advancedOptions}</h5>
        
        <Form.Group className="mb-3">
          <Form.Label>Max Length</Form.Label>
          <TextField
            name="vllm_maxlen"
            value={modelConfig.vllm_maxlen}
            onChange={handleConfigChange}
            theme={currentTheme}
            noLabel={true}
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>GPU Utilization</Form.Label>
          <TextField
            name="vllm_gpu_util"
            value={modelConfig.vllm_gpu_util}
            onChange={handleConfigChange}
            theme={currentTheme}
            noLabel={true}
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Max LoRA Rank</Form.Label>
          <TextField
            name="vllm_max_lora_rank"
            value={modelConfig.vllm_max_lora_rank}
            onChange={handleConfigChange}
            theme={currentTheme}
            noLabel={true}
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Enforce Eager</Form.Label>
          <div className="mt-2">
            <Form.Check
              type="checkbox"
              checked={!!modelConfig.vllm_enforce_eager}
              onChange={(e) => handleCheckboxChange('vllm_enforce_eager', e.target.checked)}
              label="Enable"
            />
          </div>
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>vLLM Config (JSON)</Form.Label>
          <Form.Control
            as="textarea"
            name="vllm_config"
            value={modelConfig.vllm_config}
            onChange={(e) => handleConfigChange(e.target.name, e.target.value)}
            rows={2}
            placeholder="{}"
          />
        </Form.Group>
      </div>
    );
  }, [modelConfig, t, currentTheme, handleConfigChange, handleCheckboxChange]);

  // Memoize config sidebar for performance
  const configSidebar = useMemo(() => (
    <div className={`model-config-sidebar ${showConfig ? 'show' : 'hide'}`}>
      <div className="config-header">
        <h4>{t.modelSettings}</h4>
        <Button 
          variant="link" 
          className="close-btn"
          onClick={() => setShowConfig(false)}
        >
          <i className="bi bi-x-lg"></i>
        </Button>
      </div>
      
      <div className="config-body">
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Model Name or Path</Form.Label>
            <TextField
              name="model_name_or_path"
              value={modelConfig.model_name_or_path}
              onChange={handleConfigChange}
              theme={currentTheme}
              noLabel={true}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Adapter Name or Path</Form.Label>
            <TextField
              name="adapter_name_or_path"
              value={modelConfig.adapter_name_or_path}
              onChange={handleConfigChange}
              theme={currentTheme}
              noLabel={true}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Template</Form.Label>
            <DropDown
              name="template"
              value={modelConfig.template}
              onChange={handleConfigChange}
              options={TEMPLATES}
              theme={currentTheme}
              formData={modelConfig}
              field={{ name: 'template', type: 'select', options: TEMPLATES }}
              handleChange={(e: any) => handleConfigChange(e.target.name, e.target.value)}
              t={t}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Finetuning Type</Form.Label>
            <DropDown
              name="finetuning_type"
              value={modelConfig.finetuning_type}
              onChange={handleConfigChange}
              options={FINETUNING_TYPES}
              theme={currentTheme}
              formData={modelConfig}
              field={{ name: 'finetuning_type', type: 'select', options: FINETUNING_TYPES }}
              handleChange={(e: any) => handleConfigChange(e.target.name, e.target.value)}
              t={t}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Inference Backend</Form.Label>
            <DropDown
              name="infer_backend"
              value={modelConfig.infer_backend}
              onChange={handleConfigChange}
              options={BACKENDS}
              theme={currentTheme}
              formData={modelConfig}
              field={{ name: 'infer_backend', type: 'select', options: BACKENDS }}
              handleChange={(e: any) => handleConfigChange(e.target.name, e.target.value)}
              t={t}
            />
          </Form.Group>
          
          {vllmSettings}
        </Form>
      </div>
    </div>
  ), [showConfig, t, modelConfig, currentTheme, handleConfigChange, vllmSettings]);

  // Memoize message rendering for performance
  const renderMessages = useMemo(() => {
    if (messages.length === 0) {
      return (
        <div className="welcome-container">
          <div className="welcome-card">
            <div className="welcome-icon">
              <i className="bi bi-chat-square-text"></i>
            </div>
            <h3>{t.startConversation}</h3>
            <p className="welcome-description">
              {t.welcomeDescription}
            </p>
          </div>
        </div>
      );
    }
    
    return (
      <>
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role} ${message.isStreaming ? 'streaming' : ''}`}>
            <div className="message-avatar">
              {message.role === 'user' ? (
                <i className="bi bi-person-circle"></i>
              ) : (
                <i className="bi bi-robot"></i>
              )}
            </div>
            <div className="message-content">
              <div className="message-text">
                {message.containsMarkdown ? (
                  <MarkdownRenderer 
                    content={message.content}
                    isStreaming={message.isStreaming}
                  />
                ) : (
                  <div className="plain-text">
                    {message.content}
                    {message.isStreaming && <span className="cursor-blink">|</span>}
                  </div>
                )}
              </div>
              <div className="message-footer">
                <div className="message-time">
                  {formatTime(message.timestamp)}
                  {message.isStreaming && (
                    <span className="streaming-indicator">
                      <Spinner animation="border" size="sm" />
                      <span className="ms-1">{t.streaming}</span>
                    </span>
                  )}
                </div>
                {message.role === 'assistant' && !message.isStreaming && (
                  <FeedbackButtons 
                    messageId={message.id}
                    onFeedback={handleMessageFeedback}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </>
    );
  }, [messages, t, formatTime, handleMessageFeedback]);
  
  // Modified UI layout - remove context controls and history
  return (
    <div className={`chat-interface ${currentTheme.name}-theme`}>
      {/* Settings Button */}
      <Button 
        className="settings-button"
        variant="light"
        onClick={() => setShowConfig(!showConfig)}
      >
        <i className="bi bi-gear"></i>
      </Button>

      {/* New Session Button */}
      <Button
        className="new-session-button"
        variant="outline-primary"
        onClick={handleNewSession}
        style={{ position: 'absolute', top: 10, right: 60, zIndex: 2 }}
      >
        <i className="bi bi-plus-circle"></i> New Chat
      </Button>

      {/* Model Configuration Sidebar - now memoized */}
      {configSidebar}

      {/* Main Chat Container with simplified layout */}
      <div className="chat-main-container">
        <div className={`chat-container ${showConfig ? 'with-sidebar' : ''}`}>
          {/* Main content area with chat only */}
          <div className="chat-content-area">
            {/* Chat messages area */}
            <div 
              className="chat-messages" 
              ref={chatContainerRef}
            >
              {/* Render messages or welcome screen */}
              {renderMessages}
              
              {/* Invisible element for scrolling to */}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Scroll indicator - only show when needed */}
            {userHasScrolled && messages.length > 0 && (
              <div className="scroll-indicator" onClick={scrollToBottom}>
                <i className="bi bi-arrow-down-circle"></i>
                <span>New messages</span>
              </div>
            )}
            
            {/* Chat Input Area */}
            <div className="chat-input-area">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.typeMessage}
                rows={1}
                className="chat-input"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputText.trim() || isStreaming}
                className="send-button"
              >
                <i className="bi bi-send"></i>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
