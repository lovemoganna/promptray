import { useCallback } from 'react';
import { PromptFormData, ExampleMode } from '../../types';
import { runGeminiPrompt } from '../../services/geminiService';
import { saveDirectoryHandle, getDirectoryHandle } from '../../services/storageService';

type NotifyFn = (message: string, type: 'success' | 'info' | 'error') => void;

interface UsePromptExamplesLogicParams {
  formData: PromptFormData;
  setFormData: React.Dispatch<React.SetStateAction<PromptFormData>>;
  onNotify?: NotifyFn;
  setIsGeneratingExamples: (v: boolean) => void;
  setAutoFillingIndex: (v: number | null) => void;
}

export const usePromptExamplesLogic = ({
  formData,
  setFormData,
  onNotify,
  setIsGeneratingExamples,
  setAutoFillingIndex,
}: UsePromptExamplesLogicParams) => {
  const handleAddExample = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      examples: [...(prev.examples || []), { input: '', output: '' }],
    }));
  }, [setFormData]);

  const handleUpdateExample = useCallback(
    (index: number, field: 'input' | 'output', value: string) => {
      setFormData(prev => {
        const newExamples = [...(prev.examples || [])];
        newExamples[index] = { ...newExamples[index], [field]: value };
        return { ...prev, examples: newExamples };
      });
    },
    [setFormData]
  );

  const handleRemoveExample = useCallback(
    (index: number) => {
      setFormData(prev => ({
        ...prev,
        examples: (prev.examples || []).filter((_, i) => i !== index),
      }));
    },
    [setFormData]
  );

  const handleClearExamples = useCallback(() => {
    setFormData(prev => ({ ...prev, examples: [] }));
  }, [setFormData]);

  // 多轮迭代生成：基于上一个示例进行优化
  const handleGenerateIterativeExample = useCallback(async () => {
    if (!formData.content && !formData.englishPrompt && !formData.chinesePrompt) {
      onNotify?.('请先为当前提示词填写内容，再让模型生成示例。', 'info');
      return;
    }

    const existingExamples = formData.examples || [];
    const iterativeExamples = existingExamples.filter(ex => ex.mode === 'iterative');
    const lastIterative = iterativeExamples[iterativeExamples.length - 1];

    // 如果没有迭代示例，使用最后一个独立示例作为起点
    const lastIndependent = existingExamples.filter(ex => !ex.mode || ex.mode === 'independent').slice(-1)[0];
    const baseExample = lastIterative || lastIndependent;

    if (!baseExample) {
      onNotify?.('请先使用"独立新增"模式生成第一个示例，然后再使用"多轮迭代"模式进行优化。', 'info');
      return;
    }

    setIsGeneratingExamples(true);
    try {
      const iterationIndex = lastIterative ? (lastIterative.iterationIndex !== undefined ? lastIterative.iterationIndex + 1 : 1) : 0;

      const basePrompt = `你是一名少样本提示词设计专家，正在为一个 Prompt 设计「示例系统」。
当前正在进行**多轮迭代优化**，基于上一轮的输出进行改进。

要求：
1. 分析上一轮输出的优点和不足
2. 生成一个改进版本，展示如何通过迭代优化得到更好的结果
3. 保持相同的 input，但优化 output 的质量
4. 严格使用 JSON 返回，返回格式如下：
{
  "input": "用户输入示例（与上一轮相同）",
  "output": "优化后的模型输出示例",
  "improvements": "简要说明本次优化的要点（1-2句话）"
}

当前提示词信息：
标题: ${formData.title || '未命名提示词'}
描述: ${formData.description || '（暂无描述）'}
英文提示词: ${formData.englishPrompt || formData.content || '（无）'}
中文提示词: ${formData.chinesePrompt || '（无）'}
系统指令: ${formData.systemInstruction || '（无）'}

${lastIterative
          ? `上一轮迭代（第${iterationIndex - 1}轮）：
输入: ${lastIterative.input}
输出: ${lastIterative.output}
${lastIterative.previousOutput ? `\n上上轮输出（供对比）:\n${lastIterative.previousOutput}` : ''}`
          : `基础示例（将作为迭代起点）：
输入: ${baseExample.input}
输出: ${baseExample.output}`}

请生成第${iterationIndex + 1}轮优化版本：`;

      const raw = await runGeminiPrompt(basePrompt, {
        model: formData.config?.model,
        temperature: formData.config?.temperature ?? 0.7,
        maxOutputTokens: formData.config?.maxOutputTokens ?? 2000,
        topP: formData.config?.topP,
        topK: formData.config?.topK,
      });

      // 使用相同的JSON解析逻辑
      let parsed: any = null;
      let newExample: { input: string; output: string; improvements?: string } | null = null;

      // 策略1: 提取markdown代码块
      const codeBlockMatch = raw.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        try {
          parsed = JSON.parse(codeBlockMatch[1]);
        } catch (e) { }
      }

      // 策略2: 提取第一个完整JSON对象
      if (!parsed) {
        try {
          const firstBrace = raw.indexOf('{');
          const lastBrace = raw.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            parsed = JSON.parse(raw.slice(firstBrace, lastBrace + 1));
          }
        } catch (e) { }
      }

      // 策略3: 正则提取
      if (!parsed) {
        const inputPattern = /"input"\s*:\s*"((?:[^"\\]|\\.|\\n)*)"|"input"\s*:\s*```([\s\S]*?)```/;
        const outputPattern = /"output"\s*:\s*"((?:[^"\\]|\\.|\\n)*)"|"output"\s*:\s*```([\s\S]*?)```/;
        const inputMatch = raw.match(inputPattern);
        const outputMatch = raw.match(outputPattern);

        if (inputMatch && outputMatch) {
          const inputValue = (inputMatch[1] || inputMatch[2] || '').replace(/\\n/g, '\n').replace(/\\"/g, '"');
          const outputValue = (outputMatch[1] || outputMatch[2] || '').replace(/\\n/g, '\n').replace(/\\"/g, '"');

          if (inputValue && outputValue) {
            newExample = {
              input: inputValue.trim(),
              output: outputValue.trim(),
            };
          }
        }
      }

      // 策略4: 从已解析JSON提取
      if (!newExample && parsed) {
        if (parsed.input && parsed.output) {
          newExample = {
            input: String(parsed.input).trim(),
            output: String(parsed.output).trim(),
            improvements: parsed.improvements ? String(parsed.improvements).trim() : undefined,
          };
        }
      }

      if (!newExample || !newExample.input || !newExample.output) {
        console.error('迭代生成失败 - 原始响应:', raw);
        throw new Error('无法解析模型返回的JSON格式，请稍后重试。');
      }

      // 追加迭代示例，标记为迭代模式
      setFormData(prev => ({
        ...prev,
        examples: [
          ...(prev.examples || []),
          {
            ...newExample!,
            mode: 'iterative' as ExampleMode,
            iterationIndex,
            previousOutput: lastIterative ? lastIterative.output : baseExample.output,
          },
        ],
      }));

      onNotify?.(
        `已生成第 ${iterationIndex} 轮迭代优化示例${newExample.improvements ? `：${newExample.improvements}` : ''}`,
        'success'
      );
    } catch (error) {
      console.error('handleGenerateIterativeExample error:', error);
      if (error instanceof Error) {
        onNotify?.(
          `迭代生成失败：${error.message}\n请检查网络或稍后重试。`,
          'error'
        );
      } else {
        onNotify?.('迭代生成失败：未知错误。请稍后重试。', 'error');
      }
    } finally {
      setIsGeneratingExamples(false);
    }
  }, [formData, onNotify, setFormData, setIsGeneratingExamples]);

  const handleGenerateExamplesWithModel = useCallback(async (append: boolean = false, mode: ExampleMode = 'independent') => {
    if (!formData.content && !formData.englishPrompt && !formData.chinesePrompt) {
      onNotify?.('请先为当前提示词填写内容，再让模型生成示例。', 'info');
      return;
    }

    setIsGeneratingExamples(true);
    const existingExamples = formData.examples || [];
    const existingCount = existingExamples.length;

    try {

      // 根据已有示例数量，生成不同场景的示例
      let scenarioHint = '';
      if (existingCount === 0) {
        scenarioHint = '这是一个全新的示例集合，请生成第一个示例，展示一个典型的正常使用场景。';
      } else if (existingCount === 1) {
        scenarioHint = '已有1个示例，请生成第二个示例，展示一个边界或特殊情况。';
      } else if (existingCount === 2) {
        scenarioHint = '已有2个示例，请生成第三个示例，展示一个异常或错误处理场景。';
      } else {
        scenarioHint = `已有${existingCount}个示例，请生成一个新的示例，展示一个不同的使用场景或角度。`;
      }

      const basePrompt = `你是一名少样本提示词设计专家，正在为一个 Prompt 设计「示例系统」。
请基于下面的信息，生成 1 组高质量的 few-shot 示例。

要求：
1. 示例包含两个字段：input（用户输入示例）、output（理想的模型输出示例）。
2. ${scenarioHint}
3. 示例要尽量贴近真实使用情境，语气和风格要与提示词保持一致。
4. 严格使用 JSON 返回，返回格式如下，不要添加任何解释文本：
{
  "input": "用户输入示例",
  "output": "模型输出示例"
}

当前提示词信息：
标题: ${formData.title || '未命名提示词'}
描述: ${formData.description || '（暂无描述）'}
英文提示词: ${formData.englishPrompt || formData.content || '（无）'}
中文提示词: ${formData.chinesePrompt || '（无）'}
系统指令: ${formData.systemInstruction || '（无）'}

${existingCount > 0 ? `已有示例（供参考，避免重复）：\n${existingExamples.map((ex, i) => `示例${i + 1}:\n输入: ${ex.input}\n输出: ${ex.output}`).join('\n\n')}` : ''}`;

      const raw = await runGeminiPrompt(basePrompt, {
        model: formData.config?.model,
        temperature: formData.config?.temperature ?? 0.7,
        maxOutputTokens: formData.config?.maxOutputTokens ?? 1500, // 减少token数，因为只生成1个
        topP: formData.config?.topP,
        topK: formData.config?.topK,
      });

      // 增强的JSON解析逻辑，支持多种格式
      let parsed: any = null;
      let newExample: { input: string; output: string } | null = null;

      // 策略1: 尝试提取markdown代码块中的JSON（改进：支持多行和嵌套）
      // 匹配 ```json ... ``` 或 ``` ... ``` 格式，使用非贪婪匹配以处理嵌套大括号
      const codeBlockPattern = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
      let codeBlockMatch = raw.match(codeBlockPattern);

      // 如果第一次匹配失败，尝试更宽松的匹配（允许代码块中有换行和更多内容）
      if (!codeBlockMatch) {
        const relaxedPattern = /```(?:json)?\s*([\s\S]*?)\s*```/;
        const relaxedMatch = raw.match(relaxedPattern);
        if (relaxedMatch && relaxedMatch[1]) {
          // 尝试从匹配的内容中提取JSON对象（找到第一个 { 到最后一个 }）
          const jsonStart = relaxedMatch[1].indexOf('{');
          const jsonEnd = relaxedMatch[1].lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            codeBlockMatch = [relaxedMatch[0], relaxedMatch[1].slice(jsonStart, jsonEnd + 1)];
          }
        }
      }

      if (codeBlockMatch && codeBlockMatch[1]) {
        try {
          // 清理可能的额外空白字符
          const jsonText = codeBlockMatch[1].trim();
          parsed = JSON.parse(jsonText);
        } catch (e) {
          // 如果直接解析失败，尝试提取更精确的范围
          const firstBrace = codeBlockMatch[1].indexOf('{');
          const lastBrace = codeBlockMatch[1].lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            try {
              parsed = JSON.parse(codeBlockMatch[1].slice(firstBrace, lastBrace + 1));
            } catch (e2) {
              // 继续尝试其他策略
            }
          }
        }
      }

      // 策略2: 尝试提取第一个完整的JSON对象
      if (!parsed) {
        try {
          // 找到第一个 { 和最后一个 }
          const firstBrace = raw.indexOf('{');
          const lastBrace = raw.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const jsonText = raw.slice(firstBrace, lastBrace + 1);
            parsed = JSON.parse(jsonText);
          }
        } catch (e) {
          // 继续尝试其他策略
        }
      }

      // 策略3: 尝试使用正则提取input和output字段（支持多行字符串和特殊字符）
      if (!parsed) {
        // 改进的正则：支持多行字符串、转义字符、以及可能的换行
        // 匹配 "input": "..." 或 "input": ```...```
        const inputPattern = /"input"\s*:\s*"((?:[^"\\]|\\.|\\n|\\r|\\t)*)"|"input"\s*:\s*```([\s\S]*?)```|"input"\s*:\s*'([^']*)'/;
        const outputPattern = /"output"\s*:\s*"((?:[^"\\]|\\.|\\n|\\r|\\t)*)"|"output"\s*:\s*```([\s\S]*?)```|"output"\s*:\s*'([^']*)'/;

        const inputMatch = raw.match(inputPattern);
        const outputMatch = raw.match(outputPattern);

        if (inputMatch && outputMatch) {
          // 提取值，支持多种格式
          let inputValue = inputMatch[1] || inputMatch[2] || inputMatch[3] || '';
          let outputValue = outputMatch[1] || outputMatch[2] || outputMatch[3] || '';

          // 处理转义字符
          inputValue = inputValue
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
          outputValue = outputValue
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');

          if (inputValue && outputValue) {
            newExample = {
              input: inputValue.trim(),
              output: outputValue.trim(),
            };
          }
        }
      }

      // 策略4: 如果已解析JSON，提取数据
      if (!newExample && parsed) {
        if (parsed.input && parsed.output) {
          // 单个对象格式
          newExample = {
            input: String(parsed.input).trim(),
            output: String(parsed.output).trim(),
          };
        } else if (Array.isArray(parsed.examples) && parsed.examples.length > 0) {
          // 数组格式（兼容旧格式）
          const first = parsed.examples[0];
          if (first?.input && first?.output) {
            newExample = {
              input: String(first.input).trim(),
              output: String(first.output).trim(),
            };
          }
        }
      }

      // 策略4.5: 如果JSON解析成功但字段名不匹配，尝试查找任何包含input/output的对象
      if (!newExample && parsed && typeof parsed === 'object') {
        // 查找可能的input/output字段（不区分大小写）
        const keys = Object.keys(parsed);
        const inputKey = keys.find(k => k.toLowerCase() === 'input');
        const outputKey = keys.find(k => k.toLowerCase() === 'output');
        if (inputKey && outputKey && parsed[inputKey] && parsed[outputKey]) {
          newExample = {
            input: String(parsed[inputKey]).trim(),
            output: String(parsed[outputKey]).trim(),
          };
        }
      }

      // 策略5: 尝试从纯文本中提取（最后的手段）
      if (!newExample) {
        // 尝试查找类似 "input": "..." 或 input: "..." 的模式
        const lines = raw.split('\n');
        let foundInput = '';
        let foundOutput = '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // 匹配 input 字段
          if (!foundInput && (line.includes('input') || line.includes('输入'))) {
            const match = line.match(/(?:input|输入)[:：]\s*["'`](.*?)["'`]/);
            if (match && match[1]) {
              foundInput = match[1];
            }
          }
          // 匹配 output 字段
          if (!foundOutput && (line.includes('output') || line.includes('输出'))) {
            const match = line.match(/(?:output|输出)[:：]\s*["'`](.*?)["'`]/);
            if (match && match[1]) {
              foundOutput = match[1];
            }
          }
        }

        if (foundInput && foundOutput) {
          newExample = {
            input: foundInput.trim(),
            output: foundOutput.trim(),
          };
        }
      }

      // 如果所有策略都失败，记录详细错误信息
      if (!newExample || !newExample.input || !newExample.output) {
        console.error('JSON解析失败 - 原始响应:', raw);
        console.error('解析后的对象:', parsed);
        console.error('提取的示例:', newExample);

        // 提供更友好的错误信息，包含原始响应的前200个字符
        const preview = raw.length > 200 ? raw.substring(0, 200) + '...' : raw;
        throw new Error(
          `无法解析模型返回的JSON格式。\n` +
          `原始响应预览：${preview}\n` +
          `请检查模型是否返回了正确的JSON格式，或尝试手动创建示例。`
        );
      }

      // 追加到现有列表，标记模式
      setFormData(prev => ({
        ...prev,
        examples: [...(prev.examples || []), { ...newExample!, mode }],
      }));

      const totalCount = existingCount + 1;
      onNotify?.(
        `已生成第 ${totalCount} 个示例${append ? '（已追加）' : ''}，建议生成 3-5 个示例覆盖不同场景。`,
        'success'
      );
    } catch (error) {
      console.error('handleGenerateExamplesWithModel error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        existingCount,
      });

      if (error instanceof Error) {
        // 处理服务过载
        if (error.message.includes('503') || error.message.includes('overloaded')) {
          onNotify?.(
            'Gemini 服务当前过载（503），你的 API Key 已生效，但暂时无法从模型获取示例，请稍后重试或暂时手动创建示例。',
            'info'
          );
        }
        // 处理超时
        else if (error.message.includes('timeout')) {
          onNotify?.(
            '请求超时，模型响应时间过长。请稍后重试，或尝试手动创建示例。',
            'error'
          );
        }
        // 处理JSON解析错误
        else if (error.message.includes('无法解析') || error.message.includes('JSON')) {
          // 错误信息已经包含了详细信息，直接显示
          onNotify?.(
            error.message,
            'error'
          );
        }
        // 其他错误
        else {
          onNotify?.(
            `自动生成示例失败：${error.message}\n请检查网络连接或稍后重试，必要时可手动创建示例。`,
            'error'
          );
        }
      } else {
        onNotify?.(
          '自动生成示例失败：未知错误。请检查网络或稍后重试，必要时可手动创建示例。',
          'error'
        );
      }
    } finally {
      setIsGeneratingExamples(false);
    }
  }, [formData, onNotify, setFormData, setIsGeneratingExamples]);

  const handleAutoFillExampleOutput = useCallback(
    async (index: number) => {
      const currentExamples = formData.examples || [];
      const target = currentExamples[index];

      if (!target || !target.input) {
        onNotify?.('请先为该示例填写用户输入内容，再让模型补全输出。', 'info');
        return;
      }

      setAutoFillingIndex(index);
      try {
        const prompt = `你是一名用于 few-shot 学习的示例助手。
请根据下面的「总体提示词」和「示例输入」，生成一个高质量的「示例输出」，用于教会模型应该如何回答。

要求：
1. 输出内容要足够具体，尽量展示结构和风格。
2. 不要解释你在做什么，直接给出期望的模型输出内容。
3. 不要使用占位符，使用真实自然的内容。

总体提示词（可能包含中英文混排）：
${formData.englishPrompt || formData.content || ''}

系统指令（如果有）：
${formData.systemInstruction || '（无）'}

示例输入：
${target.input}`;

        const raw = await runGeminiPrompt(prompt, {
          model: formData.config?.model,
          temperature: formData.config?.temperature ?? 0.7,
          maxOutputTokens: formData.config?.maxOutputTokens ?? 2000,
          topP: formData.config?.topP,
          topK: formData.config?.topK,
        });

        const outputText = raw.trim();

        setFormData(prev => {
          const next = [...(prev.examples || [])];
          next[index] = { ...next[index], output: outputText };
          return { ...prev, examples: next };
        });

        onNotify?.('已为该示例生成参考输出，你可以继续修改。', 'success');
      } catch (error) {
        console.error('handleAutoFillExampleOutput error:', error);
        onNotify?.('自动补全示例输出失败，请稍后重试。', 'error');
      } finally {
        setAutoFillingIndex(null);
      }
    },
    [formData, onNotify, setFormData, setAutoFillingIndex]
  );

  // 导出示例到本地文件（优化：如果已选择目录，直接保存，不弹出确认框）
  const handleExportExamples = useCallback(async () => {
    const examples = formData.examples || [];
    if (examples.length === 0) {
      onNotify?.('没有可导出的示例', 'info');
      return;
    }

    const exportData = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      promptTitle: formData.title || 'Untitled Prompt',
      examples: examples,
      metadata: {
        totalCount: examples.length,
        independentCount: examples.filter(ex => !ex.mode || ex.mode === 'independent').length,
        iterativeCount: examples.filter(ex => ex.mode === 'iterative').length,
      }
    };

    // 修复文件名生成逻辑：支持中文，仅替换文件系统非法字符
    const sanitizedTitle = (formData.title || 'untitled').replace(/[\\/:*?"<>|]/g, '_');
    const fileName = `${sanitizedTitle}_${Date.now()}.json`;
    const fileContent = JSON.stringify(exportData, null, 2);

    // 检查是否已选择目录（通过 IDB 获取 Handle）
    let dirHandle = await getDirectoryHandle('examples_dir_handle');

    // 如果已有 Handle，尝试直接保存
    if (dirHandle) {
      try {
        // 检查权限
        const permissionOptions = { mode: 'readwrite' };
        if ((await dirHandle.queryPermission(permissionOptions)) !== 'granted') {
          // 请求权限
          if ((await dirHandle.requestPermission(permissionOptions)) !== 'granted') {
            throw new Error('Permission denied');
          }
        }

        // 获取文件句柄并写入
        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(fileContent);
        await writable.close();

        onNotify?.(`已导出到: ${dirHandle.name}/${fileName}`, 'success');
        return;
      } catch (error: any) {
        console.warn("Direct save failed, falling back to picker:", error);
        // Handle失效或权限被拒，降级处理
      }
    }

    // 回退方案：使用 showSaveFilePicker (如果支持)
    if ('showSaveFilePicker' in window) {
      try {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: 'JSON files',
            accept: { 'application/json': ['.json'] }
          }]
        });

        const writable = await fileHandle.createWritable();
        await writable.write(fileContent);
        await writable.close();

        onNotify?.(`已导出 ${examples.length} 个示例到文件`, 'success');
        return;
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        console.error('File System Access API failed', error);
      }
    }

    // 最终回退方案：传统下载
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(fileContent);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    onNotify?.(`已导出 ${examples.length} 个示例到文件`, 'success');
  }, [formData.examples, formData.title, onNotify]);

  // 从本地文件导入示例
  const handleImportExamples = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        let importedExamples: any[] = [];

        // 支持多种格式
        if (Array.isArray(parsed)) {
          importedExamples = parsed;
        } else if (parsed.examples && Array.isArray(parsed.examples)) {
          importedExamples = parsed.examples;
        } else if (parsed.data && Array.isArray(parsed.data)) {
          importedExamples = parsed.data;
        } else {
          throw new Error('无法识别的文件格式');
        }

        // 验证示例格式
        const validExamples = importedExamples.filter((ex: any) =>
          ex &&
          typeof ex === 'object' &&
          typeof ex.input === 'string' &&
          typeof ex.output === 'string'
        );

        if (validExamples.length === 0) {
          onNotify?.('文件中没有有效的示例', 'error');
          return;
        }

        // 合并到现有示例（避免重复）
        setFormData(prev => {
          const existing = prev.examples || [];
          const existingHashes = new Set(
            existing.map(ex => `${ex.input.trim()}|${ex.output.trim()}`)
          );
          const newExamples = validExamples.filter((ex: any) => {
            const hash = `${ex.input.trim()}|${ex.output.trim()}`;
            return !existingHashes.has(hash);
          });

          const merged = [...existing, ...newExamples];
          onNotify?.(
            `已导入 ${newExamples.length} 个新示例${merged.length > existing.length + newExamples.length ? `（${merged.length - existing.length - newExamples.length} 个重复已跳过）` : ''}`,
            'success'
          );
          return { ...prev, examples: merged };
        });
      } catch (error) {
        console.error('Import error:', error);
        onNotify?.('导入失败：文件格式错误', 'error');
      }
    };
    reader.onerror = () => {
      onNotify?.('读取文件失败', 'error');
    };
    reader.readAsText(file);
  }, [setFormData, onNotify]);

  // 保存当前示例到历史记录
  const handleSaveToHistory = useCallback((name?: string, description?: string) => {
    const examples = formData.examples || [];
    if (examples.length === 0) {
      onNotify?.('没有可保存的示例', 'info');
      return;
    }

    const historyItem = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      examples: [...examples], // 深拷贝
      name: name || `快照 ${new Date().toLocaleString()}`,
      description,
    };

    // 保存到 localStorage
    const historyKey = `examples_history_${formData.title?.replace(/[^a-z0-9]/gi, '_') || 'default'}`;
    const existingHistory = localStorage.getItem(historyKey);
    let history: any[] = [];

    if (existingHistory) {
      try {
        history = JSON.parse(existingHistory);
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }

    // 添加到历史记录，保留最近 20 个
    history = [historyItem, ...history].slice(0, 20);
    localStorage.setItem(historyKey, JSON.stringify(history));

    onNotify?.(`已保存到历史记录：${historyItem.name}`, 'success');
    return historyItem;
  }, [formData.examples, formData.title, onNotify]);

  // 从历史记录加载
  const handleLoadFromHistory = useCallback((historyItem: any) => {
    setFormData(prev => ({
      ...prev,
      examples: [...historyItem.examples], // 深拷贝
    }));
    onNotify?.(`已从历史记录加载：${historyItem.name || '未命名'}`, 'success');
  }, [setFormData, onNotify]);

  // 获取历史记录列表
  const getHistoryList = useCallback((): any[] => {
    const historyKey = `examples_history_${formData.title?.replace(/[^a-z0-9]/gi, '_') || 'default'}`;
    const existingHistory = localStorage.getItem(historyKey);

    if (!existingHistory) return [];

    try {
      const history = JSON.parse(existingHistory);
      return Array.isArray(history) ? history : [];
    } catch (e) {
      console.error('Failed to parse history', e);
      return [];
    }
  }, [formData.title]);

  // 选择保存目录（使用 File System Access API，支持持久化权限）
  const handleSelectDirectory = useCallback(async (): Promise<string | null> => {
    // 检查浏览器是否支持 File System Access API
    if (!('showDirectoryPicker' in window)) {
      onNotify?.('您的浏览器不支持目录选择功能，请使用 Chrome 或 Edge 浏览器', 'info');
      return null;
    }

    try {
      const directoryHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'downloads'
      });

      // 保存 Handle 到 IndexedDB
      await saveDirectoryHandle('examples_dir_handle', directoryHandle);

      const dirName = directoryHandle.name;
      // 仅用于UI显示，不用于逻辑判断
      localStorage.setItem('examples_directory_name', dirName);

      onNotify?.(`已绑定目录: ${dirName}。导出时将自动保存到此目录。`, 'success');
      return dirName;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return null;
      }
      console.error('Directory selection error:', error);
      onNotify?.('选择目录失败，请重试', 'error');
      return null;
    }
  }, [onNotify]);

  return {
    handleAddExample,
    handleUpdateExample,
    handleRemoveExample,
    handleClearExamples,
    handleGenerateExamplesWithModel,
    handleGenerateIterativeExample,
    handleAutoFillExampleOutput,
    handleExportExamples,
    handleImportExamples,
    handleSaveToHistory,
    handleLoadFromHistory,
    getHistoryList,
    handleSelectDirectory,
  };
};


