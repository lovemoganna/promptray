import React from 'react';

export type Category = string;

export interface CategoryDef {
  id: string;
  label: string;
  isCustom: boolean;
}

export interface Theme {
  id: string;
  label: string;
  colors: {
    brand: string;
    bg: string;
    // 扩展的颜色系统
    surface?: string;
    text?: string;
    border?: string;
    muted?: string;
  };
  radius: string; // "0px" | "0.25rem" | "0.75rem" | "1.5rem"
  bgPattern?: 'dots' | 'grid' | 'noise' | 'none';
}

export interface PromptConfig {
    model: string;
    modelProvider?: string;
    modelName?: string;
    temperature: number;
    maxOutputTokens: number;
    topP?: number;
    topK?: number;
}

export type ExampleMode = 'independent' | 'iterative'; // 独立新增 | 多轮迭代

export interface Example {
    input: string;
    output: string;
    mode?: ExampleMode; // 示例模式：独立新增（默认）或 多轮迭代
    iterationIndex?: number; // 迭代序号（仅多轮模式有效，从0开始）
    previousOutput?: string; // 上一轮输出（仅多轮模式有效，用于展示迭代过程）
}

export interface ExamplesHistory {
    id: string;
    timestamp: number;
    examples: Example[];
    name?: string;
    description?: string;
}

export interface PromptVersion {
    timestamp: number;
    content: string;
    systemInstruction?: string;
    examples?: Example[];
    config?: PromptConfig;
    title: string; // Snapshot title at that time
}

export interface SavedRun {
    id: string;
    timestamp: number;
    model: string;
    inputValues: Record<string, string>;
    output: string;
    rating?: 'good' | 'bad'; // New field for quality feedback
    name?: string; // 测试用例名称
    description?: string; // 测试用例描述
    checkpoint?: string; // 断点位置（用于续跑）
    isCheckpoint?: boolean; // 是否为断点
    config?: PromptConfig; // 保存时的配置
    partialOutput?: string; // 部分输出（用于续跑）
}

export type PromptStatus = 'draft' | 'active' | 'archived';

// --- Bilingual Knowledge Schema Extensions ---
// Output type of the prompt: image / video / audio / text
export type OutputType = 'image' | 'video' | 'audio' | 'text';

// High-level application scenes (一级标签)
export type ApplicationScene =
  | '角色设计'
  | '场景生成'
  | '风格转换'
  | '故事创作'
  | '工具使用'
  | '其他';

// These are recommended presets only – UI will still allow free-form strings via string[]
export type TechnicalLabel =
  | '角色一致性'
  | '风格一致性'
  | '群体一致性'
  | '纯文本'
  | '参考图输入'
  | '多图输入'
  | '首尾帧'
  | '尺寸比例'
  | '数量控制'
  | '负面提示词'
  | '分步生成'
  | '迭代优化'
  | '组合使用';

export type StyleLabel =
  | '卡通'
  | '写实'
  | '赛博朋克'
  | '吉卜力风'
  | string;

export interface Prompt {
  id: string;
  title: string;
  content: string;
  // Bilingual prompt fields for the knowledge table (optional for legacy prompts)
  englishPrompt?: string;   // 原始英文 Prompt
  chinesePrompt?: string;   // 中文翻译 / 改写
  systemInstruction?: string; // New field for System Prompt/Persona
  examples?: Example[]; // New field for Few-Shot examples
  description: string;
  category: string;
  tags: string[];
  // Knowledge metadata fields (all optional, so they don't break existing data)
  outputType?: OutputType;                  // 图片 / 视频 / 音频 / 文本
  applicationScene?: ApplicationScene;      // 角色设计 / 场景生成 / ...
  technicalTags?: string[];                 // 技术标签（二级标签）
  styleTags?: string[];                     // 风格标签（三级标签）
  customLabels?: string[];                  // 额外自定义标签
  previewMediaUrl?: string;                 // 预览媒体 URL
  source?: string;                          // 文本来源说明（站点名称等）
  sourceAuthor?: string;                    // 作者
  sourceUrl?: string;                       // 原文链接
  recommendedModels?: string[];             // 适用模型列表（Midjourney, DALL-E, Sora, Claude...）
  language?: string;                         // 提示词主要语言（例如：中文 / English）
  visibility?: 'public' | 'private';         // 可见性：公开 / 仅我可见
  usageNotes?: string;                      // 使用说明
  cautions?: string;                        // 注意事项 / 避坑
  // 自动提取的提示词视角信息（可选）
  extracted?: {
    intent?: string;         // 提示词的主要目的或意图（从内容中抽取）
    role?: string;           // AI 的角色定义（从内容中抽取）
    audience?: string;       // 目标受众或使用者
    constraints?: string[];   // 约束条件或限制（多条）
    evaluation?: string;      // 模型或人工给出的评估/裁定说明
  };
  collectedAt?: number;                     // 收藏时间（单独存一份，避免和 createdAt 混淆）
  isFavorite: boolean;
  status?: PromptStatus;
  createdAt: number;
  updatedAt?: number;
  deletedAt?: number; // Soft delete timestamp
  config?: PromptConfig; // Persisted configuration
  history?: PromptVersion[]; // Version control
  savedRuns?: SavedRun[]; // New field for saved generations
  lastVariableValues?: Record<string, string>; // Persist test inputs
}

export type PromptFormData = Omit<Prompt, 'id' | 'createdAt' | 'history' | 'deletedAt' | 'savedRuns'>;

export interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  category: string;
  count?: number;
}