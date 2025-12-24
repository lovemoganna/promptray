import React from 'react';
import { render, screen } from '@testing-library/react';
import PromptMetaPanel from '../PromptMetaPanel';

const mockFormData = {
  title: 'Test Prompt',
  description: 'Desc',
  content: '这是一个测试提示词',
  englishPrompt: '',
  chinesePrompt: '',
  systemInstruction: '',
  examples: [],
  category: 'Misc',
  tags: [],
  outputType: undefined,
  applicationScene: undefined,
  technicalTags: [],
  styleTags: [],
  customLabels: [],
  previewMediaUrl: '',
  source: '',
  sourceAuthor: '',
  sourceUrl: '',
  recommendedModels: [],
  usageNotes: '',
  cautions: '',
  isFavorite: false,
  status: 'active',
  config: { model: 'gemini-3-flash-preview', temperature: 0.7, maxOutputTokens: 2000, topP: 0.95, topK: 64 }
};

describe('PromptMetaPanel', () => {
  it('renders quick overview and fields', () => {
    render(
      <PromptMetaPanel
        formData={mockFormData as any}
        onFormDataChange={() => {}}
        getTokenCount={() => 10}
        onAutoMetadata={() => {}}
      />
    );

    expect(screen.getByText('元数据')).toBeInTheDocument();
    expect(screen.getByText('快速概览')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('示例图片/视频/音频链接')).toBeInTheDocument();
  });
});


