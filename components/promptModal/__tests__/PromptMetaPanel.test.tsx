import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PromptMetaPanel from '../PromptMetaPanel';

const mockFormData = {
  title: 'Test Prompt',
  description: 'Desc',
  content: '这是一个测试提示词，用于生成AI角色的描述',
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

const mockOnFormDataChange = jest.fn();
const mockOnAutoMetadata = jest.fn();
const mockGetTokenCount = jest.fn(() => 10);

describe('PromptMetaPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <PromptMetaPanel
        formData={mockFormData as any}
        onFormDataChange={mockOnFormDataChange}
        getTokenCount={mockGetTokenCount}
        onAutoMetadata={mockOnAutoMetadata}
      />
    );

    // Basic smoke test - component renders
    expect(screen.getByText('元数据')).toBeInTheDocument();
  });

  it('calls onAutoMetadata when smart completion button is clicked with role target', async () => {
    mockOnAutoMetadata.mockResolvedValue('你是一个专业的AI助手');

    render(
      <PromptMetaPanel
        formData={mockFormData as any}
        onFormDataChange={mockOnFormDataChange}
        getTokenCount={mockGetTokenCount}
        onAutoMetadata={mockOnAutoMetadata}
      />
    );

    // Select role target
    const select = screen.getByDisplayValue('全部');
    fireEvent.change(select, { target: { value: 'role' } });

    // Click smart completion button
    const button = screen.getByText('智能补全');
    fireEvent.click(button);

    // Wait for async operation
    await waitFor(() => {
      expect(mockOnAutoMetadata).toHaveBeenCalledWith({ target: 'role' });
    });

    // Check if formData was updated
    expect(mockOnFormDataChange).toHaveBeenCalledWith(
      expect.objectContaining({
        extracted: expect.objectContaining({
          role: '你是一个专业的AI助手'
        })
      })
    );
  });

  it('calls onAutoMetadata when smart completion button is clicked with evaluation target', async () => {
    mockOnAutoMetadata.mockResolvedValue('这是一个高质量的提示词');

    render(
      <PromptMetaPanel
        formData={mockFormData as any}
        onFormDataChange={mockOnFormDataChange}
        getTokenCount={mockGetTokenCount}
        onAutoMetadata={mockOnAutoMetadata}
      />
    );

    // Select evaluation target
    const select = screen.getByDisplayValue('全部');
    fireEvent.change(select, { target: { value: 'evaluation' } });

    // Click smart completion button
    const button = screen.getByText('智能补全');
    fireEvent.click(button);

    // Wait for async operation
    await waitFor(() => {
      expect(mockOnAutoMetadata).toHaveBeenCalledWith({ target: 'evaluation' });
    });

    // Check if formData was updated
    expect(mockOnFormDataChange).toHaveBeenCalledWith(
      expect.objectContaining({
        extracted: expect.objectContaining({
          evaluation: '这是一个高质量的提示词'
        })
      })
    );
  });
});


