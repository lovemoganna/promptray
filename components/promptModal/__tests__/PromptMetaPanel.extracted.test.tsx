import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PromptMetaPanel from '../PromptMetaPanel';

const baseFormData = {
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
  config: { model: 'gemini-3-flash-preview', temperature: 0.7, maxOutputTokens: 2000, topP: 0.95, topK: 64 },
};

describe('PromptMetaPanel extracted perspective', () => {
  it('renders intent and audience fields and shows existing constraints as tags', async () => {
    const formData = {
      ...baseFormData,
      extracted: {
        intent: '生成教学示例',
        audience: '初学者',
        constraints: ['不超过200字', '避免专业术语'],
      },
    } as any;

    const mockOnChange = jest.fn();

    render(
      <PromptMetaPanel
        formData={formData}
        onFormDataChange={mockOnChange}
        getTokenCount={() => 10}
        onAutoMetadata={() => {}}
        tagSuggestions={['不超过200字', '避免使用缩写']}
      />
    );

    expect(screen.getByLabelText(/意图/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/受众/i)).toBeInTheDocument();

    // Check if constraints are rendered in the constraints field
    expect(screen.getByText(/不超过200字/)).toBeInTheDocument();
    expect(screen.getByText(/避免专业术语/)).toBeInTheDocument();
  });

  it.skip('removes constraint tag when its remove button is clicked and adds suggestion when clicked', async () => {
    const user = userEvent.setup();
    const formData = {
      ...baseFormData,
      extracted: {
        intent: '',
        audience: '',
        constraints: ['不超过200字'],
      },
    } as any;

    const mockOnChange = jest.fn();

    render(
      <PromptMetaPanel
        formData={formData}
        onFormDataChange={mockOnChange}
        getTokenCount={() => 5}
        onAutoMetadata={() => {}}
        tagSuggestions={['避免使用缩写']}
      />
    );

    // find the tag element and its remove button
    const tagEl = screen.getByText('不超过200字');
    const tagParent = tagEl.closest('span');
    expect(tagParent).toBeTruthy();
    if (tagParent) {
      const removeButton = within(tagParent).getByRole('button');
      await user.click(removeButton);
      // onFormDataChange should be called with extracted.constraints filtered out
      expect(mockOnChange).toHaveBeenCalled();
      const calledWith = mockOnChange.mock.calls[0][0];
      expect(calledWith.extracted.constraints).toEqual([]);
    }

    // click suggestion to add new constraint
    const suggestionBtn = screen.getByText('避免使用缩写');
    await user.click(suggestionBtn);
    expect(mockOnChange).toHaveBeenCalled();
    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(lastCall.extracted.constraints).toContain('避免使用缩写');
  });
});


